import './style.css';
import { BLOCKS, HOTBAR, HOTBAR_VISIBLE } from './blocks';
import { MinecraftGame, type HudSnapshot } from './game';
import { createAtlasCanvas, tileIconDataUrl } from './textures';

const viewport = document.getElementById('viewport')!;
const overlay = document.getElementById('overlay')!;
const playBtn = document.getElementById('play')!;
const hotbarEl = document.getElementById('hotbar')!;
const fpsEl = document.getElementById('fps')!;
const selectedEl = document.getElementById('selected')!;

const atlas = createAtlasCanvas();
const slotEls: HTMLElement[] = [];

const paintHotbar = (selected: number, windowStart: number): void => {
  for (let i = 0; i < HOTBAR_VISIBLE; i++) {
    const el = slotEls[i];
    if (!el) continue;
    const index = windowStart + i;
    const id = HOTBAR[index];
    const def = id !== undefined ? BLOCKS[id] : undefined;
    el.classList.toggle('selected', index === selected);
    el.classList.toggle('empty', !def);
    const swatch = el.querySelector('.swatch') as HTMLElement | null;
    const key = el.querySelector('.key') as HTMLElement | null;
    if (key) key.textContent = String(i + 1);
    if (swatch && def) {
      swatch.style.backgroundImage = `url(${tileIconDataUrl(atlas, def.textures[0]!)})`;
      swatch.style.visibility = 'visible';
    } else if (swatch) {
      swatch.style.visibility = 'hidden';
    }
  }
};

const buildHotbar = (): void => {
  hotbarEl.innerHTML = '';
  slotEls.length = 0;
  for (let i = 0; i < HOTBAR_VISIBLE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.offset = String(i);

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = String(i + 1);

    const swatch = document.createElement('div');
    swatch.className = 'swatch';

    slot.append(key, swatch);
    hotbarEl.appendChild(slot);
    slotEls.push(slot);
  }
  paintHotbar(0, 0);
};

const onHud = (hud: HudSnapshot): void => {
  fpsEl.textContent = `${hud.fps} FPS`;
  selectedEl.textContent = hud.blockName;
  paintHotbar(hud.selected, game.hotbarWindowStart());
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
  if (!slot?.dataset.offset) return;
  const index = game.hotbarWindowStart() + Number(slot.dataset.offset);
  game.selectSlot(index);
});

hotbarEl.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    game.cycleHotbar(e.deltaY > 0 ? 1 : -1);
  },
  { passive: false },
);
