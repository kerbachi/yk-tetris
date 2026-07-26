import './style.css';
import { BLOCKS } from './blocks';
import { MinecraftGame, type HudSnapshot } from './game';
import {
  HOTBAR_SIZE,
  createDefaultHotbar,
  inventoryItemsForTab,
  itemName,
  type HotbarItem,
  type HotbarSlot,
  type InventoryTab,
} from './items';
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
const inventoryEl = document.getElementById('inventory')!;
const invGrid = document.getElementById('inv-grid')!;
const invHotbar = document.getElementById('inv-hotbar')!;
const invCursor = document.getElementById('inv-cursor') as HTMLImageElement;
const invHint = document.getElementById('inv-hint')!;
const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));

const atlas = createAtlasCanvas();
const slotEls: HTMLElement[] = [];
const invHotbarSlots: HTMLElement[] = [];

let activeTab: InventoryTab = 'all';
let cursorItem: HotbarSlot = null;
let hasPlayed = false;

const itemIconUrl = (item: HotbarItem): string => {
  if (item.kind === 'tool') return toolIconDataUrl(TOOLS[item.id]!);
  return tileIconDataUrl(atlas, BLOCKS[item.id]!.textures[0]!);
};

const paintSlot = (el: HTMLElement, item: HotbarSlot, selected: boolean): void => {
  el.classList.toggle('selected', selected);
  el.classList.toggle('empty', !item);
  el.classList.toggle('tool', item?.kind === 'tool');
  const swatch = el.querySelector('.swatch') as HTMLElement | null;
  if (swatch && item) {
    swatch.style.backgroundImage = `url(${itemIconUrl(item)})`;
    swatch.style.visibility = 'visible';
  } else if (swatch) {
    swatch.style.backgroundImage = '';
    swatch.style.visibility = 'hidden';
  }
};

const paintHotbar = (selected: number, hotbar: HotbarSlot[]): void => {
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const el = slotEls[i];
    if (!el) continue;
    paintSlot(el, hotbar[i] ?? null, i === selected);
  }
};

const buildHotbar = (): void => {
  hotbarEl.innerHTML = '';
  slotEls.length = 0;
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.index = String(i);
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = String(i + 1);
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    slot.append(key, swatch);
    hotbarEl.appendChild(slot);
    slotEls.push(slot);
  }
  paintHotbar(0, createDefaultHotbar());
};

const updateCursorGhost = (clientX?: number, clientY?: number): void => {
  if (!cursorItem) {
    invCursor.classList.add('hidden');
    invHint.textContent = 'Click an item to pick it up · click a hotbar slot to place · E / Esc close';
    return;
  }
  invCursor.classList.remove('hidden');
  invCursor.src = itemIconUrl(cursorItem);
  invCursor.alt = itemName(cursorItem);
  if (clientX !== undefined && clientY !== undefined) {
    invCursor.style.left = `${clientX + 12}px`;
    invCursor.style.top = `${clientY + 12}px`;
  }
  invHint.textContent = `Holding ${itemName(cursorItem)} — click hotbar to place · right-click to drop`;
};

const renderInventoryGrid = (): void => {
  invGrid.innerHTML = '';
  for (const item of inventoryItemsForTab(activeTab)) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'inv-cell';
    cell.title = itemName(item);
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.backgroundImage = `url(${itemIconUrl(item)})`;
    cell.appendChild(swatch);
    cell.addEventListener('click', (e) => {
      e.preventDefault();
      // Creative-style: pick up a copy (or swap with cursor)
      if (!cursorItem) {
        cursorItem = { ...item } as HotbarItem;
      } else {
        cursorItem = { ...item } as HotbarItem;
      }
      updateCursorGhost(e.clientX, e.clientY);
    });
    invGrid.appendChild(cell);
  }
};

