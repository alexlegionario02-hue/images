import { PASTELS } from './constants';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private lastToneTime: number = 0;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  public init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playCellTone(colorIdx: number, stepInPath: number = 0): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastToneTime < 0.04) return;
    this.lastToneTime = now;

    const base = PASTELS[colorIdx % PASTELS.length].freq;
    const freq = base * Math.pow(1.05946, stepInPath % 10);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Ignored
      }
    };
  }

  public playConnectedChord(colorIdx: number): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const base = PASTELS[colorIdx % PASTELS.length].freq;
    const intervals = [1, 1.25, 1.5]; // Major chord resonance
    const now = this.ctx.currentTime;

    intervals.forEach((ratio, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * ratio, now + i * 0.05);

      gain.gain.setValueAtTime(0.001, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.07, now + i * 0.05 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 1.25);
    });
  }

  public playWinSymphony(): void {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    const now = this.ctx.currentTime;
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.001, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 1.9);
    });
  }
}
