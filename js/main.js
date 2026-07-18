import { AudioEngine } from "./audio.js";
import {
  MissionRunner,
  loadProfile,
  saveProfile,
  playerLevelFromXp,
} from "./missions.js";
import {
  TetrisGame,
  renderBoard,
  drawPiecePreview,
} from "./tetris.js";

const audio = new AudioEngine();
let profile = loadProfile();
let game = null;
let missions = null;
let runXpBase = 0;
let loopId = null;
let lastDrop = 0;
let animId = null;

const els = {
  screens: {
    start: document.getElementById("screen-start"),
    howto: document.getElementById("screen-howto"),
    game: document.getElementById("screen-game"),
    over: document.getElementById("screen-over"),
  },
  startBest: document.getElementById("start-best"),
  startLevel: document.getElementById("start-level"),
  startXp: document.getElementById("start-xp"),
  hudScore: document.getElementById("hud-score"),
  hudLines: document.getElementById("hud-lines"),
  hudLevel: document.getElementById("hud-level"),
  hudXp: document.getElementById("hud-xp"),
  hudPlv: document.getElementById("hud-plv"),
  xpFill: document.getElementById("xp-fill"),
  missionText: document.getElementById("mission-text"),
  missionFill: document.getElementById("mission-fill"),
  missionReward: document.getElementById("mission-reward"),
  canvas: document.getElementById("game-canvas"),
  holdCanvas: document.getElementById("hold-canvas"),
  nextCanvas: document.getElementById("next-canvas"),
  comboFlash: document.getElementById("combo-flash"),
  pauseOverlay: document.getElementById("overlay-pause"),
  toast: document.getElementById("toast"),
  overScore: document.getElementById("over-score"),
  overLines: document.getElementById("over-lines"),
  overXp: document.getElementById("over-xp"),
  overMissions: document.getElementById("over-missions"),
  overMissionList: document.getElementById("over-mission-list"),
  btnMute: document.getElementById("btn-mute"),
};

function showScreen(name) {
  Object.entries(els.screens).forEach(([key, el]) => {
    el.classList.toggle("active", key === name);
  });
}

function refreshStartStats() {
  const { level, xpIntoLevel } = playerLevelFromXp(profile.totalXp);
  els.startBest.textContent = profile.bestScore.toLocaleString();
  els.startLevel.textContent = String(level);
  els.startXp.textContent = profile.totalXp.toLocaleString();
  void xpIntoLevel;
}

function updateHud() {
  if (!game) return;
  els.hudScore.textContent = game.score.toLocaleString();
  els.hudLines.textContent = String(game.lines);
  els.hudLevel.textContent = String(game.level);

  const total = profile.totalXp + (missions?.xpEarned || 0);
  const { level, xpIntoLevel, xpNeeded } = playerLevelFromXp(total);
  els.hudXp.textContent = String(total);
  els.hudPlv.textContent = String(level);
  els.xpFill.style.width = `${Math.min(100, (xpIntoLevel / xpNeeded) * 100)}%`;

  const active = missions?.active;
  if (active) {
    els.missionText.textContent = active.text;
    els.missionFill.style.width = `${(active.progress / active.target) * 100}%`;
    els.missionReward.textContent = `+${active.xp} XP`;
  } else if (missions) {
    els.missionText.textContent = "All missions complete!";
    els.missionFill.style.width = "100%";
    els.missionReward.textContent = `+${missions.xpEarned} XP`;
  }

  drawPiecePreview(els.nextCanvas, game.queue[0]);
  drawPiecePreview(els.holdCanvas, game.holdType);
}

function showToast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  requestAnimationFrame(() => els.toast.classList.add("show"));
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.classList.remove("show");
    setTimeout(() => {
      els.toast.hidden = true;
    }, 250);
  }, 2200);
}

function flashCombo(text) {
  els.comboFlash.hidden = false;
  els.comboFlash.textContent = text;
  els.comboFlash.style.animation = "none";
  // reflow
  void els.comboFlash.offsetWidth;
  els.comboFlash.style.animation = "";
  clearTimeout(flashCombo._t);
  flashCombo._t = setTimeout(() => {
    els.comboFlash.hidden = true;
  }, 700);
}

function handleMissionCompletes(list) {
  if (!list?.length) return;
  for (const m of list) {
    audio.mission();
    showToast(`Mission complete! ${m.text} (+${m.xp} XP)`);
  }
  const before = playerLevelFromXp(profile.totalXp + runXpBase);
  runXpBase = missions.xpEarned;
  const after = playerLevelFromXp(profile.totalXp + missions.xpEarned);
  if (after.level > before.level) {
    audio.levelUp();
    showToast(`Player level up! Lv ${after.level}`);
  }
  updateHud();
}

