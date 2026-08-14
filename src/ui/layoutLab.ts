/** Локальные макеты A–D + прод-оболочка Telegram (всегда D). */

import { adminForceLounge } from '../admin'
import { difficultyFromVenue } from '../data/difficulty'
import type { GameState } from '../game/state'
import { isTelegramMiniApp } from '../platform/runtime'

export type LayoutLabId = 'now' | 'a' | 'b' | 'c' | 'd'

const KEY = 'lounge-idle-ui-lab'
const PHONE_KEY = 'lounge-idle-ui-phone'
const LABELS: Record<LayoutLabId, string> = {
  now: 'Сейчас',
  a: 'A',
  b: 'B',
  c: 'C',
  d: 'D',
}

export type LabPhoneId = 'fill' | '15pm' | '15' | '16pm' | 'se' | 'tg'

interface LabPhone {
  id: LabPhoneId
  label: string
  title: string
  w: number
  h: number
  safeT: number
  safeB: number
  island: boolean
}

const PHONES: LabPhone[] = [
  { id: 'fill', label: 'Окно', title: 'Без рамки — как сейчас в браузере', w: 0, h: 0, safeT: 0, safeB: 0, island: false },
  { id: '15pm', label: '15 PM', title: 'iPhone 15 Pro Max · 430×932', w: 430, h: 932, safeT: 59, safeB: 34, island: true },
  { id: '15', label: '15', title: 'iPhone 15 / 15 Pro · 393×852', w: 393, h: 852, safeT: 59, safeB: 34, island: true },
  { id: '16pm', label: '16 PM', title: 'iPhone 16 Pro Max · 440×956', w: 440, h: 956, safeT: 62, safeB: 34, island: true },
  { id: 'se', label: 'SE', title: 'iPhone SE · 375×667', w: 375, h: 667, safeT: 20, safeB: 20, island: false },
  { id: 'tg', label: 'TG', title: 'Mini App на 15 Pro Max · 430×780', w: 430, h: 780, safeT: 16, safeB: 34, island: false },
]

export function isLayoutLabHost(): boolean {
  return import.meta.env.DEV
}

/** Макет D: Telegram Mini App + локальный лаб с ui=d. */
export function usesLayoutD(): boolean {
  if (isLayoutLabHost()) return getLayoutLab() === 'd'
  return isTelegramMiniApp()
}

function quietLabCoach(state: GameState): void {
  state.flags.tobaccoSetupPending = false
  state.flags.personalIntroPending = false
  state.flags.coalsDualHintSeen = true
  state.flags.celebration = null
  const hints = state.flags.milestoneHints
  ;(Object.keys(hints) as (keyof typeof hints)[]).forEach((k) => {
    hints[k] = true
  })
}

function seedLabLounge(state: GameState): void {
  if (!state.playerName) state.playerName = 'Никита'
  if (!state.venueId) state.venueId = 'smoke_river'
  state.difficulty = state.difficulty ?? difficultyFromVenue(state.venueId)
  state.onboarded = true
  adminForceLounge(state, 'hall')
  quietLabCoach(state)
  state.scene = 'lounge'
}

function labLoungeReady(state: GameState): boolean {
  return state.onboarded && Boolean(state.loungeTier) && state.phase !== 'employed'
}

/** На localhost сразу свой лаунж — чтобы крутить вкладки Табак / Команда / Личное. Боевой сейв TG не трогает. */
export function ensureLabLounge(state: GameState): boolean {
  if (!isLayoutLabHost()) return false
  try {
    if (labLoungeReady(state)) {
      quietLabCoach(state)
      state.scene = 'lounge'
      return false
    }
    seedLabLounge(state)
    return true
  } catch (err) {
    console.error('[layout-lab] не открылся зал', err)
    return false
  }
}

/** Всегда заново открыть Сладкий пар — кнопка «Зал» и смена макета. */
export function forceLabLounge(state: GameState): void {
  if (!isLayoutLabHost()) return
  try {
    seedLabLounge(state)
  } catch (err) {
    console.error('[layout-lab] не открылся зал', err)
  }
}

export function showLabLounge(state: GameState): void {
  forceLabLounge(state)
}

let labApplied: (() => void) | null = null
let storyDockOpen = false

export function onLayoutLabApplied(fn: () => void): void {
  labApplied = fn
}

export function setLabStoryDockOpen(open: boolean): void {
  storyDockOpen = open
}

export function isLabStoryDockOpen(): boolean {
  return storyDockOpen
}

/** В макете D: Табак/Команда выезжают вместо «Сюжет». */
export function syncLabStoryMenu(root: HTMLElement, menuTab: string): void {
  const shell = root.querySelector('.app-shell') as HTMLElement | null
  if (!shell) return
  if (!usesLayoutD()) {
    delete shell.dataset.storyMenu
    storyDockOpen = false
    return
  }
  const nested =
    menuTab === 'tobacco' ||
    menuTab === 'staff' ||
    menuTab === 'personal' ||
    menuTab === 'network'
  shell.dataset.storyMenu = storyDockOpen || nested ? 'open' : 'closed'
}

