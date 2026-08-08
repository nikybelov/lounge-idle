import type { CoachDef, TabHintDef } from '../game/guide'
import { GUIDE_STEPS_TOTAL } from '../game/guide'
import type { GuideStep } from '../game/state'
import { mascotSvg } from './mascot'
import {
  layoutMascotStage,
  pickMascotStage,
  type MascotChoreoContext,
  type MascotStageId,
} from './guideMascot'
import { playUnlockSound } from './juice'
import { isCoachEnabled } from '../save/settings'

let host: HTMLElement | null = null
let activeStep: string | null = null
let pendingTabHint: TabHintDef | null = null
let pendingTabHintAck: (() => void) | null = null
let onAckCallback: ((step?: GuideStep) => void) | null = null
let activeMascotStep: string | null = null
let lockedMascotStage: MascotStageId | null = null

const CARD_MAX_W = 272
const GAP = 10
const VIEW_PAD = 12

function ensureHost(): HTMLElement {
  if (host?.isConnected) return host
  const el = document.createElement('div')
  el.id = 'guide-coach-root'
  el.className = 'guide-coach'
  el.hidden = true
  el.innerHTML = `
    <div class="guide-coach-spot" data-spot aria-hidden="true"></div>
    <div class="guide-coach-arrow" data-arrow aria-hidden="true"></div>
    <div class="guide-coach-card" data-card>
      <div class="guide-coach-progress" data-progress aria-hidden="true"></div>
      <div class="guide-coach-icon" data-icon aria-hidden="true" hidden></div>
      <p class="guide-coach-kicker" data-kicker></p>
      <p class="guide-coach-title" data-title></p>
      <p class="guide-coach-body" data-body></p>
      <button type="button" class="guide-coach-btn" data-ok></button>
    </div>
    <div class="guide-mascot" data-mascot hidden aria-hidden="true"></div>
  `
  document.body.appendChild(el)
  host = el
  return el
}

function clearHighlights(root: HTMLElement): void {
  root.querySelectorAll('.guide-highlight').forEach((n) => {
    n.classList.remove('guide-highlight')
  })
  root.querySelectorAll('.guide-pulse').forEach((n) => {
    n.classList.remove('guide-pulse')
  })
}

