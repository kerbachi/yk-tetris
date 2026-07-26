import * as THREE from 'three';
import { isBreakable, isSolid, type BlockId } from './blocks';
import {
  HOTBAR_SIZE,
  createDefaultHotbar,
  getTool,
  giveItem,
  itemName,
  type HotbarSlot,
} from './items';
import { meshChunk } from './mesher';
import {
  createDrop,
  damageMob,
  rayHitMob,
  spawnMobs,
  updateDrop,
  updateMob,
  type DropEntity,
  type Mob,
} from './mobs';
import { createMobMesh, syncMobMesh } from './mobRender';
import {
  createPlayer,
  eyePosition,
  lookDirection,
  updatePlayer,
  type InputState,
  type PlayerState,
} from './player';
import { raycast, type RayHit } from './raycast';
import { createAtlasCanvas } from './textures';
import { mineDuration } from './tools';
import { World, chunkKey } from './world';

export interface HudSnapshot {
  selected: number;
  itemName: string;
  item: HotbarSlot;
  hotbar: HotbarSlot[];
  fps: number;
  locked: boolean;
  inventoryOpen: boolean;
  miningProgress: number;
  swinging: boolean;
  pickupMessage: string | null;
}

export class MinecraftGame {
  readonly world: World;
  readonly player: PlayerState;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private readonly chunkMeshes = new Map<string, THREE.Mesh>();
  private readonly atlasTexture: THREE.CanvasTexture;
  private readonly material: THREE.MeshLambertMaterial;
  private readonly highlight: THREE.LineSegments;
  private readonly highlightMat: THREE.LineBasicMaterial;
  readonly atlasCanvas: HTMLCanvasElement;
  private readonly input: InputState = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  };

  private selected = 0;
  private hotbar: HotbarSlot[] = createDefaultHotbar();
  private locked = false;
  private playing = false;
  private inventoryOpen = false;
  private running = false;
  private last = 0;
  private frames = 0;
  private fps = 0;
  private fpsTimer = 0;
  private hit: RayHit | null = null;
  private readonly container: HTMLElement;
  private readonly onHud: (hud: HudSnapshot) => void;
  private raf = 0;

  private mining = false;
  private mineProgress = 0;
  private mineTarget: { x: number; y: number; z: number } | null = null;
  private swingTimer = 0;
  private attackCooldown = 0;
  private pickupMessage: string | null = null;
  private pickupMessageTimer = 0;

  private mobs: Mob[] = [];
  private drops: DropEntity[] = [];
  private readonly mobMeshes = new Map<number, THREE.Group>();
  private readonly dropMeshes = new Map<number, THREE.Mesh>();
  private readonly dropMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });

  constructor(container: HTMLElement, onHud: (hud: HudSnapshot) => void, seed = 42) {
    this.container = container;
    this.onHud = onHud;
    this.world = new World(seed);
    const spawn = this.world.spawnPoint();
    this.player = createPlayer(spawn.x, spawn.y, spawn.z);
    this.mobs = spawnMobs(this.world, seed);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87b7e8);
    this.scene.fog = new THREE.Fog(0x87b7e8, 60, 140);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 250);
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbfdfff, 0x4a5a3a, 0.9);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d6, 1.15);
    sun.position.set(40, 80, 20);
    this.scene.add(sun);

    this.atlasCanvas = createAtlasCanvas();
    this.atlasTexture = new THREE.CanvasTexture(this.atlasCanvas);
    // Keep V=0 at the top of the canvas so tileUv() matches blit order.
    this.atlasTexture.flipY = false;
    this.atlasTexture.magFilter = THREE.NearestFilter;
    this.atlasTexture.minFilter = THREE.NearestFilter;
    this.atlasTexture.generateMipmaps = false;
    this.atlasTexture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
    });

    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this.highlightMat = new THREE.LineBasicMaterial({ color: 0x111111 });
    this.highlight = new THREE.LineSegments(edges, this.highlightMat);
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    this.rebuildDirtyChunks();
    for (const mob of this.mobs) this.ensureMobMesh(mob);
    this.bindEvents();
    this.resize();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.unbindEvents();
    for (const mesh of this.chunkMeshes.values()) {
      mesh.geometry.dispose();
      this.scene.remove(mesh);
    }
    this.chunkMeshes.clear();
    this.material.dispose();
    this.atlasTexture.dispose();
    this.highlight.geometry.dispose();
    this.highlightMat.dispose();
    this.dropMaterial.dispose();
    for (const mesh of this.mobMeshes.values()) this.scene.remove(mesh);
    for (const mesh of this.dropMeshes.values()) {
      mesh.geometry.dispose();
      this.scene.remove(mesh);
    }
    this.mobMeshes.clear();
    this.dropMeshes.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  getSelectedItem(): HotbarSlot {
    return this.hotbar[this.selected] ?? null;
  }

  getHotbar(): HotbarSlot[] {
    return this.hotbar;
  }

  setHotbarSlot(index: number, item: HotbarSlot): void {
    if (index < 0 || index >= HOTBAR_SIZE) return;
    this.hotbar[index] = item;
  }

  isInventoryOpen(): boolean {
    return this.inventoryOpen;
  }

  openInventory(): void {
    if (this.inventoryOpen) return;
    this.inventoryOpen = true;
    this.mining = false;
    this.resetMining();
    // Clear movement so the player doesn't keep walking while the menu is open.
    this.input.forward = false;
    this.input.back = false;
    this.input.left = false;
    this.input.right = false;
    this.input.jump = false;
    this.input.sprint = false;
    if (document.pointerLockElement) document.exitPointerLock();
  }

  closeInventory(relock = false): void {
    if (!this.inventoryOpen) return;
    this.inventoryOpen = false;
    if (relock) this.renderer.domElement.requestPointerLock();
  }

  toggleInventory(): void {
    if (this.inventoryOpen) this.closeInventory(true);
    else this.openInventory();
  }

  private tick(dt: number): void {
    if (this.locked && !this.inventoryOpen) {
      updatePlayer(this.world, this.player, this.input, dt);
    }

    if (this.attackCooldown > 0) this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    if (this.pickupMessageTimer > 0) {
      this.pickupMessageTimer = Math.max(0, this.pickupMessageTimer - dt);
      if (this.pickupMessageTimer === 0) this.pickupMessage = null;
    }

    this.updateMobsAndDrops(dt);

    const eye = eyePosition(this.player);
    const dir = lookDirection(this.player);
    this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.lookAt(eye.x + dir.x, eye.y + dir.y, eye.z + dir.z);

    this.hit =
      this.locked && !this.inventoryOpen
        ? raycast(this.world, eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, 6)
        : null;

    // Prefer mobs over blocks for highlight — hide block outline when aiming at a mob
    const mobAim = this.findAimedMob(eye, dir, 4);
    const aimingMob = !!mobAim;

    this.updateMining(dt, aimingMob);

    if (this.hit && !aimingMob) {
      this.highlight.position.set(this.hit.x + 0.5, this.hit.y + 0.5, this.hit.z + 0.5);
      this.highlight.visible = true;
      const t = this.mineProgress;
      const c = new THREE.Color().setRGB(0.07 + t * 0.9, 0.07 + t * 0.35, 0.07);
      this.highlightMat.color.copy(c);
    } else {
      this.highlight.visible = false;
      this.highlightMat.color.setHex(0x111111);
    }

    if (this.swingTimer > 0) this.swingTimer = Math.max(0, this.swingTimer - dt);

    this.rebuildDirtyChunks();
    this.renderer.render(this.scene, this.camera);

    this.frames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
    }

    const item = this.getSelectedItem();
    this.onHud({
      selected: this.selected,
      itemName: item ? itemName(item) : 'Hand',
      item,
      hotbar: [...this.hotbar],
      fps: this.fps,
      locked: this.locked,
      inventoryOpen: this.inventoryOpen,
      miningProgress: this.mineProgress,
      swinging: this.swingTimer > 0,
      pickupMessage: this.pickupMessage,
    });
  }

  private ensureMobMesh(mob: Mob): void {
    if (this.mobMeshes.has(mob.id)) return;
    const mesh = createMobMesh(mob.kind);
    syncMobMesh(mesh, mob);
    this.mobMeshes.set(mob.id, mesh);
    this.scene.add(mesh);
  }

  private disposeMobMesh(mesh: THREE.Group): void {
    mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) obj.material.dispose();
      }
    });
    this.scene.remove(mesh);
  }

  private updateMobsAndDrops(dt: number): void {
    for (const mob of this.mobs) {
      if (mob.dead) continue;
      updateMob(this.world, mob, dt);
      this.ensureMobMesh(mob);
      const mesh = this.mobMeshes.get(mob.id);
      if (mesh) syncMobMesh(mesh, mob);
    }

    // Remove dead mob meshes
    for (const mob of this.mobs) {
      if (!mob.dead) continue;
      const mesh = this.mobMeshes.get(mob.id);
      if (mesh) {
        this.disposeMobMesh(mesh);
        this.mobMeshes.delete(mob.id);
      }
    }
    this.mobs = this.mobs.filter((m) => !m.dead);

    for (const drop of this.drops) {
      updateDrop(this.world, drop, dt);
      let mesh = this.dropMeshes.get(drop.id);
      if (!mesh) {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), this.dropMaterial.clone());
        const color =
          drop.item.kind === 'loot'
            ? drop.item.id === 'feather'
              ? 0xf0f0f5
              : drop.item.id === 'leather'
                ? 0x965a32
                : drop.item.id === 'wool'
                  ? 0xececf0
                  : 0xd07070
            : 0xffffff;
        (mesh.material as THREE.MeshLambertMaterial).color.setHex(color);
        this.dropMeshes.set(drop.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(drop.x, drop.y + 0.15 + Math.sin(drop.age * 4) * 0.05, drop.z);
      mesh.rotation.y = drop.age * 2;
    }

    // Pickup
    if (this.locked && !this.inventoryOpen) {
      const remaining: DropEntity[] = [];
      for (const drop of this.drops) {
        const dx = drop.x - this.player.x;
        const dy = drop.y - (this.player.y + 0.9);
        const dz = drop.z - this.player.z;
        if (dx * dx + dy * dy + dz * dz < 1.6 * 1.6) {
          if (giveItem(this.hotbar, drop.item)) {
            this.pickupMessage = `+ ${itemName(drop.item)}`;
            this.pickupMessageTimer = 2;
            const mesh = this.dropMeshes.get(drop.id);
            if (mesh) {
              (mesh.material as THREE.Material).dispose();
              mesh.geometry.dispose();
              this.scene.remove(mesh);
              this.dropMeshes.delete(drop.id);
            }
            continue;
          }
        }
        // Despawn after 60s
        if (drop.age > 60) {
          const mesh = this.dropMeshes.get(drop.id);
          if (mesh) {
            (mesh.material as THREE.Material).dispose();
            mesh.geometry.dispose();
            this.scene.remove(mesh);
            this.dropMeshes.delete(drop.id);
          }
          continue;
        }
        remaining.push(drop);
      }
      this.drops = remaining;
    }
  }

  private findAimedMob(
    eye: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number },
    maxDist: number,
  ): { mob: Mob; dist: number } | null {
    let best: { mob: Mob; dist: number } | null = null;
    for (const mob of this.mobs) {
      if (mob.dead) continue;
      const d = rayHitMob(eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, mob, maxDist);
      if (d == null) continue;
      if (!best || d < best.dist) best = { mob, dist: d };
    }
    if (!best) return null;
    // Block occludes mob?
    if (this.hit && this.hit.distance < best.dist) return null;
    return best;
  }

  private tryAttackMob(): boolean {
    if (this.attackCooldown > 0 || this.inventoryOpen || !this.locked) return false;
    const eye = eyePosition(this.player);
    const dir = lookDirection(this.player);
    const aimed = this.findAimedMob(eye, dir, 4);
    if (!aimed) return false;

    const tool = getTool(this.getSelectedItem());
    let dmg = 1;
    if (tool?.kind === 'sword') dmg = 3 + Math.floor(tool.speed / 3);
    else if (tool) dmg = 2;

    const knockYaw = Math.atan2(dir.x, -dir.z);
    const drops = damageMob(aimed.mob, dmg, knockYaw);
    this.attackCooldown = 0.45;
    this.swingTimer = 0.25;

    if (drops) {
      for (const item of drops) {
        this.drops.push(createDrop(item, aimed.mob.x, aimed.mob.y + 0.5, aimed.mob.z));
      }
      this.pickupMessage = `${aimed.mob.kind} slain`;
      this.pickupMessageTimer = 1.5;
    }
    return true;
  }

  private updateMining(dt: number, aimingMob: boolean): void {
    if (
      !this.mining ||
      !this.locked ||
      this.inventoryOpen ||
      aimingMob ||
      !this.hit ||
      !isBreakable(this.hit.block)
    ) {
      this.resetMining();
      return;
    }

    const target = { x: this.hit.x, y: this.hit.y, z: this.hit.z };
    if (
      !this.mineTarget ||
      this.mineTarget.x !== target.x ||
      this.mineTarget.y !== target.y ||
      this.mineTarget.z !== target.z
    ) {
      this.mineTarget = target;
      this.mineProgress = 0;
    }

    const tool = getTool(this.getSelectedItem());
    const duration = mineDuration(this.hit.block, tool);
    this.mineProgress += dt / duration;
    this.swingTimer = 0.2;

    if (this.mineProgress >= 1) {
      this.world.set(target.x, target.y, target.z, 0);
      this.resetMining();
    }
  }

  private resetMining(): void {
    this.mineProgress = 0;
    this.mineTarget = null;
  }

  selectSlot(index: number): void {
    if (index < 0 || index >= HOTBAR_SIZE) return;
    this.selected = index;
    this.resetMining();
  }

  cycleHotbar(delta: number): void {
    this.selected = (this.selected + delta + HOTBAR_SIZE) % HOTBAR_SIZE;
    this.resetMining();
  }

  private rebuildDirtyChunks(): void {
    if (this.world.dirty.size === 0) return;
    const keys = [...this.world.dirty];
    this.world.dirty.clear();
    for (const key of keys) {
      const [cx, cy, cz] = key.split(',').map(Number) as [number, number, number];
      this.buildChunk(cx, cy, cz);
    }
  }

  private buildChunk(cx: number, cy: number, cz: number): void {
    const key = chunkKey(cx, cy, cz);
    const data = meshChunk(this.world, cx, cy, cz);
    let mesh = this.chunkMeshes.get(key);
    if (!mesh) {
      mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
      this.chunkMeshes.set(key, mesh);
      this.scene.add(mesh);
    } else {
      mesh.geometry.dispose();
      mesh.geometry = new THREE.BufferGeometry();
    }

    const geo = mesh.geometry;
    if (data.indices.length === 0) {
      return;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
  }

  private placeBlock(): void {
    if (!this.hit || this.inventoryOpen) return;
    const item = this.getSelectedItem();
    if (!item || item.kind !== 'block') return;
    const id: BlockId = item.id;
    const { px, py, pz } = this.hit;
    if (isSolid(this.world.get(px, py, pz))) return;
    const half = 0.3;
    if (
      px + 1 > this.player.x - half &&
      px < this.player.x + half &&
      py + 1 > this.player.y &&
      py < this.player.y + 1.7 &&
      pz + 1 > this.player.z - half &&
      pz < this.player.z + half
    ) {
      return;
    }
    this.world.set(px, py, pz, id);
    this.swingTimer = 0.15;
  }

  private resize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'KeyE') {
      e.preventDefault();
      if (this.playing || this.inventoryOpen) this.toggleInventory();
      return;
    }
    if (e.code === 'Escape') {
      if (this.inventoryOpen) {
        e.preventDefault();
        this.closeInventory(false);
        return;
      }
      if (this.locked) document.exitPointerLock();
      return;
    }

    if (this.inventoryOpen) {
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        this.selectSlot(Number(e.code.slice(5)) - 1);
      }
      return;
    }

    if (e.code === 'KeyW') this.input.forward = true;
    if (e.code === 'KeyS') this.input.back = true;
    if (e.code === 'KeyA') this.input.left = true;
    if (e.code === 'KeyD') this.input.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.input.jump = true;
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = true;
    if (e.code >= 'Digit1' && e.code <= 'Digit9') {
      this.selectSlot(Number(e.code.slice(5)) - 1);
    }
  };

  private onWheel = (e: WheelEvent): void => {
    if (!this.locked || this.inventoryOpen) return;
    e.preventDefault();
    this.cycleHotbar(e.deltaY > 0 ? 1 : -1);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'KeyW') this.input.forward = false;
    if (e.code === 'KeyS') this.input.back = false;
    if (e.code === 'KeyA') this.input.left = false;
    if (e.code === 'KeyD') this.input.right = false;
    if (e.code === 'Space') this.input.jump = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.locked) return;
    const sens = 0.0022;
    this.player.yaw -= e.movementX * sens;
    this.player.pitch -= e.movementY * sens;
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (this.inventoryOpen) return;
    if (!this.locked) {
      this.renderer.domElement.requestPointerLock();
      return;
    }
    if (e.button === 0) {
      if (this.tryAttackMob()) return;
      this.mining = true;
      this.swingTimer = 0.2;
    }
    if (e.button === 2) this.placeBlock();
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mining = false;
      this.resetMining();
    }
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private onPointerLockChange = (): void => {
    this.locked = document.pointerLockElement === this.renderer.domElement;
    if (this.locked) this.playing = true;
    if (!this.locked) {
      this.mining = false;
      this.resetMining();
    }
  };

  private bindEvents(): void {
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