function applyLockResult(result, { fromHardDrop = false } = {}) {
  if (!result) return;
  if (result.pieces) {
    handleMissionCompletes(missions.bump("pieces", result.pieces));
  }
  if (result.linesCleared > 0) {
    audio.clear(result.linesCleared);
    if (result.linesCleared >= 2) {
      flashCombo(result.linesCleared === 4 ? "TETRIS!" : `${result.linesCleared} LINES`);
    }
    handleMissionCompletes(
      missions.update({
        lines: game.lines,
        score: game.score,
        maxCombo: game.maxCombo,
      })
    );
    if (result.isTetris) handleMissionCompletes(missions.bump("tetrises"));
    if (result.isDouble) handleMissionCompletes(missions.bump("doubles"));
  } else {
    if (!fromHardDrop) audio.lock();
    handleMissionCompletes(missions.update({ score: game.score }));
  }
  updateHud();
}

function endGame() {
  stopLoop();
  audio.gameOver();
  profile.totalXp += missions.xpEarned;
  profile.bestScore = Math.max(profile.bestScore, game.score);
  saveProfile(profile);

  els.overScore.textContent = game.score.toLocaleString();
  els.overLines.textContent = String(game.lines);
  els.overXp.textContent = String(missions.xpEarned);
  els.overMissions.textContent = String(missions.completedThisRun.length);
  els.overMissionList.innerHTML = missions.completedThisRun.length
    ? missions.completedThisRun
        .map((m) => `<li>${m.text} <strong>+${m.xp} XP</strong></li>`)
        .join("")
    : "<li>No missions completed this run</li>";

  els.pauseOverlay.hidden = true;
  showScreen("over");
  refreshStartStats();
}

function frame(ts) {
  if (!game || game.paused || game.gameOver) {
    animId = requestAnimationFrame(frame);
    return;
  }

  if (!lastDrop) lastDrop = ts;
  const interval = game.dropInterval;
  if (ts - lastDrop >= interval) {
    const result = game.tick();
    lastDrop = ts;
    if (result) applyLockResult(result);
    if (game.gameOver) {
      renderBoard(els.canvas, game);
      endGame();
      return;
    }
  }

  renderBoard(els.canvas, game);
  animId = requestAnimationFrame(frame);
}

function startLoop() {
  stopLoop();
  lastDrop = 0;
  animId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (animId) cancelAnimationFrame(animId);
  animId = null;
  if (loopId) clearInterval(loopId);
  loopId = null;
}

function startGame() {
  audio.ensure();
  audio.start();
  game = new TetrisGame();
  missions = new MissionRunner();
  runXpBase = 0;
  els.pauseOverlay.hidden = true;
  showScreen("game");
  updateMuteButton();
  updateHud();
  renderBoard(els.canvas, game);
  startLoop();
}

function pauseGame() {
  if (!game || game.gameOver) return;
  game.paused = true;
  els.pauseOverlay.hidden = false;
}

function resumeGame() {
  if (!game) return;
  game.paused = false;
  els.pauseOverlay.hidden = true;
  lastDrop = 0;
}

function quitToMenu() {
  stopLoop();
  game = null;
  missions = null;
  els.pauseOverlay.hidden = true;
  refreshStartStats();
  showScreen("start");
}

function updateMuteButton() {
  els.btnMute.textContent = audio.muted ? "Muted" : "Sound";
  els.btnMute.setAttribute("aria-pressed", audio.muted ? "true" : "false");
}

function doAction(action) {
  if (!game || game.gameOver) return;
  if (game.paused && action !== "pause") return;
  audio.ensure();

  switch (action) {
    case "left":
      if (game.move(-1, 0)) audio.move();
      break;
    case "right":
      if (game.move(1, 0)) audio.move();
      break;
    case "rotate":
      if (game.rotate()) audio.rotate();
      break;
    case "soft":
      game.softDropping = true;
      if (game.move(0, 1)) {
        audio.softDrop();
        handleMissionCompletes(missions.update({ score: game.score }));
      } else {
        applyLockResult(game.lock());
      }
      break;
    case "hard": {
      const { result } = game.hardDrop();
      if (result) {
        audio.hardDrop();
        handleMissionCompletes(missions.bump("hardDrops"));
        applyLockResult(result, { fromHardDrop: true });
      }
      break;
    }
    case "hold":
      if (game.hold()) {
        audio.hold();
        handleMissionCompletes(missions.bump("holds"));
      }
      break;
    case "pause":
      if (game.paused) resumeGame();
      else pauseGame();
      break;
    default:
      break;
  }

  if (game?.gameOver) {
    renderBoard(els.canvas, game);
    endGame();
    return;
  }
  updateHud();
  renderBoard(els.canvas, game);
}

