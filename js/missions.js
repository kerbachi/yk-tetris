/** Mission definitions and progress tracking */

const MISSION_POOL = [
  {
    id: "lines_5",
    text: "Clear 5 lines",
    target: 5,
    xp: 40,
    track: "lines",
  },
  {
    id: "lines_12",
    text: "Clear 12 lines",
    target: 12,
    xp: 80,
    track: "lines",
  },
  {
    id: "score_1500",
    text: "Reach 1,500 score",
    target: 1500,
    xp: 50,
    track: "score",
  },
  {
    id: "score_4000",
    text: "Reach 4,000 score",
    target: 4000,
    xp: 100,
    track: "score",
  },
  {
    id: "tetris_1",
    text: "Land a Tetris (4 lines)",
    target: 1,
    xp: 70,
    track: "tetrises",
  },
  {
    id: "double_3",
    text: "Clear 3 doubles",
    target: 3,
    xp: 55,
    track: "doubles",
  },
  {
    id: "hard_8",
    text: "Hard drop 8 times",
    target: 8,
    xp: 35,
    track: "hardDrops",
  },
  {
    id: "pieces_25",
    text: "Place 25 pieces",
    target: 25,
    xp: 45,
    track: "pieces",
  },
  {
    id: "combo_2",
    text: "Get a 2+ line combo streak",
    target: 2,
    xp: 60,
    track: "maxCombo",
  },
  {
    id: "hold_3",
    text: "Use Hold 3 times",
    target: 3,
    xp: 30,
    track: "holds",
  },
];

export function xpForPlayerLevel(level) {
  return Math.floor(100 + (level - 1) * 65);
}

export function playerLevelFromXp(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForPlayerLevel(level)) {
    remaining -= xpForPlayerLevel(level);
    level += 1;
    if (level > 99) break;
  }
  return { level, xpIntoLevel: remaining, xpNeeded: xpForPlayerLevel(level) };
}

function pickMissions(count = 3) {
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((m) => ({
    ...m,
    progress: 0,
    completed: false,
  }));
}

export class MissionRunner {
  constructor() {
    this.missions = pickMissions(3);
    this.activeIndex = 0;
    this.completedThisRun = [];
    this.xpEarned = 0;
    this.stats = {
      lines: 0,
      score: 0,
      tetrises: 0,
      doubles: 0,
      hardDrops: 0,
      pieces: 0,
      maxCombo: 0,
      holds: 0,
    };
  }

  get active() {
    return this.missions[this.activeIndex] || null;
  }

  syncFromStats() {
    const newly = [];
    for (const mission of this.missions) {
      if (mission.completed) continue;
      const value = this.stats[mission.track] ?? 0;
      mission.progress = Math.min(value, mission.target);
      if (value >= mission.target) {
        mission.completed = true;
        mission.progress = mission.target;
        this.xpEarned += mission.xp;
        this.completedThisRun.push(mission);
        newly.push(mission);
      }
    }

    // Advance active pointer to next incomplete mission
    while (
      this.activeIndex < this.missions.length &&
      this.missions[this.activeIndex].completed
    ) {
      this.activeIndex += 1;
    }

    return newly;
  }

  update(partial) {
    Object.assign(this.stats, partial);
    // Keep score/lines as absolute from game
    if (partial.score != null) this.stats.score = partial.score;
    if (partial.lines != null) this.stats.lines = partial.lines;
    if (partial.maxCombo != null) {
      this.stats.maxCombo = Math.max(this.stats.maxCombo, partial.maxCombo);
    }
    return this.syncFromStats();
  }

  bump(key, amount = 1) {
    this.stats[key] = (this.stats[key] || 0) + amount;
    return this.syncFromStats();
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem("bp_profile");
    if (!raw) return { totalXp: 0, bestScore: 0 };
    const data = JSON.parse(raw);
    return {
      totalXp: Number(data.totalXp) || 0,
      bestScore: Number(data.bestScore) || 0,
    };
  } catch {
    return { totalXp: 0, bestScore: 0 };
  }
}

export function saveProfile(profile) {
  localStorage.setItem("bp_profile", JSON.stringify(profile));
}
