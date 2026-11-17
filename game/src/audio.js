// Sound, synthesized in code with WebAudio — no audio files, no network.
// Short blips mark every action (cook, ready, serve, coin, angry walk-out),
// a little arpeggio marks a cleared day, and a quiet bass-and-pluck loop
// hums under play. The context only starts after a user gesture, and M
// mutes everything.

const MUSIC_NOTES = [196.0, 246.94, 293.66, 329.63, 293.66, 246.94];
const MUSIC_STEP = 0.42;

/** Create the sound engine; silent until unlock() runs on a user gesture. */
export function createAudio() {
  let context = null;
  let master = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let muted = false;

  function ensureContext() {
    if (context) return context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(context.destination);
    musicGain = context.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    return context;
  }

  /** Start audio after a click or keypress (browsers block it before then). */
  function unlock() {
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }

  function tone(frequency, startAt, duration, type, volume, destination) {
    const ctx = ensureContext();
    if (!ctx || !master) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(destination ?? master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function noiseBurst(startAt, duration, volume) {
    const ctx = ensureContext();
    if (!ctx || !master) return;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(startAt);
  }

  function now() {
    const ctx = ensureContext();
    return ctx ? ctx.currentTime : 0;
  }

  return {
    unlock,
    get muted() {
      return muted;
    },
    /** Mute or unmute everything; returns the new muted state. */
    toggleMute() {
      muted = !muted;
      if (master && context) master.gain.setTargetAtTime(muted ? 0 : 0.5, context.currentTime, 0.02);
      return muted;
    },
    click() {
      tone(660, now(), 0.07, 'triangle', 0.25);
    },
    /** A dish starts cooking: a short sizzle burst. */
    sizzle() {
      noiseBurst(now(), 0.35, 0.35);
    },
    /** A dish finishes: a bright two-note ding. */
    ding() {
      const t = now();
      tone(880, t, 0.12, 'sine', 0.3);
      tone(1318.5, t + 0.09, 0.18, 'sine', 0.25);
    },
    /** A dish is served: coin clink, higher when the tip was good. */
    coin(bigTip) {
      const t = now();
      tone(bigTip ? 1318.5 : 1046.5, t, 0.09, 'square', 0.12);
      tone(bigTip ? 1760 : 1568, t + 0.08, 0.16, 'square', 0.1);
    },
    /** A customer storms off: a low disappointed buzz. */
    walkout() {
      const t = now();
      tone(220, t, 0.25, 'sawtooth', 0.15);
      tone(174.61, t + 0.18, 0.35, 'sawtooth', 0.15);
    },
    /** A day is cleared: a rising arpeggio. */
    dayClear() {
      const t = now();
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
        tone(frequency, t + i * 0.11, 0.22, 'triangle', 0.28);
      });
    },
    /** The run ends: a short descending phrase. */
    gameOver() {
      const t = now();
      [392, 329.63, 261.63, 196].forEach((frequency, i) => {
        tone(frequency, t + i * 0.16, 0.28, 'triangle', 0.25);
      });
    },
    /** Start the quiet background loop (called once, on the first start). */
    startMusic() {
      const ctx = ensureContext();
      if (!ctx || musicTimer !== null) return;
      musicTimer = setInterval(() => {
        if (muted || !context) return;
        const t = context.currentTime + 0.05;
        const note = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
        tone(note / 2, t, 0.4, 'sine', 0.5, musicGain);
        if (musicStep % 2 === 0) tone(note, t, 0.2, 'triangle', 0.35, musicGain);
        musicStep += 1;
      }, MUSIC_STEP * 1000);
    },
    stopMusic() {
      if (musicTimer !== null) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
    },
  };
}
