import { formatMoney } from '../game/economy'
import { isSoundEnabled, prefersReducedMotion } from '../save/settings'
import { revealWords } from './textReveal'

let audioCtx: AudioContext | null = null
let audioReady = false

function ctx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function getAudioContext(): AudioContext | null {
  return ctx()
}

export function resumeAudioContext(): void {
  const c = ctx()
  if (c?.state === 'suspended') void c.resume()
}

export function primeAudio(): void {
  const c = ctx()
  if (!c || audioReady) return
  resumeAudioContext()
  audioReady = true
  import('./ambientMusic').then(({ syncAmbientMusic }) => syncAmbientMusic())
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.06,
): void {
  if (!isSoundEnabled()) return
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
  if (prefersReducedMotion()) return

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

export function playRankUpSound(): void {
  ;[440, 554, 659, 880, 988].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.18, 'triangle', 0.048), i * 72)
  })
}

export function playLoungeOpenSound(): void {
  ;[392, 523, 659, 784, 988, 1175].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.24, 'triangle', 0.05), i * 95)
  })
}

export function flashLoungeStage(): void {
  const stage = document.querySelector('.stage') as HTMLElement | null
  if (!stage) return
  stage.classList.remove('stage-flash', 'stage-flash--lounge')
  void stage.offsetWidth
  stage.classList.add('stage-flash', 'stage-flash--lounge')
  window.setTimeout(() => {
    stage.classList.remove('stage-flash', 'stage-flash--lounge')
  }, 1200)
}

function burstCelebrationFx(wrap: HTMLElement, count = 16): void {
  if (prefersReducedMotion()) return

  const card = wrap.querySelector('.celebration-card') as HTMLElement | null
  const layer = wrap.querySelector('.celebration-fx') as HTMLElement | null
  if (!card || !layer) return

  layer.replaceChildren()
  const wrapRect = wrap.getBoundingClientRect()
  const rect = card.getBoundingClientRect()
  const cx = rect.left - wrapRect.left + rect.width * 0.5
  const cy = rect.top - wrapRect.top + rect.height * 0.28
  const colors = ['#e6c49a', '#e07a3a', '#f09555', '#fff3e6', '#ffd54a']

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    p.className = 'celebration-burst-particle'
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45
    const dist = 42 + Math.random() * 88
    p.style.left = `${cx}px`
    p.style.top = `${cy}px`
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 20}px`)
    p.style.setProperty('--rot', `${Math.random() * 360}deg`)
    p.style.setProperty('--delay', `${Math.random() * 80}ms`)
    p.style.background = colors[i % colors.length]!
    layer.appendChild(p)
    window.setTimeout(() => p.remove(), 920)
  }
}

function spawnLoungeConfetti(wrap: HTMLElement): void {
  if (prefersReducedMotion()) return

  const layer = wrap.querySelector('.celebration-confetti') as HTMLElement | null
  if (!layer) return

  layer.replaceChildren()
  const colors = ['#e07a3a', '#ffd54a', '#f09555', '#e6c49a', '#6fd6a8', '#fff3e6', '#c45a28']

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('span')
    p.className = 'celebration-confetti-piece'
    if (i % 3 === 0) p.classList.add('celebration-confetti-piece--rect')
    p.style.left = `${-4 + Math.random() * 108}%`
    p.style.setProperty('--fall', `${90 + Math.random() * 50}vh`)
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`)
    p.style.setProperty('--rot', `${Math.random() * 720}deg`)
    p.style.setProperty('--delay', `${Math.random() * 420}ms`)
    p.style.setProperty('--dur', `${1.9 + Math.random() * 1.5}s`)
    p.style.background = colors[i % colors.length]!
    layer.appendChild(p)
    window.setTimeout(() => p.remove(), 3600)
  }
}

export type CelebrationKind = 'lounge' | 'rank' | 'general'

function celebrationKicker(kind: CelebrationKind): string {
  if (kind === 'rank') return 'Повышение на смене'
  if (kind === 'lounge') return 'Свой зал открыт'
  return 'Вау-момент'
}

function celebrationCta(kind: CelebrationKind): string {
  if (kind === 'rank') return 'Продолжить смену'
  if (kind === 'lounge') return 'В свой зал'
  return 'Погнали'
}

function celebrationAriaLabel(kind: CelebrationKind): string {
  if (kind === 'rank') return 'Повышение на смене'
  if (kind === 'lounge') return 'Открытие своего зала'
  return 'Праздник'
}

function celebrationBadge(kind: CelebrationKind): string {
  if (kind === 'rank') {
    return '<div class="celebration-badge celebration-badge--rank" aria-hidden="true"><span class="celebration-badge-arrow">↑</span></div>'
  }
  if (kind === 'lounge') {
    return '<div class="celebration-badge celebration-badge--lounge" aria-hidden="true"><span class="celebration-badge-lounge-mark"></span></div>'
  }
  return ''
}

