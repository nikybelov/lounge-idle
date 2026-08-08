import { isMusicEnabled } from '../save/settings'
import { getAudioContext, resumeAudioContext } from './juice'

let master: GainNode | null = null
let running = false
let nodes: AudioScheduledSourceNode[] = []

function stopNodes(): void {
  for (const n of nodes) {
    try {
      n.stop()
    } catch {
      /* already stopped */
    }
    n.disconnect()
  }
  nodes = []
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

/** Процедурный lounge-эмбиент — без файлов и авторских прав */
export function syncAmbientMusic(): void {
  if (!isMusicEnabled()) {
    stopAmbientMusic()
    return
  }
  if (running) return
  startAmbientMusic()
}

export function startAmbientMusic(): void {
  const c = getAudioContext()
  if (!c || !isMusicEnabled()) return
  resumeAudioContext()
  if (running) return

  stopNodes()
  master = c.createGain()
  master.gain.value = 0
  master.connect(c.destination)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 720
  filter.Q.value = 0.6
  filter.connect(master)

  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.045
  lfoGain.gain.value = 180
  lfo.connect(lfoGain)
  lfoGain.connect(filter.frequency)
  lfo.start()
  nodes.push(lfo)

  const droneMix = c.createGain()
  droneMix.gain.value = 0.11
  droneMix.connect(filter)

  for (const freq of [110, 164.81, 220]) {
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = (freq - 110) * 0.4
    g.gain.value = freq === 110 ? 1 : freq === 164.81 ? 0.55 : 0.28
    osc.connect(g)
    g.connect(droneMix)
    osc.start()
    nodes.push(osc)
  }

  const bufferSize = 2 * c.sampleRate
  const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = noiseBuffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const noise = c.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true
  const noiseGain = c.createGain()
  noiseGain.gain.value = 0.035
  noise.connect(noiseGain)
  noiseGain.connect(filter)
  noise.start()
  nodes.push(noise)

  running = true
  fadeMaster(0.085, 2.4)
}

export function stopAmbientMusic(): void {
  if (!running) return
  fadeMaster(0, 0.8)
  window.setTimeout(() => {
    stopNodes()
    master?.disconnect()
    master = null
    running = false
  }, 900)
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAmbientMusic()
  else if (isMusicEnabled()) startAmbientMusic()
})
