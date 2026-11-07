/**
 * Efeitos sonoros sintetizados com WebAudio (sem arquivos de áudio).
 * O áudio só toca depois da primeira interação do usuário, como exigem os navegadores.
 */
let ac: AudioContext | null = null
let muted = false
try { muted = localStorage.getItem("hl:mute") === "1" } catch { /* sem storage */ }

const listeners = new Set<() => void>()

function ctx(): AudioContext | null {
  if (!ac) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ac = new AC()
    } catch { return null }
  }
  if (ac.state === "suspended") ac.resume().catch(() => {})
  return ac
}

const note = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.12, to?: number) {
  const a = ctx()
  if (!a || muted) return
  const t0 = a.currentTime + at
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

function noise(dur: number, vol: number, from: number, to: number) {
  const a = ctx()
  if (!a || muted) return
  const len = Math.floor(a.sampleRate * dur)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = "bandpass"
  f.Q.value = 1.2
  f.frequency.setValueAtTime(from, a.currentTime)
  f.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(vol, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
  src.connect(f).connect(g).connect(a.destination)
  src.start()
}

export const sfx = {
  click: () => tone(note(76), 0, 0.05, "square", 0.05),
  pick: () => tone(note(70), 0, 0.07, "triangle", 0.09),
  nav: () => { tone(note(72), 0, 0.07, "triangle", 0.08); tone(note(79), 0.06, 0.1, "triangle", 0.07) },
  whoosh: () => noise(0.32, 0.08, 400, 2800),
  /** pulo do personagem */
  jump: () => tone(note(64), 0, 0.16, "square", 0.05, note(76)),
  /** pouso na estrela */
  land: () => { tone(note(55), 0, 0.09, "sine", 0.14, note(48)); tone(note(88), 0.02, 0.1, "triangle", 0.05) },
  ok: () => [72, 76, 79, 84].forEach((n, i) => tone(note(n), i * 0.07, 0.18, "triangle", 0.12)),
  no: () => { tone(190, 0, 0.28, "sawtooth", 0.1, 90); tone(140, 0.05, 0.28, "square", 0.05, 70) },
  done: () => {
    [[72, 0], [76, 0.09], [79, 0.18], [84, 0.27], [88, 0.46]].forEach(([n, t]) => tone(note(n), t, 0.3, "triangle", 0.13))
    ;[60, 64, 67].forEach((n) => tone(note(n), 0.46, 0.6, "sine", 0.08))
  },
  medal: () => {
    ;[67, 67, 67, 72, 76, 79, 84].forEach((n, i) => tone(note(n), i * 0.11, 0.22, "triangle", 0.12))
    ;[96, 100, 103, 108, 103, 108].forEach((n, i) => tone(note(n), 0.8 + i * 0.09, 0.4, "sine", 0.05))
    noise(0.5, 0.05, 3000, 9000)
  },
}

export function isMuted() { return muted }
export function setMuted(v: boolean) {
  muted = v
  try { localStorage.setItem("hl:mute", v ? "1" : "0") } catch { /* sem storage */ }
  listeners.forEach((l) => l())
}
export function onMuteChange(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
