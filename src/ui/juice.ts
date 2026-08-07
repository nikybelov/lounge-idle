import { formatMoney } from '../game/economy'
import { revealWords } from './textReveal'

let audioCtx: AudioContext | null = null
let audioReady = false

function ctx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function primeAudio(): void {
  const c = ctx()
  if (!c || audioReady) return
  if (c.state === 'suspended') void c.resume()
  audioReady = true
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.06,
): void {
  const c = ctx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const t0 = c.currentTime
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
  osc.connect(g)
  g.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

export function playCoinSound(): void {
  tone(880, 0.08, 'triangle', 0.05)
  window.setTimeout(() => tone(1175, 0.1, 'triangle', 0.04), 40)
}

export function playUnlockSound(): void {
  tone(523, 0.12, 'sine', 0.05)
  window.setTimeout(() => tone(784, 0.14, 'sine', 0.05), 90)
  window.setTimeout(() => tone(1047, 0.18, 'sine', 0.045), 180)
}

/** Короткий fanfare для достижений — между unlock и полным celebration */
export function playAchievementFanfare(): void {
  ;[659, 784, 988, 1175].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.16, 'triangle', 0.042), i * 85)
  })
}

export function burstAchievementFx(wrap: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const card = wrap.querySelector('.achieve-fanfare-card') as HTMLElement | null
  const layer = wrap.querySelector('.achieve-fanfare-fx') as HTMLElement | null
  if (!card || !layer) return

  layer.replaceChildren()
  const wrapRect = wrap.getBoundingClientRect()
  const rect = card.getBoundingClientRect()
  const cx = rect.left - wrapRect.left + rect.width * 0.5
  const cy = rect.top - wrapRect.top + rect.height * 0.32
  const colors = ['#e6c49a', '#e07a3a', '#f09555', '#fff3e6', '#c45a28']

  for (let i = 0; i < 18; i++) {
    const p = document.createElement('span')
    p.className = 'achieve-burst-particle'
    const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const dist = 48 + Math.random() * 92
    p.style.left = `${cx}px`
    p.style.top = `${cy}px`
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 24}px`)
    p.style.setProperty('--rot', `${Math.random() * 360}deg`)
    p.style.setProperty('--delay', `${Math.random() * 90}ms`)
    p.style.background = colors[i % colors.length]!
    layer.appendChild(p)
    window.setTimeout(() => p.remove(), 950)
  }
}

export function playFanfareSound(): void {
  ;[523, 659, 784, 1047].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.22, 'triangle', 0.045), i * 110)
  })
}

export function spawnTapSparks(stage: HTMLElement, fromEl?: HTMLElement | null): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const anchor = fromEl ?? stage
  const rect = anchor.getBoundingClientRect()
  const stageRect = stage.getBoundingClientRect()
  const cx = rect.left - stageRect.left + rect.width * 0.5
  const cy = rect.top - stageRect.top + rect.height * 0.45
  const n = 7
  for (let i = 0; i < n; i++) {
    const el = document.createElement('span')
    el.className = 'tap-spark'
    el.style.left = `${cx}px`
    el.style.top = `${cy}px`
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 56}px`)
    el.style.setProperty('--dy', `${-18 - Math.random() * 36}px`)
    el.style.setProperty('--delay', `${i * 28}ms`)
    stage.appendChild(el)
    window.setTimeout(() => el.remove(), 720)
  }
}

export function spawnFloatCash(
  root: HTMLElement,
  amount: number,
  fromEl?: HTMLElement | null,
): void {
  const stage = root.querySelector('.stage') as HTMLElement | null
  if (!stage) return
  const el = document.createElement('span')
  el.className = 'float-cash'
  el.textContent = `+${formatMoney(amount)}`
  const rect = (fromEl ?? stage).getBoundingClientRect()
  const stageRect = stage.getBoundingClientRect()
  const jitter = (Math.random() - 0.5) * 24
  el.style.left = `${rect.left - stageRect.left + rect.width * 0.55 + jitter}px`
  el.style.top = `${rect.top - stageRect.top + 8}px`
  el.style.setProperty('--drift', `${jitter * 0.6}px`)
  stage.appendChild(el)
  window.setTimeout(() => el.remove(), 900)
}

export function pulseCashHud(root: HTMLElement): void {
  const cash = root.querySelector('.cash-value')
  if (!cash) return
  cash.classList.remove('cash-pop')
  void (cash as HTMLElement).offsetWidth
  cash.classList.add('cash-pop')
}

let celebrationHost: HTMLElement | null = null

export function isCelebrationVisible(): boolean {
  return !!(celebrationHost?.isConnected && document.body.contains(celebrationHost))
}

export function showCelebration(
  title: string,
  subtitle: string,
  onDismiss: () => void,
): void {
  celebrationHost?.remove()
  const wrap = document.createElement('div')
  wrap.className = 'celebration-fanfare in'
  wrap.innerHTML = `
    <div class="celebration-backdrop"></div>
    <div class="celebration-card gradient-surface gradient-surface--hero" role="dialog" aria-modal="true">
      <div class="celebration-spark" aria-hidden="true"></div>
      <p class="celebration-kicker">Вау-момент</p>
      <p class="celebration-title"></p>
      <p class="celebration-sub"></p>
      <button type="button" class="celebration-btn">Погнали</button>
    </div>
  `
  const titleEl = wrap.querySelector('.celebration-title') as HTMLElement
  const subEl = wrap.querySelector('.celebration-sub') as HTMLElement
  titleEl.textContent = title
  subEl.textContent = subtitle
  document.body.appendChild(wrap)
  celebrationHost = wrap
  document.body.classList.add('celebrate-locked')
  playFanfareSound()
  revealWords(titleEl, 85)
  window.setTimeout(() => revealWords(subEl, 55), 280)

  const close = (): void => {
    wrap.classList.remove('in')
    wrap.classList.add('out')
    window.setTimeout(() => {
      wrap.remove()
      if (celebrationHost === wrap) celebrationHost = null
      document.body.classList.remove('celebrate-locked')
      onDismiss()
    }, 260)
  }

  wrap.querySelector('.celebration-btn')!.addEventListener('click', close)
  wrap.querySelector('.celebration-backdrop')!.addEventListener('click', close)
  ;(wrap.querySelector('.celebration-btn') as HTMLButtonElement).focus()
}