function playDiplomaAcceptFanfare(): void {
  playAchievementFanfare()
  window.setTimeout(() => playFanfareSound(), 140)
  ;[988, 1175, 1319].forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.14, 'triangle', 0.038), 320 + i * 85)
  })
}

function burstDiplomaAcceptFx(wrap: HTMLElement): void {
  if (prefersReducedMotion()) return

  const layer = wrap.querySelector('.guide-masters-diploma-fx') as HTMLElement | null
  const diploma = wrap.querySelector('.guide-masters-diploma') as HTMLElement | null
  if (!layer || !diploma) return

  layer.replaceChildren()
  const wrapRect = wrap.getBoundingClientRect()
  const rect = diploma.getBoundingClientRect()
  const cx = rect.left - wrapRect.left + rect.width * 0.5
  const cy = rect.top - wrapRect.top + rect.height * 0.42
  const colors = ['#ffd8b0', '#f09555', '#e07a3a', '#fff3e6', '#e6c49a', '#c45a28']

  for (let i = 0; i < 28; i++) {
    const p = document.createElement('span')
    p.className = 'diploma-burst-particle'
    const angle = (i / 28) * Math.PI * 2 + (Math.random() - 0.5) * 0.45
    const dist = 56 + Math.random() * 120
    p.style.left = `${cx}px`
    p.style.top = `${cy}px`
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 36}px`)
    p.style.setProperty('--rot', `${Math.random() * 360}deg`)
    p.style.setProperty('--delay', `${Math.random() * 120}ms`)
    p.style.background = colors[i % colors.length]!
    layer.appendChild(p)
    window.setTimeout(() => p.remove(), 1100)
  }
}

function spawnDiplomaEmbers(wrap: HTMLElement): void {
  if (prefersReducedMotion()) return

  const layer = wrap.querySelector('.guide-masters-diploma-embers') as HTMLElement | null
  if (!layer) return

  layer.replaceChildren()
  const w = wrap.clientWidth

  for (let i = 0; i < 22; i++) {
    const ember = document.createElement('span')
    ember.className = 'diploma-ember'
    const x = w * (0.12 + Math.random() * 0.76)
    ember.style.left = `${x}px`
    ember.style.bottom = `${8 + Math.random() * 28}px`
    ember.style.setProperty('--rise', `${120 + Math.random() * 180}px`)
    ember.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`)
    ember.style.setProperty('--delay', `${Math.random() * 280}ms`)
    ember.style.setProperty('--dur', `${900 + Math.random() * 700}ms`)
    layer.appendChild(ember)
    window.setTimeout(() => ember.remove(), 1800)
  }

  for (let i = 0; i < 6; i++) {
    const flame = document.createElement('span')
    flame.className = 'diploma-flame'
    flame.style.left = `${w * (0.18 + i * 0.12)}px`
    flame.style.setProperty('--delay', `${i * 60}ms`)
    layer.appendChild(flame)
    window.setTimeout(() => flame.remove(), 1600)
  }
}

function spawnDiplomaCheers(wrap: HTMLElement): void {
  if (prefersReducedMotion()) return

  const layer = wrap.querySelector('.guide-masters-diploma-cheers') as HTMLElement | null
  if (!layer) return

  layer.replaceChildren()
  const labels = ['Овации!', '👏', 'Браво!', '🔥', '✨', '👏']
  const w = wrap.clientWidth
  const h = wrap.clientHeight

  labels.forEach((label, i) => {
    const chip = document.createElement('span')
    chip.className = 'diploma-cheer'
    chip.textContent = label
    chip.style.left = `${w * (0.1 + (i / labels.length) * 0.75)}px`
    chip.style.top = `${h * (0.28 + (i % 3) * 0.08)}px`
    chip.style.setProperty('--delay', `${i * 90}ms`)
    layer.appendChild(chip)
    window.setTimeout(() => chip.remove(), 1700)
  })
}