function readQuery(): LayoutLabId | null {
  const q = new URLSearchParams(location.search).get('ui')
  if (q === 'a' || q === 'b' || q === 'c' || q === 'd' || q === 'now') return q
  return null
}

export function getLayoutLab(): LayoutLabId {
  if (!isLayoutLabHost()) return 'now'
  const fromQuery = readQuery()
  if (fromQuery) return fromQuery
  try {
    const stored = sessionStorage.getItem(KEY)
    if (stored === 'a' || stored === 'b' || stored === 'c' || stored === 'd' || stored === 'now') {
      return stored
    }
  } catch {
    /* private mode */
  }
  return 'd'
}

function isLabPhoneId(id: string | null | undefined): id is LabPhoneId {
  return PHONES.some((p) => p.id === id)
}

function readPhoneQuery(): LabPhoneId | null {
  const q = new URLSearchParams(location.search).get('phone')
  return isLabPhoneId(q) ? q : null
}

export function getLabPhone(): LabPhone {
  const fallback = PHONES[1]!
  if (!isLayoutLabHost()) return PHONES[0]!
  const fromQuery = readPhoneQuery()
  const fromQueryPhone = PHONES.find((p) => p.id === fromQuery)
  if (fromQueryPhone) return fromQueryPhone
  try {
    const stored = sessionStorage.getItem(PHONE_KEY)
    const storedPhone = PHONES.find((p) => p.id === stored)
    if (storedPhone) return storedPhone
  } catch {
    /* private mode */
  }
  return fallback
}

function phoneScale(phone: LabPhone): number {
  if (phone.id === 'fill') return 1
  const bar = 96
  const pad = 56
  const bezel = 28
  const availW = Math.max(160, window.innerWidth - bar - pad)
  const availH = Math.max(160, window.innerHeight - pad)
  return Math.min(1, availW / (phone.w + bezel), availH / (phone.h + bezel + 36))
}

function unwrapPhone(app: HTMLElement): void {
  const stage = app.closest('.layout-lab-stage')
  if (!stage) return
  stage.replaceWith(app)
}

function wrapPhone(app: HTMLElement, phone: LabPhone): void {
  let stage = document.querySelector('.layout-lab-stage')
  if (!stage) {
    stage = document.createElement('div')
    stage.className = 'layout-lab-stage'
    const frame = document.createElement('div')
    frame.className = 'layout-lab-phone'
    frame.innerHTML = `
      <div class="layout-lab-phone__island" aria-hidden="true"></div>
      <div class="layout-lab-phone__tg" aria-hidden="true">
        <span class="layout-lab-phone__tg-btn layout-lab-phone__tg-btn--close" title="Закрыть Mini App">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6.7 6.7a1 1 0 0 1 1.4 0L12 10.6l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 12l3.9 3.9a1 1 0 1 1-1.4 1.4L12 13.4l-3.9 3.9a1 1 0 1 1-1.4-1.4L10.6 12 6.7 8.1a1 1 0 0 1 0-1.4Z"/></svg>
        </span>
        <span class="layout-lab-phone__tg-btn layout-lab-phone__tg-btn--more" title="Меню Telegram">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
        </span>
      </div>
      <div class="layout-lab-phone__home" aria-hidden="true"></div>
    `
    app.replaceWith(stage)
    stage.appendChild(frame)
    frame.appendChild(app)
    const meta = document.createElement('p')
    meta.className = 'layout-lab-phone__meta'
    stage.appendChild(meta)
  }
  const frame = stage.querySelector('.layout-lab-phone') as HTMLElement | null
  const meta = stage.querySelector('.layout-lab-phone__meta')
  if (frame) {
    frame.dataset.island = phone.island ? '1' : '0'
    frame.dataset.tgChrome = '1'
    frame.style.width = `${phone.w}px`
    frame.style.height = `${phone.h}px`
    if (!frame.querySelector('.layout-lab-phone__tg')) {
      const tg = document.createElement('div')
      tg.className = 'layout-lab-phone__tg'
      tg.setAttribute('aria-hidden', 'true')
      tg.innerHTML = `
        <span class="layout-lab-phone__tg-btn layout-lab-phone__tg-btn--close" title="Закрыть Mini App">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M6.7 6.7a1 1 0 0 1 1.4 0L12 10.6l3.9-3.9a1 1 0 1 1 1.4 1.4L13.4 12l3.9 3.9a1 1 0 1 1-1.4 1.4L12 13.4l-3.9 3.9a1 1 0 1 1-1.4-1.4L10.6 12 6.7 8.1a1 1 0 0 1 0-1.4Z"/></svg>
        </span>
        <span class="layout-lab-phone__tg-btn layout-lab-phone__tg-btn--more" title="Меню Telegram">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
        </span>
      `
      frame.appendChild(tg)
    }
  }
  if (meta) meta.textContent = phone.title
}

