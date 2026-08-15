import { BRANCHES } from '../data/branches'
import {
  CITY_MAP_PINS,
  CITY_MAP_VIEW,
  type CityMapPinId,
  getCityMapPin,
  projectCity,
} from '../data/cityMap'
import { getLoungeTier } from '../data/loungeTiers'
import { scaledBranchCost } from '../game/difficulty'
import { formatMoney } from '../game/economy'
import { isBranchOwned, isBranchUnlocked } from '../game/empire'
import type { GameState } from '../game/state'

export type { CityMapPinId }

/** null = карта без карточки (стартовый вид) */
let selectedPin: CityMapPinId | null = null

export function getNetworkMapSelection(): CityMapPinId | null {
  return selectedPin
}

export function setNetworkMapSelection(id: CityMapPinId | null): void {
  selectedPin = id
}

export function clearNetworkMapSelection(): void {
  selectedPin = null
}

export function normalizeNetworkMapSelection(): CityMapPinId | null {
  if (selectedPin == null) return null
  if (selectedPin === 'hq') return 'hq'
  if (BRANCHES.some((b) => b.id === selectedPin)) return selectedPin
  selectedPin = null
  return null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pinState(
  state: GameState,
  id: CityMapPinId,
): 'hq' | 'owned' | 'open' | 'locked' | 'afford' {
  if (id === 'hq') return 'hq'
  const def = BRANCHES.find((b) => b.id === id)
  if (!def) return 'locked'
  if (isBranchOwned(state, id)) return 'owned'
  if (!isBranchUnlocked(state, def)) return 'locked'
  if (state.cash >= scaledBranchCost(state, def.cost)) return 'afford'
  return 'open'
}

export function cityMapArtUrl(): string {
  return `${import.meta.env.BASE_URL}art/city-topo.webp`
}

/**
 * Референсная топография на весь блок + точки сети.
 * Карточка точки — только после выбора пина.
 */
export function renderCityMapSvg(state: GameState, selected: CityMapPinId | null): string {
  const { w, h } = CITY_MAP_VIEW

  const pins = CITY_MAP_PINS.map((pin) => {
    const p = projectCity(pin.x, pin.y)
    const st = pinState(state, pin.id)
    const active = selected === pin.id ? 'is-selected' : ''
    /* стартовый размер — точный подгон в fitCityMapPinChips() */
    const chipW = Math.max(32, Math.round(pin.label.length * 5.4 + 12))
    const chipH = 14
    const chipX = (-chipW / 2).toFixed(1)
    return `
      <g class="city-map__pin city-map__pin--${st} ${active}" data-map-pin="${pin.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
        <circle class="city-map__pin-hit" cx="0" cy="0" r="20" />
        <circle class="city-map__pin-ring" cx="0" cy="0" r="10" />
        <circle class="city-map__pin-dot" cx="0" cy="0" r="5" />
        <g class="city-map__pin-caption" transform="translate(0 15)">
          <rect class="city-map__pin-chip" x="${chipX}" y="${(-chipH / 2).toFixed(1)}" width="${chipW}" height="${chipH}" rx="${(chipH / 2).toFixed(2)}" />
          <text class="city-map__pin-label" x="0" y="0" text-anchor="middle" dominant-baseline="central">${escapeHtml(pin.label)}</text>
        </g>
      </g>
    `
  }).join('')

  return `
    <svg class="city-map__svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Карта сети">
      ${pins}
    </svg>
  `
}

/** Подогнать чипы подписей под реальный bbox текста (одинаковая высота). */
export function fitCityMapPinChips(root: ParentNode): void {
  const padX = 4
  const padY = 2
  type Row = { chip: SVGRectElement; w: number; h: number }
  const rows: Row[] = []
  let maxH = 0

  root.querySelectorAll('.city-map__pin').forEach((pin) => {
    const chip = pin.querySelector('.city-map__pin-chip') as SVGRectElement | null
    const label = pin.querySelector('.city-map__pin-label') as SVGTextElement | null
    if (!chip || !label) return
    let bbox: DOMRect
    try {
      bbox = label.getBBox()
    } catch {
      return
    }
    if (!(bbox.width > 0) || !(bbox.height > 0)) return
    const w = Math.max(24, bbox.width + padX * 2)
    const h = Math.max(10, bbox.height + padY * 2)
    maxH = Math.max(maxH, h)
    rows.push({ chip, w, h })
  })

  for (const row of rows) {
    const h = maxH || row.h
    row.chip.setAttribute('width', row.w.toFixed(1))
    row.chip.setAttribute('height', h.toFixed(1))
    row.chip.setAttribute('x', (-row.w / 2).toFixed(1))
    row.chip.setAttribute('y', (-h / 2).toFixed(1))
    row.chip.setAttribute('rx', (h / 2).toFixed(2))
  }
}

export function renderNetworkMapDetail(
  state: GameState,
  selected: CityMapPinId | null,
): string {
  if (selected == null) return ''

  const closeBtn = `<button type="button" class="city-map__detail-close" data-map-clear aria-label="Закрыть">×</button>`

  if (selected === 'hq') {
    const name = state.loungeName || getLoungeTier(state.loungeTier).name
    const ownedCount = BRANCHES.filter((b) => isBranchOwned(state, b.id)).length
    return `
      <article class="city-map__detail city-map__detail--hq" data-map-detail="hq">
        ${closeBtn}
        <div class="city-map__detail-row">
          <span class="city-map__detail-badge">Штаб</span>
          <span class="city-map__detail-meta">${ownedCount}/5 · центр</span>
        </div>
        <h3 class="city-map__detail-title">${escapeHtml(name)}</h3>
        <p class="city-map__detail-sub">Якорь сети — тапни точку, чтобы открыть филиал</p>
      </article>
    `
  }

  const def = BRANCHES.find((b) => b.id === selected)
  const pin = getCityMapPin(selected)
  if (!def || !pin) return ''

  const owned = isBranchOwned(state, selected)
  const unlocked = isBranchUnlocked(state, def)
  const cost = scaledBranchCost(state, def.cost)
  const can = unlocked && !owned && state.cash >= cost
  const short = Math.max(0, Math.ceil(cost - state.cash))
  const prev = def.needBranch
    ? BRANCHES.find((b) => b.id === def.needBranch)?.name
    : null
  const incomePct = Math.round(def.incomeMult * 100)
  const tipPct = Math.round(def.clickMult * 100)

  let badge = 'Точка'
  let tone = 'open'
  if (owned) {
    badge = 'В сети'
    tone = 'owned'
  } else if (!unlocked) {
    badge = 'Закрыто'
    tone = 'locked'
  } else if (can) {
    badge = 'Доступно'
    tone = 'afford'
  } else {
    badge = 'Накопить'
    tone = 'short'
  }

  const bonuses = `+${incomePct}% доход · +${tipPct}% чаевые`

  let bar = ''
  if (owned) {
    bar = `
      <div class="city-map__detail-bar">
        <span class="city-map__detail-info">${bonuses}</span>
      </div>
    `
  } else if (!unlocked) {
    bar = `
      <div class="city-map__detail-bar">
        <span class="city-map__detail-info is-locked">${
          prev ? `Нужен «${escapeHtml(prev)}»` : 'Пока закрыто'
        }</span>
        <span class="city-map__detail-price">${formatMoney(cost)}</span>
      </div>
    `
  } else if (can) {
    bar = `
      <div class="city-map__detail-bar">
        <span class="city-map__detail-info">${bonuses}</span>
        <button type="button" class="city-map__buy is-afford" data-branch="${def.id}">
          Открыть <em>${formatMoney(cost)}</em>
        </button>
      </div>
    `
  } else {
    bar = `
      <div class="city-map__detail-bar">
        <span class="city-map__detail-info">${bonuses}</span>
        <button type="button" class="city-map__buy" data-branch="${def.id}" disabled>
          ещё <em>${formatMoney(short)}</em>
        </button>
      </div>
    `
  }

  return `
    <article class="city-map__detail city-map__detail--${tone}" data-map-detail="${def.id}">
      ${closeBtn}
      <div class="city-map__detail-row">
        <span class="city-map__detail-badge">${badge}</span>
        <span class="city-map__detail-meta">${escapeHtml(pin.district)}</span>
      </div>
      <h3 class="city-map__detail-title">${escapeHtml(def.name)}</h3>
      ${bar}
    </article>
  `
}
