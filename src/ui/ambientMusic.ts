import { isMusicEnabled } from '../save/settings'
import { getAudioContext, resumeAudioContext, suspendAudioContext } from './juice'

/** D-minor pentatonic — короткие «лаунж»-ноты, без подложки */
const NOTES = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25]

let master: GainNode | null = null
let running = false
let melodyTimer: ReturnType<typeof setTimeout> | null = null
let percTimer: ReturnType<typeof setTimeout> | null = null
let stopFadeTimer: ReturnType<typeof setTimeout> | null = null
let beat = 0

function clearTimers(): void {
  if (melodyTimer !== null) {
    window.clearTimeout(melodyTimer)
    melodyTimer = null
  }
  if (percTimer !== null) {
    window.clearTimeout(percTimer)
    percTimer = null
  }
  if (stopFadeTimer !== null) {
    window.clearTimeout(stopFadeTimer)
    stopFadeTimer = null
  }
}

function killMaster(): void {
  if (!master) return
  try {
    master.gain.cancelScheduledValues(0)
    master.gain.value = 0
    master.disconnect()
  } catch {
    /* already gone */
  }
  master = null
}

function fadeMaster(to: number, sec: number): void {
  if (!master) return
  const c = getAudioContext()
  if (!c) return
  const t = c.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(to, t + sec)
}

function pickNote(): number {
  const base = NOTES[Math.floor(Math.random() * NOTES.length)]!
  const octave = Math.random() < 0.22 ? 0.5 : Math.random() < 0.12 ? 2 : 1
  return base * octave
}

/** Короткий pluck — как далёкое фортепiano в лаунже */
function playPluck(freq: number, gain = 0.045): void {
  const c = getAudioContext()
  if (!c || !master || !running) return
  const t = c.currentTime

  const osc = c.createOscillator()
  const env = c.createGain()
  const filter = c.createBiquadFilter()

  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq * 1.002, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.998, t + 1.6)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(Math.min(2400, freq * 3.2), t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(420, freq * 1.1), t + 1.8)
  filter.Q.value = 0.7

  env.gain.setValueAtTime(0.0001, t)
  env.gain.linearRampToValueAtTime(gain, t + 0.018)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)

  osc.connect(filter)
  filter.connect(env)
  env.connect(master)

  osc.start(t)
  osc.stop(t + 2.5)
}

/** Мягкий «shaker» — короткий шум, не постоянная подложка */
function playShaker(gain = 0.018): void {
  const c = getAudioContext()
  if (!c || !master || !running) return
  const t = c.currentTime
  const len = Math.floor(c.sampleRate * 0.055)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const env = 1 - i / len
    data[i] = (Math.random() * 2 - 1) * env * env
  }

  const src = c.createBufferSource()
  src.buffer = buf
  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 5200 + Math.random() * 1800
  band.Q.value = 0.85
  const env = c.createGain()
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)

  src.connect(band)
  band.connect(env)
  env.connect(master)
  src.start(t)
  src.stop(t + 0.06)
}

function scheduleMelody(): void {
  if (!running) return
  playPluck(pickNote(), 0.032 + Math.random() * 0.022)
  melodyTimer = window.setTimeout(scheduleMelody, 2400 + Math.random() * 4200)
}

function schedulePerc(): void {
  if (!running) return
  beat += 1
  // Ленивый bossa-ритм: не каждый удар, без гула
  if (beat % 2 === 1 || Math.random() > 0.35) {
    playShaker(beat % 4 === 0 ? 0.022 : 0.014)
  }
  percTimer = window.setTimeout(schedulePerc, 480 + Math.random() * 120)
}

/** Процедурный lounge — редкие ноты и перкуссия, без дронов */
export function syncAmbientMusic(): void {
  if (!isMusicEnabled() || document.hidden) {
    stopAmbientMusic({ suspend: document.hidden })
    return
  }
  if (running) return
  startAmbientMusic()
}

export function startAmbientMusic(): void {
  if (document.hidden || !isMusicEnabled()) return
  const c = getAudioContext()
  if (!c) return
  resumeAudioContext()
  if (running) return

  clearTimers()
  killMaster()
  beat = 0

  master = c.createGain()
  master.gain.value = 0
  master.connect(c.destination)

  running = true
  fadeMaster(0.95, 1.8)

  melodyTimer = window.setTimeout(scheduleMelody, 800 + Math.random() * 1200)
  percTimer = window.setTimeout(schedulePerc, 400)
}

export function stopAmbientMusic(opts: { suspend?: boolean } = {}): void {
  const wasRunning = running
  running = false
  clearTimers()
  if (wasRunning && master) {
    fadeMaster(0, 0.25)
    stopFadeTimer = window.setTimeout(() => {
      killMaster()
      stopFadeTimer = null
      if (opts.suspend !== false) suspendAudioContext()
    }, 280)
  } else {
    killMaster()
    if (opts.suspend !== false) suspendAudioContext()
  }
}

function silenceForBackground(): void {
  stopAmbientMusic({ suspend: true })
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) silenceForBackground()
  else if (isMusicEnabled()) startAmbientMusic()
})

window.addEventListener('pagehide', silenceForBackground)
window.addEventListener('freeze', silenceForBackground)
window.addEventListener('beforeunload', silenceForBackground)
