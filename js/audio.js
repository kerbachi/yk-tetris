/** Procedural arcade SFX via Web Audio API */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("bp_muted") === "1";
    this.master = null;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.35;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem("bp_muted", muted ? "1" : "0");
    if (this.master) {
      this.master.gain.value = muted ? 0 : 0.35;
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  tone(freq, duration, type = "square", gain = 0.08, slideTo = null) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + duration);
    }
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise(duration, gain = 0.05) {
    if (!this.ensure() || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    src.buffer = buffer;
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  move() {
    this.tone(220, 0.04, "square", 0.04);
  }

  rotate() {
    this.tone(360, 0.06, "triangle", 0.06, 520);
  }

  softDrop() {
    this.tone(160, 0.03, "square", 0.03);
  }

  hardDrop() {
    this.tone(90, 0.1, "sawtooth", 0.07, 40);
    this.noise(0.08, 0.04);
  }

  lock() {
    this.tone(140, 0.05, "square", 0.05);
  }

  clear(lines) {
    const base = 320 + lines * 80;
    this.tone(base, 0.12, "triangle", 0.09, base * 1.6);
    if (lines >= 4) {
      setTimeout(() => this.tone(660, 0.18, "square", 0.08, 990), 60);
      setTimeout(() => this.noise(0.15, 0.06), 40);
    }
  }

  hold() {
    this.tone(280, 0.07, "sine", 0.06, 200);
  }

  mission() {
    this.tone(440, 0.1, "triangle", 0.08);
    setTimeout(() => this.tone(554, 0.1, "triangle", 0.08), 80);
    setTimeout(() => this.tone(659, 0.16, "triangle", 0.09), 160);
  }

  levelUp() {
    [392, 494, 587, 784].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.12, "square", 0.07), i * 70);
    });
  }

  gameOver() {
    this.tone(220, 0.2, "sawtooth", 0.08, 80);
    setTimeout(() => this.tone(110, 0.35, "sawtooth", 0.07, 40), 120);
  }

  start() {
    this.tone(330, 0.08, "triangle", 0.07);
    setTimeout(() => this.tone(440, 0.1, "triangle", 0.07), 90);
  }
}