export function spawnTapSparks(stage: HTMLElement, fromEl?: HTMLElement | null): void {
  if (prefersReducedMotion()) return
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
  kind: CelebrationKind = 'general',
): void {
  celebrationHost?.remove()
  const wrap = document.createElement('div')
  wrap.className = `celebration-fanfare celebration-fanfare--${kind} in`
  wrap.innerHTML = `
    <div class="celebration-backdrop"></div>
    <div class="celebration-confetti" aria-hidden="true"></div>
    <div class="celebration-fx" aria-hidden="true"></div>
    <div class="celebration-ring" aria-hidden="true"></div>
    <div class="celebration-card gradient-surface gradient-surface--hero celebration-card--${kind}" role="dialog" aria-modal="true" aria-label="${celebrationAriaLabel(kind)}">
      <div class="celebration-spark" aria-hidden="true"></div>
      ${celebrationBadge(kind)}
      <p class="celebration-kicker">${celebrationKicker(kind)}</p>
      <p class="celebration-title"></p>
      <p class="celebration-sub"></p>
      <button type="button" class="celebration-btn">${celebrationCta(kind)}</button>
    </div>
  `
  const titleEl = wrap.querySelector('.celebration-title') as HTMLElement
  const subEl = wrap.querySelector('.celebration-sub') as HTMLElement
  titleEl.textContent = title
  subEl.textContent = subtitle
  document.body.appendChild(wrap)
  celebrationHost = wrap
  document.body.classList.add('celebrate-locked')

  if (kind === 'rank') {
    playRankUpSound()
    requestAnimationFrame(() => burstCelebrationFx(wrap, 16))
  } else if (kind === 'lounge') {
    playLoungeOpenSound()
    requestAnimationFrame(() => {
      burstCelebrationFx(wrap, 24)
      spawnLoungeConfetti(wrap)
    })
    window.setTimeout(() => flashLoungeStage(), 200)
  } else {
    playFanfareSound()
    requestAnimationFrame(() => burstCelebrationFx(wrap, 16))
  }

  revealWords(titleEl, kind === 'rank' ? 95 : kind === 'lounge' ? 88 : 85)
  window.setTimeout(
    () => revealWords(subEl, 55),
    kind === 'rank' ? 340 : kind === 'lounge' ? 320 : 280,
  )

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

function formatDiplomaName(playerName: string): string {
  const trimmed = playerName.trim()
  return (trimmed || 'Лауреат').toUpperCase()
}

export function showGuideMastersDiploma(
  playerName: string,
  subtitle: string,
  onDismiss: () => void,
): void {
  celebrationHost?.remove()
  const wrap = document.createElement('div')
  wrap.className = 'celebration-fanfare guide-masters-diploma-fanfare in'
  const sealUrl = `${import.meta.env.BASE_URL}assets/guide-masters-seal.png`
  const displayName = formatDiplomaName(playerName)
  wrap.innerHTML = `
    <div class="celebration-backdrop"></div>
    <div class="guide-masters-diploma-fx" aria-hidden="true"></div>
    <div class="guide-masters-diploma-fire" aria-hidden="true">
      <div class="guide-masters-diploma-fire-core"></div>
    </div>
    <div class="guide-masters-diploma-embers" aria-hidden="true"></div>
    <div class="guide-masters-diploma-cheers" aria-hidden="true"></div>
    <div class="guide-masters-diploma-stage">
      <p class="guide-masters-diploma-kicker">Диплом обладателя премии</p>
      <article class="guide-masters-diploma guide-masters-diploma--portrait" role="dialog" aria-modal="true" aria-label="Диплом лауреата премии Гайд Мастерс">
        <div class="guide-masters-diploma-mat">
          <div class="guide-masters-diploma-frame">
            <div class="guide-masters-diploma-face">
              <div class="guide-masters-diploma-shine" aria-hidden="true"></div>
              <div class="guide-masters-diploma-glow" aria-hidden="true"></div>
              <p class="guide-masters-diploma-brand">Guide<br>Master's</p>
              <img class="guide-masters-diploma-seal" src="${sealUrl}" width="108" height="108" alt="" decoding="async" />
              <div class="guide-masters-diploma-recipient">
                <span class="guide-masters-diploma-chevron" aria-hidden="true">&gt;</span>
                <p class="guide-masters-diploma-name"></p>
              </div>
              <p class="guide-masters-diploma-caption">Обладатель премии</p>
            </div>
          </div>
        </div>
      </article>
      <p class="guide-masters-diploma-sub"></p>
      <button type="button" class="celebration-btn guide-masters-diploma-btn">Принять диплом</button>
    </div>
  `
  const nameEl = wrap.querySelector('.guide-masters-diploma-name') as HTMLElement
  const subEl = wrap.querySelector('.guide-masters-diploma-sub') as HTMLElement
  const btn = wrap.querySelector('.guide-masters-diploma-btn') as HTMLButtonElement
  nameEl.textContent = displayName
  subEl.textContent = subtitle
  document.body.appendChild(wrap)
  celebrationHost = wrap
  document.body.classList.add('celebrate-locked')
  playFanfareSound()

  let accepting = false

  const close = (): void => {
    wrap.classList.remove('in')
    wrap.classList.add('out')
    window.setTimeout(() => {
      wrap.remove()
      if (celebrationHost === wrap) celebrationHost = null
      document.body.classList.remove('celebrate-locked')
      onDismiss()
    }, 320)
  }

  const accept = (): void => {
    if (accepting) return
    accepting = true
    btn.disabled = true
    btn.textContent = 'Принято!'
    wrap.classList.add('guide-masters-diploma-fanfare--accept')
    playDiplomaAcceptFanfare()
    burstDiplomaAcceptFx(wrap)
    spawnDiplomaEmbers(wrap)
    spawnDiplomaCheers(wrap)
    window.setTimeout(close, 1650)
  }

  btn.addEventListener('click', accept)
  wrap.querySelector('.celebration-backdrop')!.addEventListener('click', () => {
    if (!accepting) close()
  })
  btn.focus()
}