function findTarget(root: HTMLElement, selector?: string): HTMLElement | null {
  if (!selector) return null
  for (const part of selector.split(',')) {
    const el = root.querySelector(part.trim()) as HTMLElement | null
    if (el && !el.hidden) return el
  }
  return null
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

type CardPlacement = 'below' | 'above' | 'right' | 'left'

function pickPlacement(
  target: DOMRect,
  cardW: number,
  cardH: number,
): CardPlacement {
  const spaceBelow = window.innerHeight - target.bottom - GAP - VIEW_PAD
  const spaceAbove = target.top - GAP - VIEW_PAD
  const spaceRight = window.innerWidth - target.right - GAP - VIEW_PAD
  const spaceLeft = target.left - GAP - VIEW_PAD

  const inTopBand = target.bottom < window.innerHeight * 0.38
  const inBottomBand = target.top > window.innerHeight * 0.62

  if (inTopBand && spaceBelow >= cardH) return 'below'
  if (inBottomBand && spaceAbove >= cardH) return 'above'
  if (spaceBelow >= cardH) return 'below'
  if (spaceAbove >= cardH) return 'above'
  if (spaceRight >= cardW) return 'right'
  if (spaceLeft >= cardW) return 'left'
  return spaceBelow >= spaceAbove ? 'below' : 'above'
}

function positionArrow(
  arrow: HTMLElement,
  placement: CardPlacement,
  target: DOMRect,
  card: DOMRect,
): void {
  const tx = target.left + target.width / 2
  const ty = target.top + target.height / 2

  arrow.hidden = false
  arrow.classList.remove(
    'guide-coach-arrow--up',
    'guide-coach-arrow--down',
    'guide-coach-arrow--left',
    'guide-coach-arrow--right',
  )

  if (placement === 'below') {
    arrow.classList.add('guide-coach-arrow--up')
    arrow.style.left = `${clamp(tx - 8, card.left + 12, card.right - 28)}px`
    arrow.style.top = `${target.bottom + 4}px`
    return
  }

  if (placement === 'above') {
    arrow.classList.add('guide-coach-arrow--down')
    arrow.style.left = `${clamp(tx - 8, card.left + 12, card.right - 28)}px`
    arrow.style.top = `${target.top - 14}px`
    return
  }

  if (placement === 'right') {
    arrow.classList.add('guide-coach-arrow--left')
    arrow.style.left = `${target.right + 2}px`
    arrow.style.top = `${clamp(ty - 8, card.top + 12, card.bottom - 28)}px`
    return
  }

  arrow.classList.add('guide-coach-arrow--right')
  arrow.style.left = `${target.left - 18}px`
  arrow.style.top = `${clamp(ty - 8, card.top + 12, card.bottom - 28)}px`
}

function positionCardNearTarget(
  card: HTMLElement,
  arrow: HTMLElement,
  target: DOMRect | null,
): CardPlacement | 'center' {
  const safeB =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--safe-b') ||
        '0',
      10,
    ) || 0

  card.style.position = 'fixed'
  card.style.width = `min(${CARD_MAX_W}px, calc(100vw - ${VIEW_PAD * 2}px))`
  card.style.maxWidth = `${CARD_MAX_W}px`
  card.style.transform = 'none'
  card.style.right = 'auto'
  card.style.bottom = 'auto'
  card.style.margin = '0'

  if (!target) {
    card.style.left = '50%'
    card.style.transform = 'translateX(-50%)'
    card.style.top = 'auto'
    card.style.bottom = `${VIEW_PAD + safeB}px`
    card.style.visibility = 'visible'
    arrow.hidden = true
    return 'center'
  }

  const tx = target.left + target.width / 2
  const ty = target.top + target.height / 2

  // Сначала ставим off-screen для замера, потом финально
  card.style.visibility = 'hidden'
  card.style.left = '0px'
  card.style.top = '0px'

  const cardH = card.offsetHeight || 160
  const cardW = card.offsetWidth || CARD_MAX_W
  const placement = pickPlacement(target, cardW, cardH)

  let left = VIEW_PAD
  let top = VIEW_PAD

  switch (placement) {
    case 'below':
      top = target.bottom + GAP
      left = clamp(tx - cardW / 2, VIEW_PAD, window.innerWidth - cardW - VIEW_PAD)
      break
    case 'above':
      top = target.top - GAP - cardH
      left = clamp(tx - cardW / 2, VIEW_PAD, window.innerWidth - cardW - VIEW_PAD)
      break
    case 'right':
      left = target.right + GAP
      top = clamp(
        ty - cardH / 2,
        VIEW_PAD,
        window.innerHeight - cardH - VIEW_PAD - safeB,
      )
      break
    case 'left':
      left = target.left - GAP - cardW
      top = clamp(
        ty - cardH / 2,
        VIEW_PAD,
        window.innerHeight - cardH - VIEW_PAD - safeB,
      )
      break
  }

  top = clamp(top, VIEW_PAD, window.innerHeight - cardH - VIEW_PAD - safeB)
  left = clamp(left, VIEW_PAD, window.innerWidth - cardW - VIEW_PAD)

  card.style.left = `${left}px`
  card.style.top = `${top}px`
  card.style.visibility = 'visible'

  positionArrow(arrow, placement, target, card.getBoundingClientRect())
  return placement
}

const GOAL_PEEK_GAP = 40

function resetMascotChoreo(): void {
  activeMascotStep = null
  lockedMascotStage = null
}

function paintMascotLayout(
  wrap: HTMLElement,
  layout: ReturnType<typeof pickMascotStage>,
  animate = false,
): void {
  const mascot = wrap.querySelector('[data-mascot]') as HTMLElement
  if (!mascot) return
  mascot.hidden = false
  mascot.className = `guide-mascot${animate ? ' guide-mascot--switch' : ''} ${layout.className}`
  mascot.dataset.stage = layout.id
  mascot.innerHTML = `<div class="mascot-figure mascot-figure--${layout.pose} mascot-figure--stage-${layout.id}">${mascotSvg(layout.pose)}</div>`
  mascot.style.left = `${layout.left}px`
  mascot.style.top = `${layout.top}px`
}

