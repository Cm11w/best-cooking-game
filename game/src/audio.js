// All sound is synthesised with WebAudio: no audio files, no network. The context
// is created lazily on the first player gesture (browsers block audio before one),
// and every call is guarded so a headless screenshot run never throws.
export function createAudio() {
  let context = null;
  let muted = false;
  let sizzleGain = null;
  let sizzleSource = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  /** Call from any user gesture so later sounds are allowed to play. */
  function unlock() {
    const ctx = ensure();
    if (ctx !== null && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio is decoration; a failure never breaks the game.
    }
  }

  function noiseBurst(dur, vol, filterFreq) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    try {
      const t0 = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start(t0);
    } catch {
      // Audio is decoration; a failure never breaks the game.
    }
  }

  return {
    unlock,
    toggleMute() {
      muted = !muted;
      if (muted) this.setSizzle(0);
      return muted;
    },
    get muted() {
      return muted;
    },
    click() {
      tone(660, 0.07, 'triangle', 0.12);
    },
    add() {
      tone(520, 0.08, 'sine', 0.14);
      tone(780, 0.1, 'sine', 0.12, 0.05);
    },
    error() {
      tone(160, 0.18, 'sawtooth', 0.12, 0, 110);
    },
    ding() {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.22, 'sine', 0.14, 0.09);
    },
    coin() {
      tone(988, 0.09, 'square', 0.07);
      tone(1319, 0.09, 'square', 0.07, 0.07);
      tone(1568, 0.16, 'square', 0.07, 0.14);
    },
    burn() {
      noiseBurst(0.3, 0.16, 900);
      tone(220, 0.25, 'sawtooth', 0.1, 0, 90);
    },
    tick() {
      tone(1200, 0.04, 'square', 0.05);
    },
    /** Continuous grill sizzle while anything cooks; 0 silences it. */
    setSizzle(level) {
      const ctx = ensure();
      if (ctx === null) return;
      try {
        if (level <= 0) {
          if (sizzleSource !== null) {
            sizzleSource.stop();
            sizzleSource = null;
            sizzleGain = null;
          }
          return;
        }
        if (sizzleSource === null) {
          const len = ctx.sampleRate;
          const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
          sizzleSource = ctx.createBufferSource();
          sizzleSource.buffer = buffer;
          sizzleSource.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 2500;
          sizzleGain = ctx.createGain();
          sizzleGain.gain.value = 0;
          sizzleSource.connect(filter).connect(sizzleGain).connect(ctx.destination);
          sizzleSource.start();
        }
        if (!muted) sizzleGain.gain.setTargetAtTime(0.02 * level, ctx.currentTime, 0.1);
        else sizzleGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      } catch {
        // Audio is decoration; a failure never breaks the game.
      }
    },
  };
}
