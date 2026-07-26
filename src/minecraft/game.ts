import * as THREE from 'three';
import { HOTBAR, blockName, isBreakable, isSolid, type BlockId } from './blocks';
import { meshChunk } from './mesher';
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
import { World, chunkKey } from './world';

export interface HudSnapshot {
  selected: number;
  blockName: string;
  fps: number;
  locked: boolean;
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
  private locked = false;
  private running = false;
  private last = 0;
  private frames = 0;
  private fps = 0;
  private fpsTimer = 0;
  private hit: RayHit | null = null;
  private readonly container: HTMLElement;
  private readonly onHud: (hud: HudSnapshot) => void;
  private raf = 0;

  constructor(container: HTMLElement, onHud: (hud: HudSnapshot) => void, seed = 42) {
    this.container = container;
    this.onHud = onHud;
    this.world = new World(seed);
    const spawn = this.world.spawnPoint();
    this.player = createPlayer(spawn.x, spawn.y, spawn.z);

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
    // (Three's default flipY would sample the empty bottom row → black ground.)
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
    this.highlight = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x111111 }),
    );
    this.highlight.visible = false;
    this.scene.add(this.highlight);

    this.rebuildDirtyChunks();
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
    (this.highlight.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  getSelectedBlock(): BlockId {
    return HOTBAR[this.selected] ?? HOTBAR[0]!;
  }

  private tick(dt: number): void {
    if (this.locked) {
      updatePlayer(this.world, this.player, this.input, dt);
    }

    const eye = eyePosition(this.player);
    const dir = lookDirection(this.player);
    this.camera.position.set(eye.x, eye.y, eye.z);
    this.camera.lookAt(eye.x + dir.x, eye.y + dir.y, eye.z + dir.z);

    this.hit = this.locked
      ? raycast(this.world, eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, 6)
      : null;
    if (this.hit) {
      this.highlight.position.set(this.hit.x + 0.5, this.hit.y + 0.5, this.hit.z + 0.5);
      this.highlight.visible = true;
    } else {
      this.highlight.visible = false;
    }

    this.rebuildDirtyChunks();
    this.renderer.render(this.scene, this.camera);

    this.frames++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsTimer);
      this.frames = 0;
      this.fpsTimer = 0;
    }

    this.onHud({
      selected: this.selected,
      blockName: blockName(this.getSelectedBlock()),
      fps: this.fps,
      locked: this.locked,
    });
  }

  selectSlot(index: number): void {
    if (index < 0 || index >= HOTBAR.length) return;
    this.selected = index;
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

  private breakBlock(): void {
    if (!this.hit || !isBreakable(this.hit.block)) return;
    this.world.set(this.hit.x, this.hit.y, this.hit.z, 0);
  }

  private placeBlock(): void {
    if (!this.hit) return;
    const id = this.getSelectedBlock();
    const { px, py, pz } = this.hit;
    if (isSolid(this.world.get(px, py, pz))) return;
    // Don't place inside the player AABB
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
    if (e.code === 'KeyW') this.input.forward = true;
    if (e.code === 'KeyS') this.input.back = true;
    if (e.code === 'KeyA') this.input.left = true;
    if (e.code === 'KeyD') this.input.right = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.input.jump = true;
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.input.sprint = true;
    if (e.code >= 'Digit1' && e.code <= 'Digit8') {
      this.selected = Number(e.code.slice(5)) - 1;
    }
    if (e.code === 'Escape' && this.locked) {
      document.exitPointerLock();
    }
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
    if (!this.locked) {
      this.renderer.domElement.requestPointerLock();
      return;
    }
    if (e.button === 0) this.breakBlock();
    if (e.button === 2) this.placeBlock();
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private onPointerLockChange = (): void => {
    this.locked = document.pointerLockElement === this.renderer.domElement;
  };

  private bindEvents(): void {
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