function positionMascotChoreo(
  wrap: HTMLElement,
  stepKey: string,
  cardRect: DOMRect,
  keepClearOf?: DOMRect | null,
): void {
  const ctx: MascotChoreoContext = { stepKey, cardRect, keepClearOf }
  const isNewStep = activeMascotStep !== stepKey || !lockedMascotStage

  if (isNewStep) {
    activeMascotStep = stepKey
    const layout = pickMascotStage(ctx)
    lockedMascotStage = layout.id
    paintMascotLayout(wrap, layout, true)
    return
  }

  const layout = layoutMascotStage(lockedMascotStage!, ctx)
  if (layout) {
    paintMascotLayout(wrap, layout, false)
    return
  }

  const fallback = pickMascotStage(ctx)
  lockedMascotStage = fallback.id
  paintMascotLayout(wrap, fallback, true)
}

function placeSpotlight(
  wrap: HTMLElement,
  target: HTMLElement | null,
  stepKey: string,
): void {
  const spot = wrap.querySelector('[data-spot]') as HTMLElement
  const arrow = wrap.querySelector('[data-arrow]') as HTMLElement
  const card = wrap.querySelector('[data-card]') as HTMLElement

  if (!target) {
    spot.hidden = true
    positionCardNearTarget(card, arrow, null)
    positionMascotChoreo(wrap, stepKey, card.getBoundingClientRect())
    card.style.visibility = 'visible'
    return
  }

  target.classList.add('guide-highlight')
  if (target.matches('[data-reputation-wrap]') || target.matches('[data-goal]')) {
    target.classList.add('guide-pulse')
  }

  const r = target.getBoundingClientRect()
  const padX = target.matches('[data-goal]') ? 6 : 8
  const padY = target.matches('[data-goal]') ? 5 : 8
  const goalTarget = target.matches('[data-goal]')
  const cardAnchor = goalTarget
    ? new DOMRect(r.left, r.top, r.width, r.height + GOAL_PEEK_GAP)
    : r

  spot.hidden = false
  spot.style.left = `${r.left - padX}px`
  spot.style.top = `${r.top - padY}px`
  spot.style.width = `${r.width + padX * 2}px`
  spot.style.height = `${r.height + padY * 2}px`

  positionCardNearTarget(card, arrow, goalTarget ? cardAnchor : r)
  positionMascotChoreo(
    wrap,
    stepKey,
    card.getBoundingClientRect(),
    goalTarget ? r : null,
  )
  card.style.visibility = 'visible'
}

function finishPresentLayout(
  wrap: HTMLElement,
  root: HTMLElement,
  opts: { key: string; target?: string },
  isNew: boolean,
): void {
  const target = findTarget(root, opts.target)
  placeSpotlight(wrap, target, opts.key)
  wrap.classList.add('visible', 'positioned')
  if (isNew) wrap.classList.add('enter')
}

function renderDots(wrap: HTMLElement, stepNum: number, total: number): void {
  const progress = wrap.querySelector('[data-progress]') as HTMLElement
  progress.innerHTML = Array.from({ length: total }, (_, i) => {
    const n = i + 1
    const cls =
      n < stepNum ? 'done' : n === stepNum ? 'active' : ''
    return `<span class="guide-dot ${cls}"></span>`
  }).join('')
}

function present(
  root: HTMLElement,
  opts: {
    key: string
    icon: string
    kicker: string
    title: string
    body: string
    cta: string
    target?: string
    stepNum?: number
    totalSteps?: number
    mode: 'coach' | 'tab'
  },
  onAck: (step?: GuideStep) => void,
): void {
  const wrap = ensureHost()
  clearHighlights(root)

  const isNew = activeStep !== opts.key
  activeStep = opts.key
  onAckCallback = onAck

  wrap.querySelector('[data-kicker]')!.textContent = opts.kicker
  const iconEl = wrap.querySelector('[data-icon]') as HTMLElement
  if (opts.icon) {
    iconEl.textContent = opts.icon
    iconEl.hidden = false
    iconEl.setAttribute('aria-hidden', 'false')
  } else {
    iconEl.textContent = ''
    iconEl.hidden = true
    iconEl.setAttribute('aria-hidden', 'true')
  }
  wrap.querySelector('[data-title]')!.textContent = opts.title
  wrap.querySelector('[data-body]')!.textContent = opts.body
  ;(wrap.querySelector('[data-ok]') as HTMLButtonElement).textContent = opts.cta

  wrap.dataset.mode = opts.mode
  if (opts.stepNum && opts.totalSteps) {
    const progressEl = wrap.querySelector('[data-progress]') as HTMLElement
    renderDots(wrap, opts.stepNum, opts.totalSteps)
    progressEl.hidden = false
  } else {
    ;(wrap.querySelector('[data-progress]') as HTMLElement).hidden = true
  }

  wrap.hidden = false

  if (isNew) {
    resetMascotChoreo()
    wrap.classList.remove('visible', 'enter', 'positioned')
    void wrap.offsetWidth
  }

  const card = wrap.querySelector('[data-card]') as HTMLElement
  if (isNew) card.style.visibility = 'hidden'

  const finish = (): void => {
    finishPresentLayout(wrap, root, opts, isNew)
  }

  if (isNew) {
    requestAnimationFrame(finish)
  } else {
    finish()
  }

  const ok = wrap.querySelector('[data-ok]') as HTMLButtonElement
  ok.onclick = () => {
    const dismissedStep = activeStep as GuideStep | null
    const ack = onAckCallback
    playUnlockSound()
    dismissGuideCoach(root)
    ack?.(dismissedStep ?? undefined)
  }
}

