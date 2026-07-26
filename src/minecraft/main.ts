import './style.css';
import { BLOCKS, HOTBAR } from './blocks';
import { MinecraftGame, type HudSnapshot } from './game';
import { createAtlasCanvas, tileIconDataUrl } from './textures';

const viewport = document.getElementById('viewport')!;
const overlay = document.getElementById('overlay')!;
const playBtn = document.getElementById('play')!;
const hotbarEl = document.getElementById('hotbar')!;
const fpsEl = document.getElementById('fps')!;
const selectedEl = document.getElementById('selected')!;

const slotEls: HTMLElement[] = [];
const atlas = createAtlasCanvas();

const paintHotbar = (selected: number): void => {
  for (let i = 0; i < HOTBAR.length; i++) {
    const el = slotEls[i];
    if (!el) continue;
    el.classList.toggle('selected', i === selected);
  }
};

const buildHotbar = (): void => {
  hotbarEl.innerHTML = '';
  HOTBAR.forEach((id, i) => {
    const def = BLOCKS[id]!;
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = String(i);

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = String(i + 1);

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    // Prefer top face texture (grass top, wood rings, etc.)
    swatch.style.backgroundImage = `url(${tileIconDataUrl(atlas, def.textures[0]!)})`;
    swatch.style.backgroundSize = 'cover';
    swatch.style.imageRendering = 'pixelated';

    slot.append(key, swatch);
    hotbarEl.appendChild(slot);
    slotEls.push(slot);
  });
  paintHotbar(0);
};

const onHud = (hud: HudSnapshot): void => {
  fpsEl.textContent = `${hud.fps} FPS`;
  selectedEl.textContent = hud.blockName;
  paintHotbar(hud.selected);
  if (hud.locked) overlay.classList.add('hidden');
  else overlay.classList.remove('hidden');
};

buildHotbar();

const game = new MinecraftGame(viewport, onHud, 42);
game.start();

playBtn.addEventListener('click', () => {
  const canvas = viewport.querySelector('canvas');
  canvas?.requestPointerLock();
});

hotbarEl.addEventListener('click', (e) => {
  const slot = (e.target as HTMLElement).closest('.slot') as HTMLElement | null;
  if (!slot?.dataset.index) return;
  game.selectSlot(Number(slot.dataset.index));
});