function applyDeviceFrame(): void {
  if (!isLayoutLabHost()) return
  const app = document.getElementById('app')
  if (!app) return
  const phone = getLabPhone()
  const html = document.documentElement
  if (phone.id === 'fill') {
    unwrapPhone(app)
    html.classList.remove('layout-lab-device')
    html.style.removeProperty('--lab-device-scale')
    html.style.removeProperty('--safe-t')
    html.style.removeProperty('--safe-b')
    html.style.removeProperty('--lab-safe-t')
    html.style.removeProperty('--lab-safe-b')
  } else {
    html.classList.add('layout-lab-device')
    html.style.setProperty('--lab-device-scale', String(phoneScale(phone)))
    html.style.setProperty('--safe-t', `${phone.safeT}px`)
    html.style.setProperty('--safe-b', `${phone.safeB}px`)
    html.style.setProperty('--lab-safe-t', `${phone.safeT}px`)
    html.style.setProperty('--lab-safe-b', `${phone.safeB}px`)
    wrapPhone(app, phone)
  }
  syncPhoneButtons(phone.id)
}

export function setLabPhone(id: LabPhoneId): void {
  if (!isLayoutLabHost() || !isLabPhoneId(id)) return
  try {
    sessionStorage.setItem(PHONE_KEY, id)
  } catch {
    /* ignore */
  }
  const url = new URL(location.href)
  if (id === '15pm') url.searchParams.delete('phone')
  else url.searchParams.set('phone', id)
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  applyDeviceFrame()
}

export function applyLayoutLab(root: HTMLElement): void {
  const shell = root.querySelector('.app-shell') as HTMLElement | null
  if (shell) {
    if (isLayoutLabHost()) {
      const id = getLayoutLab()
      if (id === 'now') shell.removeAttribute('data-ui')
      else shell.setAttribute('data-ui', id)
      if (id !== 'd') {
        storyDockOpen = false
        delete shell.dataset.storyMenu
      }
    } else if (isTelegramMiniApp()) {
      shell.setAttribute('data-ui', 'd')
    } else {
      shell.removeAttribute('data-ui')
      delete shell.dataset.storyMenu
      storyDockOpen = false
    }
  }
  if (isLayoutLabHost()) {
    syncLabButtons(getLayoutLab())
    applyDeviceFrame()
  }
}

export function setLayoutLab(id: LayoutLabId, root: HTMLElement): void {
  if (!isLayoutLabHost()) return
  try {
    sessionStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
  const url = new URL(location.href)
  if (id === 'd') url.searchParams.delete('ui')
  else url.searchParams.set('ui', id)
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
  applyLayoutLab(root)
  labApplied?.()
}

function syncLabButtons(id: LayoutLabId): void {
  document.querySelectorAll<HTMLButtonElement>('[data-layout-lab]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.layoutLab === id ? 'true' : 'false')
  })
}

function syncPhoneButtons(id: LabPhoneId): void {
  document.querySelectorAll<HTMLButtonElement>('[data-layout-phone]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.layoutPhone === id ? 'true' : 'false')
  })
}

let phoneResizeBound = false

function bindPhoneResize(): void {
  if (phoneResizeBound) return
  phoneResizeBound = true
  window.addEventListener('resize', () => {
    if (getLabPhone().id !== 'fill') applyDeviceFrame()
  })
}

export function mountLayoutLabSwitcher(root: HTMLElement): void {
  if (!isLayoutLabHost()) return
  document.querySelector('.layout-lab')?.remove()

  const bar = document.createElement('div')
  bar.className = 'layout-lab'
  bar.setAttribute('role', 'toolbar')
  bar.setAttribute('aria-label', 'Макеты для теста')
  bar.innerHTML = `
    <span class="layout-lab__kicker">Макет</span>
    ${(Object.keys(LABELS) as LayoutLabId[])
      .map(
        (id) =>
        `<button type="button" class="layout-lab__btn" data-layout-lab="${id}"${id === 'd' ? ' title="Рабочий макет"' : ''}>${LABELS[id]}</button>`,
      )
      .join('')}
    <button type="button" class="layout-lab__btn layout-lab__btn--lounge" data-layout-lab-lounge>Зал</button>
    <span class="layout-lab__rule" aria-hidden="true"></span>
    <span class="layout-lab__kicker">Экран</span>
    ${PHONES.map(
      (p) =>
        `<button type="button" class="layout-lab__btn" data-layout-phone="${p.id}" title="${p.title}">${p.label}</button>`,
    ).join('')}
  `
  document.body.appendChild(bar)
  bar.addEventListener('click', (e) => {
    const loungeBtn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-layout-lab-lounge]',
    )
    if (loungeBtn) {
      labApplied?.()
      return
    }
    const phoneBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-layout-phone]')
    const phoneId = phoneBtn?.dataset.layoutPhone
    if (isLabPhoneId(phoneId)) {
      setLabPhone(phoneId)
      return
    }
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-layout-lab]')
    const id = btn?.dataset.layoutLab
    if (id === 'now' || id === 'a' || id === 'b' || id === 'c' || id === 'd') {
      setLayoutLab(id, root)
    }
  })
  bindPhoneResize()
  applyLayoutLab(root)
  labApplied?.()
}