const paintInvHotbar = (selected: number, hotbar: HotbarSlot[]): void => {
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const el = invHotbarSlots[i];
    if (!el) continue;
    paintSlot(el, hotbar[i] ?? null, i === selected);
  }
};

const buildInvHotbar = (): void => {
  invHotbar.innerHTML = '';
  invHotbarSlots.length = 0;
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot inv-hot-slot';
    slot.dataset.index = String(i);
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = String(i + 1);
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    slot.append(key, swatch);
    slot.addEventListener('click', (e) => {
      e.preventDefault();
      const current = game.getHotbar()[i] ?? null;
      if (cursorItem) {
        game.setHotbarSlot(i, cursorItem);
        cursorItem = current;
        game.selectSlot(i);
      } else if (current) {
        cursorItem = current;
        game.setHotbarSlot(i, null);
      } else {
        game.selectSlot(i);
      }
      updateCursorGhost(e.clientX, e.clientY);
    });
    invHotbar.appendChild(slot);
    invHotbarSlots.push(slot);
  }
};

const setTab = (tab: InventoryTab): void => {
  activeTab = tab;
  for (const btn of tabButtons) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  }
  renderInventoryGrid();
};

const onHud = (hud: HudSnapshot): void => {
  if (hud.locked) hasPlayed = true;
  fpsEl.textContent = `${hud.fps} FPS`;
  selectedEl.textContent = hud.itemName;
  paintHotbar(hud.selected, hud.hotbar);
  paintInvHotbar(hud.selected, hud.hotbar);

  if (hud.item) {
    heldEl.src = itemIconUrl(hud.item);
    heldEl.alt = hud.itemName;
  }
  heldEl.classList.toggle('swing', hud.swinging);
  heldEl.classList.toggle('hidden', !hud.locked || hud.inventoryOpen || !hud.item);

  if (hud.miningProgress > 0 && hud.miningProgress < 1 && !hud.inventoryOpen) {
    breakBar.classList.remove('hidden');
    breakFill.style.width = `${Math.round(hud.miningProgress * 100)}%`;
  } else {
    breakBar.classList.add('hidden');
    breakFill.style.width = '0%';
  }

  if (hud.inventoryOpen) {
    inventoryEl.classList.remove('hidden');
    overlay.classList.add('hidden');
    document.body.classList.add('inventory-open');
  } else {
    inventoryEl.classList.add('hidden');
    document.body.classList.remove('inventory-open');
    cursorItem = null;
    updateCursorGhost();
    // Keep the start screen hidden after the first session; click the world to resume.
    if (!hasPlayed && !hud.locked) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
  }
};

buildHotbar();
buildInvHotbar();
setTab('all');

const game = new MinecraftGame(viewport, onHud, 42);
game.start();
heldEl.src = itemIconUrl(createDefaultHotbar()[0] as HotbarItem);

playBtn.addEventListener('click', () => {
  hasPlayed = true;
  overlay.classList.add('hidden');
  viewport.querySelector('canvas')?.requestPointerLock();
});

hotbarEl.addEventListener('click', (e) => {
  if (game.isInventoryOpen()) return;
  const slot = (e.target as HTMLElement).closest('.slot') as HTMLElement | null;
  if (!slot?.dataset.index) return;
  game.selectSlot(Number(slot.dataset.index));
});

hotbarEl.addEventListener(
  'wheel',
  (e) => {
    if (game.isInventoryOpen()) return;
    e.preventDefault();
    game.cycleHotbar(e.deltaY > 0 ? 1 : -1);
  },
  { passive: false },
);

for (const btn of tabButtons) {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab as InventoryTab;
    setTab(tab);
  });
}

inventoryEl.addEventListener('mousemove', (e) => {
  if (cursorItem) updateCursorGhost(e.clientX, e.clientY);
});

inventoryEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (cursorItem) {
    cursorItem = null;
    updateCursorGhost();
  }
});

document.getElementById('inv-close')?.addEventListener('click', () => {
  game.closeInventory(true);
});
