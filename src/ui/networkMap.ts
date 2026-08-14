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

let selectedPin: CityMapPinId = 'hq'

export function getNetworkMapSelection(): CityMapPinId {
  return selectedPin
}

export function setNetworkMapSelection(id: CityMapPinId): void {
  selectedPin = id
}

export function normalizeNetworkMapSelection(): CityMapPinId {
  if (selectedPin === 'hq') return 'hq'
  if (BRANCHES.some((b) => b.id === selectedPin)) return selectedPin
  selectedPin = 'hq'
  return 'hq'
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
 * Линий между точками нет — только пины и карточка состояния.
 */
export function renderCityMapSvg(state: GameState, selected: CityMapPinId): string {
  const { w, h } = CITY_MAP_VIEW

  const pins = CITY_MAP_PINS.map((pin) => {
    const p = projectCity(pin.x, pin.y)
    const st = pinState(state, pin.id)
    const active = selected === pin.id ? 'is-selected' : ''
    return `
      <g class="city-map__pin city-map__pin--${st} ${active}" data-map-pin="${pin.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})">
        <circle class="city-map__pin-hit" cx="0" cy="0" r="24" />
        <circle class="city-map__pin-ring" cx="0" cy="0" r="12" />
        <circle class="city-map__pin-dot" cx="0" cy="0" r="6" />
        <text class="city-map__pin-label" x="0" y="22" text-anchor="middle">${pin.label}</text>
      </g>
    `
  }).join('')

  return `
    <svg class="city-map__svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Карта сети">
      ${pins}
    </svg>
  `
}

export function renderNetworkMapDetail(state: GameState, selected: CityMapPinId): string {
  if (selected === 'hq') {
    const name = state.loungeName || getLoungeTier(state.loungeTier).name
    return `
      <div class="city-map__detail" data-map-detail="hq">
        <p class="city-map__detail-kicker">Главный лаунж · Центр</p>
        <p class="city-map__detail-title">${escapeHtml(name)}</p>
        <p class="city-map__detail-sub">Штаб сети — отсюда растут филиалы по городу</p>
      </div>
    `
  }

  const def = BRANCHES.find((b) => b.id === selected)
  const pin = getCityMapPin(selected)
  if (!def || !pin) return ''

  const owned = isBranchOwned(state, selected)
  const unlocked = isBranchUnlocked(state, def)
  const cost = scaledBranchCost(state, def.cost)
  const can = unlocked && !owned && state.cash >= cost
  const prev = def.needBranch
    ? BRANCHES.find((b) => b.id === def.needBranch)?.name
    : null

  let action = ''
  if (owned) {
    action = `<span class="city-map__detail-status">в сети</span>`
  } else if (!unlocked) {
    action = `<span class="city-map__detail-status is-locked">${
      prev ? `Сначала «${escapeHtml(prev)}»` : 'Закрыто'
    }</span>`
  } else {
    action = `
      <button type="button" class="city-map__buy ${can ? 'is-afford' : ''}" data-branch="${def.id}" ${
        can ? '' : 'disabled'
      }>
        ${can ? 'Открыть' : 'Не хватает'} · ${formatMoney(cost)}
      </button>
    `
  }

  return `
    <div class="city-map__detail" data-map-detail="${def.id}">
      <p class="city-map__detail-kicker">${escapeHtml(pin.district)} · филиал</p>
      <p class="city-map__detail-title">${escapeHtml(def.name)}</p>
      <p class="city-map__detail-sub">${escapeHtml(def.blurb)} · +${Math.round(
        def.incomeMult * 100,
      )}% доход · +${Math.round(def.clickMult * 100)}% чаевые</p>
      ${action}
    </div>
  `
}