export function dismissGuideCoach(root?: HTMLElement): void {
  if (root) clearHighlights(root)
  resetMascotChoreo()
  if (!host) return
  const mascot = host.querySelector('[data-mascot]') as HTMLElement | null
  if (mascot) mascot.hidden = true
  host.classList.remove('visible', 'enter', 'positioned')
  host.hidden = true
  activeStep = null
  onAckCallback = null
}

/** Coach-подсказка сейчас на экране */
export function isGuideCoachVisible(): boolean {
  return !!(host && !host.hidden && host.classList.contains('visible'))
}

export function hasPendingTabHint(): boolean {
  return pendingTabHint !== null
}

export function queueTabHint(hint: TabHintDef, onAck?: () => void): void {
  if (!isCoachEnabled()) {
    onAck?.()
    return
  }
  pendingTabHint = hint
  pendingTabHintAck = onAck ?? null
}

export function syncGuideOverlay(
  root: HTMLElement,
  coach: CoachDef | null,
  onAck: (step?: GuideStep) => void,
): void {
  if (coach) {
    const wrap = host
    const alreadyShowing =
      wrap &&
      !wrap.hidden &&
      activeStep === coach.step

    if (alreadyShowing) {
      wrap.querySelector('[data-body]')!.textContent = coach.body
      const target = findTarget(root, coach.target)
      placeSpotlight(wrap, target, coach.step)
      onAckCallback = onAck
      return
    }

    present(
      root,
      {
        key: coach.step,
        icon: coach.icon,
        kicker: coach.kicker,
        title: coach.title,
        body: coach.body,
        cta: coach.cta,
        target: coach.target,
        stepNum: coach.stepNum,
        totalSteps: GUIDE_STEPS_TOTAL,
        mode: 'coach',
      },
      onAck,
    )
    return
  }

  if (pendingTabHint) {
    const hint = pendingTabHint
    present(
      root,
      {
        key: `tab-${hint.id}`,
        icon: hint.icon,
        kicker: 'Новая вкладка',
        title: hint.title,
        body: hint.body,
        cta: hint.cta,
        target: hint.target,
        mode: 'tab',
      },
      () => {
        pendingTabHint = null
        pendingTabHintAck?.()
        pendingTabHintAck = null
        onAck()
      },
    )
    return
  }

  dismissGuideCoach(root)
}

export function presentStandaloneCoach(
  root: HTMLElement,
  coach: CoachDef,
  onAck: () => void,
  presentKey?: string,
): void {
  const key = presentKey ?? coach.step
  if (activeStep === key && host?.classList.contains('visible')) {
    const target = findTarget(root, coach.target)
    if (host) placeSpotlight(host, target, key)
    onAckCallback = onAck
    const ok = host.querySelector('[data-ok]') as HTMLButtonElement
    ok.onclick = () => {
      const ack = onAckCallback
      playUnlockSound()
      dismissGuideCoach(root)
      ack?.()
    }
    return
  }
  present(
    root,
    {
      key,
      icon: coach.icon,
      kicker: coach.kicker,
      title: coach.title,
      body: coach.body,
      cta: coach.cta,
      target: coach.target,
      stepNum: coach.stepNum,
      totalSteps: GUIDE_STEPS_TOTAL,
      mode: 'coach',
    },
    onAck,
  )
}
