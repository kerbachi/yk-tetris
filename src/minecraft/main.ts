import './style.css';
import { BLOCKS } from './blocks';
import { MinecraftGame, type HudSnapshot } from './game';
import { HOTBAR, HOTBAR_VISIBLE, type HotbarItem } from './items';
import { createAtlasCanvas, tileIconDataUrl } from './textures';
import { TOOLS } from './tools';
import { toolIconDataUrl } from './toolIcons';

const viewport = document.getElementById('viewport')!;
const overlay = document.getElementById('overlay')!;
const playBtn = document.getElementById('play')!;
const hotbarEl = document.getElementById('hotbar')!;
const fpsEl = document.getElementById('fps')!;
const selectedEl = document.getElementById('selected')!;
const heldEl = document.getElementById('held-item') as HTMLImageElement;
const breakBar = document.getElementById('break-bar')!;
const breakFill = document.getElementById('break-fill')!;

const atlas = createAtlasCanvas();
const slotEls: HTMLElement[] = [];

const itemIconUrl = (item: HotbarItem): string => {
  if (item.kind === 'tool') {
    return toolIconDataUrl(TOOLS[item.id]!);
  }
  const def = BLOCKS[item.id]!;
  return tileIconDataUrl(atlas, def.textures[0]!);
};

const paintHotbar = (selected: number, windowStart: number): void => {
  for (let i = 0; i < HOTBAR_VISIBLE; i++) {
    const el = slotEls[i];
    if (!el) continue;
    const index = windowStart + i;
    const item = HOTBAR[index];
    el.classList.toggle('selected', index === selected);
    el.classList.toggle('empty', !item);
    el.classList.toggle('tool', item?.kind === 'tool');
    const swatch = el.querySelector('.swatch') as HTMLElement | null;
    const key = el.querySelector('.key') as HTMLElement | null;
    if (key) key.textContent = String(i + 1);
    if (swatch && item) {
      swatch.style.backgroundImage = `url(${itemIconUrl(item)})`;
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
  selectedEl.textContent = hud.itemName;
  paintHotbar(hud.selected, game.hotbarWindowStart());
  heldEl.src = itemIconUrl(hud.item);
  heldEl.alt = hud.itemName;
  heldEl.classList.toggle('swing', hud.swinging);
  heldEl.classList.toggle('hidden', !hud.locked);

  if (hud.miningProgress > 0 && hud.miningProgress < 1) {
    breakBar.classList.remove('hidden');
    breakFill.style.width = `${Math.round(hud.miningProgress * 100)}%`;
  } else {
    breakBar.classList.add('hidden');
    breakFill.style.width = '0%';
  }

  if (hud.locked) overlay.classList.add('hidden');
  else overlay.classList.remove('hidden');
};

buildHotbar();

const game = new MinecraftGame(viewport, onHud, 42);
game.start();
// Initial held icon
heldEl.src = itemIconUrl(HOTBAR[0]!);

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