// Soft drop release
function endSoft() {
  if (game) game.softDropping = false;
}

function bindControls() {
  document.querySelectorAll(".ctrl[data-action]").forEach((btn) => {
    const action = btn.dataset.action;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      doAction(action);
      if (action === "soft") {
        btn.setPointerCapture?.(e.pointerId);
      }
    });
    btn.addEventListener("pointerup", () => {
      if (action === "soft") endSoft();
    });
    btn.addEventListener("pointercancel", () => {
      if (action === "soft") endSoft();
    });
  });

  document.getElementById("btn-hold").addEventListener("click", () => doAction("hold"));
  document.getElementById("btn-pause").addEventListener("click", () => doAction("pause"));
  document.getElementById("btn-mute").addEventListener("click", () => {
    audio.ensure();
    audio.toggleMute();
    updateMuteButton();
  });

  document.getElementById("btn-play").addEventListener("click", startGame);
  document.getElementById("btn-howto").addEventListener("click", () => showScreen("howto"));
  document.getElementById("btn-howto-back").addEventListener("click", () => showScreen("start"));
  document.getElementById("btn-resume").addEventListener("click", resumeGame);
  document.getElementById("btn-quit").addEventListener("click", quitToMenu);
  document.getElementById("btn-again").addEventListener("click", startGame);
  document.getElementById("btn-menu").addEventListener("click", quitToMenu);

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (!els.screens.game.classList.contains("active")) return;
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "rotate",
      ArrowDown: "soft",
      " ": "hard",
      c: "hold",
      C: "hold",
      p: "pause",
      P: "pause",
    };
    const action = map[e.key];
    if (!action) return;
    e.preventDefault();
    if (e.repeat && (action === "rotate" || action === "hard" || action === "hold")) return;
    doAction(action);
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowDown") endSoft();
  });

  bindGestures(els.canvas);
}

function bindGestures(target) {
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let moved = false;
  let active = false;
  const TAP_MS = 220;
  const TAP_DIST = 18;
  const SWIPE = 28;
  let startTime = 0;

  target.addEventListener(
    "pointerdown",
    (e) => {
      if (!game || game.paused || game.gameOver) return;
      active = true;
      moved = false;
      startX = lastX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      target.setPointerCapture?.(e.pointerId);
    },
    { passive: true }
  );

  target.addEventListener(
    "pointermove",
    (e) => {
      if (!active || !game) return;
      const dx = e.clientX - lastX;
      const totalDx = e.clientX - startX;
      const totalDy = e.clientY - startY;

      if (Math.abs(totalDx) > TAP_DIST || Math.abs(totalDy) > TAP_DIST) moved = true;

      // horizontal step moves
      if (Math.abs(dx) >= SWIPE * 0.7 && Math.abs(totalDx) > Math.abs(totalDy)) {
        doAction(dx > 0 ? "right" : "left");
        lastX = e.clientX;
      }

      // soft drop while dragging down
      if (totalDy > SWIPE && Math.abs(totalDy) > Math.abs(totalDx)) {
        game.softDropping = true;
      }
    },
    { passive: true }
  );

  const end = (e) => {
    if (!active) return;
    active = false;
    endSoft();
    if (!game || game.paused || game.gameOver) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dt = performance.now() - startTime;

    if (!moved && dt < TAP_MS && Math.hypot(dx, dy) < TAP_DIST) {
      doAction("rotate");
      return;
    }

    if (dy < -SWIPE * 1.4 && Math.abs(dy) > Math.abs(dx)) {
      doAction("hard");
    }
  };

  target.addEventListener("pointerup", end);
  target.addEventListener("pointercancel", () => {
    active = false;
    endSoft();
  });
}

// Prevent pull-to-refresh / overscroll while playing
document.addEventListener(
  "touchmove",
  (e) => {
    if (els.screens.game.classList.contains("active")) e.preventDefault();
  },
  { passive: false }
);

window.addEventListener("resize", () => {
  if (game) {
    renderBoard(els.canvas, game);
    drawPiecePreview(els.nextCanvas, game.queue[0]);
    drawPiecePreview(els.holdCanvas, game.holdType);
  }
});

bindControls();
refreshStartStats();
updateMuteButton();
showScreen("start");
