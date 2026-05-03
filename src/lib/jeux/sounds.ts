// Web Audio API sound engine — no dependencies
let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.3, detune = 0) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {}
}

function chord(freqs: number[], duration: number, type: OscillatorType = "sine", vol = 0.2) {
  freqs.forEach(f => tone(f, duration, type, vol));
}

function noise(duration: number, vol = 0.15) {
  try {
    const ac = getCtx();
    const bufLen = ac.sampleRate * duration;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    src.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    src.start();
  } catch {}
}

// ── Background Music ───────────────────────────────────────────────────────
// Procedural ambient music using Web Audio API — no files needed

type MusicTheme = "arcade" | "reflexion" | "aventure" | "sport" | "calme";

let musicGain: GainNode | null = null;
let musicActive = false;
let musicTheme: MusicTheme = "arcade";
let musicTimeoutId: ReturnType<typeof setTimeout> | null = null;
let musicEnabled = true;

// Pentatonic scales for each theme (root frequencies in Hz)
const SCALES: Record<MusicTheme, number[]> = {
  arcade:   [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25], // C maj pentatonic
  reflexion:[220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 415.30, 440.00], // A minor pentatonic
  aventure: [196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // G major
  sport:    [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 740.00], // D major energetic
  calme:    [174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00], // F major soft
};

const TEMPOS: Record<MusicTheme, number> = {
  arcade: 160, sport: 180, aventure: 140, reflexion: 90, calme: 70,
};

function getMusicGain(): GainNode {
  if (!musicGain) {
    const ac = getCtx();
    musicGain = ac.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(ac.destination);
  }
  return musicGain;
}

function musicNote(freq: number, startTime: number, duration: number, vol = 0.06, type: OscillatorType = "triangle") {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.setValueAtTime(vol, startTime + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(getMusicGain());
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  } catch {}
}

function playMusicBar() {
  if (!musicActive || !musicEnabled) return;
  try {
    const ac = getCtx();
    const bpm = TEMPOS[musicTheme];
    const beat = 60 / bpm;
    const scale = SCALES[musicTheme];
    const now = ac.currentTime;

    // Bass line — root + fifth pattern
    const bassRoot = scale[0] / 2;
    const bassFifth = scale[4] / 2;
    [0, beat * 2].forEach(offset => {
      musicNote(bassRoot, now + offset, beat * 1.8, 0.08, "sine");
    });
    musicNote(bassFifth, now + beat * 1, beat * 0.9, 0.06, "sine");
    musicNote(bassFifth, now + beat * 3, beat * 0.9, 0.06, "sine");

    // Melody — random walk in scale
    const numNotes = musicTheme === "reflexion" || musicTheme === "calme" ? 4 : 8;
    for (let i = 0; i < numNotes; i++) {
      const prob = Math.random();
      if (prob < 0.3) continue; // rest
      const noteIdx = Math.floor(Math.random() * scale.length);
      const noteTime = now + (i / numNotes) * beat * 4;
      const noteDur = beat * (musicTheme === "arcade" || musicTheme === "sport" ? 0.4 : 0.7);
      musicNote(scale[noteIdx], noteTime, noteDur, 0.05, "triangle");
    }

    // Chord pad for calm/reflexion
    if (musicTheme === "reflexion" || musicTheme === "calme" || musicTheme === "aventure") {
      const chordNotes = [scale[0], scale[2], scale[4]];
      chordNotes.forEach(f => musicNote(f, now, beat * 4, 0.03, "sine"));
    }

    // Percussion for arcade/sport
    if (musicTheme === "arcade" || musicTheme === "sport") {
      try {
        const bufLen = Math.floor(ac.sampleRate * 0.08);
        const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
        [0, beat, beat * 2, beat * 3].forEach((offset, i) => {
          if (i % 2 !== 0 && Math.random() < 0.5) return;
          const src = ac.createBufferSource();
          src.buffer = buf;
          const g = ac.createGain();
          g.gain.value = 0.04;
          src.connect(g);
          g.connect(getMusicGain());
          src.start(now + offset);
        });
      } catch {}
    }

    const barDuration = beat * 4 * 1000;
    musicTimeoutId = setTimeout(() => { if (musicActive) playMusicBar(); }, barDuration - 50);
  } catch {}
}

// ── Main SFX export ────────────────────────────────────────────────────────
export const SFX = {
  drop() {
    tone(300, 0.08, "square", 0.2);
    setTimeout(() => tone(180, 0.12, "square", 0.25), 60);
    noise(0.05, 0.08);
  },
  win() {
    const melody = [523, 659, 784, 1047];
    melody.forEach((f, i) => setTimeout(() => tone(f, 0.3, "sine", 0.3), i * 120));
    setTimeout(() => chord([523, 659, 784], 0.6, "sine", 0.2), 500);
  },
  lose() {
    tone(400, 0.15, "sawtooth", 0.2);
    setTimeout(() => tone(300, 0.15, "sawtooth", 0.2), 180);
    setTimeout(() => tone(200, 0.3, "sawtooth", 0.2), 360);
  },
  hit() {
    noise(0.12, 0.25);
    tone(120, 0.15, "sawtooth", 0.3);
  },
  miss() {
    tone(600, 0.06, "sine", 0.15);
    setTimeout(() => tone(500, 0.1, "sine", 0.1), 60);
  },
  correct() {
    tone(523, 0.1, "sine", 0.25);
    setTimeout(() => tone(784, 0.2, "sine", 0.3), 100);
  },
  wrong() {
    tone(220, 0.15, "sawtooth", 0.2);
    setTimeout(() => tone(180, 0.25, "sawtooth", 0.2), 160);
  },
  tick() {
    tone(1200, 0.04, "square", 0.08);
  },
  select() {
    tone(660, 0.07, "sine", 0.15);
  },
  join() {
    tone(440, 0.1, "sine", 0.2);
    setTimeout(() => tone(550, 0.15, "sine", 0.2), 100);
  },
  sink() {
    noise(0.2, 0.3);
    tone(80, 0.4, "sawtooth", 0.35);
    setTimeout(() => tone(60, 0.5, "sawtooth", 0.2), 200);
  },

  // ── Background Music API ───────────────────────────────────────────────
  music: {
    start(theme: MusicTheme = "arcade") {
      if (!musicEnabled) return;
      musicTheme = theme;
      musicActive = true;
      try {
        const g = getMusicGain();
        const ac = getCtx();
        g.gain.cancelScheduledValues(ac.currentTime);
        g.gain.setValueAtTime(g.gain.value, ac.currentTime);
        g.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
      } catch {}
      playMusicBar();
    },
    stop() {
      musicActive = false;
      if (musicTimeoutId) { clearTimeout(musicTimeoutId); musicTimeoutId = null; }
      try {
        const g = getMusicGain();
        const ac = getCtx();
        g.gain.cancelScheduledValues(ac.currentTime);
        g.gain.setValueAtTime(g.gain.value, ac.currentTime);
        g.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
      } catch {}
    },
    toggle(theme?: MusicTheme) {
      if (musicActive) { this.stop(); } else { this.start(theme); }
    },
    setEnabled(enabled: boolean) {
      musicEnabled = enabled;
      if (!enabled) this.stop();
    },
    isPlaying() { return musicActive; },
  },
};

// Map catalog categories to music themes
export function categoryToMusicTheme(categorie: string): MusicTheme {
  if (categorie === "sport") return "sport";
  if (categorie === "aventure") return "aventure";
  if (categorie === "reflexion") return "reflexion";
  if (categorie === "creation") return "calme";
  return "arcade";
}
