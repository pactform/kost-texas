import type { TimeSlot, WeatherType } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private ambienceTimer: number | null = null;
  private currentWeather: WeatherType = 'cerah';
  private currentSlot: TimeSlot = 'pagi';

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted && this.ambienceTimer) {
      window.clearInterval(this.ambienceTimer);
      this.ambienceTimer = null;
    } else if (!muted) {
      this.startAmbienceLoop();
    }
  }

  updateEnvironment(slot: TimeSlot, weather: WeatherType) {
    this.currentSlot = slot;
    this.currentWeather = weather;
    if (!this.muted && !this.ambienceTimer) {
      this.startAmbienceLoop();
    }
  }

  private startAmbienceLoop() {
    if (this.ambienceTimer || typeof window === 'undefined') return;
    this.ambienceTimer = window.setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      if (this.currentWeather === 'hujan' || this.currentWeather === 'hujan_deras') {
        this.playRainDrop();
      } else if (this.currentSlot === 'pagi' && Math.random() < 0.45) {
        this.playBirdChirp();
      } else if (this.currentSlot === 'malam' && Math.random() < 0.3) {
        this.playCricket();
      }
    }, 3400);
  }

  playClick() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(340, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  playChatPing() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [660, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.045, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.15);
    });
  }

  playCoin() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [784, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.05, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.24);
    });
  }

  playMeow() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.34);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playShutter() {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    noise.connect(gain).connect(ctx.destination);
    noise.start();
  }

  private playBirdChirp() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(2650, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(2100, now + 0.16);
    gain.gain.setValueAtTime(0.012, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playCricket() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3400, now + i * 0.06);
      gain.gain.setValueAtTime(0.006, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.06 + 0.04);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.045);
    }
  }

  private playRainDrop() {
    const ctx = this.ctx;
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.35;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.014, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
  }
}

export const soundEngine = new SoundEngine();
