import { AUDIO_CLIPS } from '../data/audioManifest';

/**
 * Voice coach: speaks callouts one at a time.
 *
 * - Uses a prerecorded clip when one is registered in data/audioManifest.js,
 *   otherwise the browser's speech synthesis (no paid APIs).
 * - Never overlaps: a new callout cancels whatever is still playing.
 * - Must be unlocked from a user gesture (mobile autoplay rules) via unlock().
 */
export class VoiceCoach {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.muted = false;
    this.rate = 1.05;
    this.volume = 1;
    this.voiceURI = '';
    this.clip = null;
    this.ctx = null;
    this.sounds = true;
    this.lastSource = null; // 'clip' | 'tts' | null — shown in the UI for transparency
  }

  get speechSupported() {
    return !!this.synth && typeof window.SpeechSynthesisUtterance !== 'undefined';
  }

  configure({ rate, volume, voiceURI, sounds } = {}) {
    if (rate) this.rate = rate;
    if (volume !== undefined) this.volume = volume;
    if (voiceURI !== undefined) this.voiceURI = voiceURI;
    if (sounds !== undefined) this.sounds = sounds;
  }

  /** Call from a click/tap handler so mobile browsers allow audio playback. */
  unlock() {
    try {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) this.ctx = new Ctx();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.ctx = null;
    }
    if (this.speechSupported) {
      try {
        // A silent utterance inside the gesture primes iOS Safari.
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        this.synth.speak(u);
      } catch {
        /* ignore */
      }
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.stop();
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        /* ignore */
      }
    }
    if (this.clip) {
      this.clip.pause();
      this.clip = null;
    }
  }

  pickVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices() || [];
    if (this.voiceURI) {
      const chosen = voices.find((v) => v.voiceURI === this.voiceURI);
      if (chosen) return chosen;
    }
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang) && /Google|Samantha|Alex|Daniel/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null
    );
  }

  speak(text) {
    if (this.muted || !text) return;
    this.stop();
    const clipSrc = AUDIO_CLIPS[text];
    if (clipSrc) {
      const audio = new Audio(clipSrc);
      audio.volume = this.volume;
      this.clip = audio;
      this.lastSource = 'clip';
      audio.play().catch(() => this.speakSynth(text));
      return;
    }
    this.speakSynth(text);
  }

  speakSynth(text) {
    if (!this.speechSupported) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = this.rate;
      u.volume = this.volume;
      u.lang = 'en-US';
      const voice = this.pickVoice();
      if (voice) u.voice = voice;
      this.synth.speak(u);
      this.lastSource = 'tts';
    } catch {
      /* speech failures must never break the workout */
    }
  }

  /** Synthesized boxing-bell style tone (Web Audio, not a recording). */
  bell(kind = 'start') {
    if (this.muted || !this.sounds || !this.ctx) return;
    const strikes = kind === 'start' ? 1 : 3;
    for (let i = 0; i < strikes; i++) this.tone({ freq: 830, duration: 1.2, delay: i * 0.28, type: 'triangle', gain: 0.35, harmonic: 2.76 });
  }

  /** Short countdown beep; the final one is higher. */
  beep(count = 1) {
    if (this.muted || !this.sounds || !this.ctx) return;
    this.tone({ freq: count === 1 ? 1320 : 880, duration: 0.18, type: 'sine', gain: 0.25 });
  }

  tone({ freq, duration, delay = 0, type = 'sine', gain = 0.3, harmonic }) {
    try {
      const ctx = this.ctx;
      const start = ctx.currentTime + delay;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, start);
      out.gain.exponentialRampToValueAtTime(gain * this.volume + 0.0001, start + 0.01);
      out.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      out.connect(ctx.destination);
      const freqs = harmonic ? [freq, freq * harmonic] : [freq];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(f, start);
        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 1 : 0.35;
        osc.connect(g).connect(out);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      });
    } catch {
      /* ignore */
    }
  }
}

export function listVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
}
