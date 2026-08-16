import { EXPANSIONS } from '../data/expansions'
import { AMBASSADOR_SHELF_MULT } from '../data/ambassador'
import { getTobacco, type TobaccoId } from '../data/tobacco'
import { isAmbassador } from './ambassador'
import { staffGuestBonus } from './staff'
import { personalTrafficBonus } from './personal'
import { promotionTrafficBonus } from './promotions'
import { loungeShopStaffGuestMult } from './loungeShop'
import { serviceStatus, type ServiceStatus } from './service'
import { weekdayOf, weekdayTrafficMult } from './workDays'
import type { GameState } from './state'

/** Сколько позиций можно выставить на табачную полку */
export function shelfCapacity(state: GameState): number {
  return Math.min(12, 2 + state.owned.menu * 2 + (state.owned.sofa >= 1 ? 2 : 0))
}

export function shelfActiveCount(state: GameState): number {
  return state.shelfActive.length
}

export function tobaccoStockCount(state: GameState): number {
  return Object.values(state.ownedTobacco).filter(Boolean).length
}

export function isOnShelf(state: GameState, id: TobaccoId): boolean {
  return state.shelfActive.includes(id)
}

/** Суммарные бонусы активной полки */
export function shelfBonuses(state: GameState): {
  guest: number
  tip: number
  income: number
} {
  let guest = 0
  let tip = 0
  let income = 0
  for (const id of state.shelfActive) {
    const t = getTobacco(id)
    if (!t) continue
    guest += t.guestBonus
    tip += t.tipBonus
    income += t.incomeBonus
    if (isAmbassador(state, id)) {
      guest += t.guestBonus * (AMBASSADOR_SHELF_MULT - 1)
      tip += t.tipBonus * (AMBASSADOR_SHELF_MULT - 1)
      income += t.incomeBonus * (AMBASSADOR_SHELF_MULT - 1)
    }
  }
  return { guest, tip, income }
}

/** Есть ли на полке хоть один вкус — без этого гости не приходят */
export function shelfHasService(state: GameState): boolean {
  return state.shelfActive.length > 0
}

/** Множитель спроса от разнообразия полки */
export function shelfVarietyMult(state: GameState): number {
  const n = state.shelfActive.length
  if (n === 0) return 0
  if (n === 1) return 0.55
  if (n === 2) return 0.72
  if (n >= 6) return 1.2
  if (n >= 4) return 1.08
  return 1
}

export function shelfMood(state: GameState): 'empty' | 'sparse' | 'ok' | 'rich' {
  const n = state.shelfActive.length
  if (n === 0) return 'empty'
  if (n <= 2) return 'sparse'
  if (n >= 5) return 'rich'
  return 'ok'
}

/** @deprecated use shelfCapacity */
export function menuSlotCount(state: GameState): number {
  return shelfCapacity(state)
}

/** @deprecated use shelfActiveCount */
export function menuFilledCount(state: GameState): number {
  return shelfActiveCount(state)
}

/** @deprecated no-op */
export function ensureMenuSlots(_state: GameState): void {}

export function furnitureSeats(state: GameState): number {
  return (
    state.owned.table * 2 +
    state.owned.sofa * 3 +
    state.owned.vip * 4
  )
}

export function expansionSeats(state: GameState): number {
  let sum = 0
  for (const def of EXPANSIONS) {
    if (state.expansions[def.id]) sum += def.seats
  }
  return sum
}

export function seatCapacity(state: GameState): number {
  return Math.max(2, furnitureSeats(state) + expansionSeats(state))
}

export function guestDemand(state: GameState): number {
  // Пустая полка = нечего курить → спроса нет (столы сами по себе не кормят)
  if (!shelfHasService(state)) return 0

  const gear = state.owned.hood * 1.2 + state.owned.vip * 0.8
  const { guest } = shelfBonuses(state)
  const variety = shelfVarietyMult(state)

  let demandBonus = 0
  for (const def of EXPANSIONS) {
    if (state.expansions[def.id]) demandBonus += def.demandBonus
  }

  let demand =
    (2 + gear * 1.1 + guest * 2.2 + demandBonus * 4) * variety

  const stock = tobaccoStockCount(state)
  if (stock > state.shelfActive.length) {
    demand += Math.min(0.4, (stock - state.shelfActive.length) * 0.03)
  }

  return Math.max(0, demand)
}

/** Сырая посадка до ухода из-за плохого сервиса */
export function rawSeatedGuests(state: GameState): number {
  return Math.min(guestDemand(state), seatCapacity(state))
}

export function loungeService(state: GameState): ServiceStatus {
  return serviceStatus(state, rawSeatedGuests(state), seatCapacity(state))
}

/** Эффективные гости (минус ушедшие из-за сервиса) */
export function seatedGuests(state: GameState): number {
  const raw = rawSeatedGuests(state)
  const { walkaway } = loungeService(state)
  return raw * (1 - walkaway)
}

export function guestTraffic(state: GameState, now = Date.now()): number {
  if (state.phase === 'employed') return 1
  if (!shelfHasService(state)) return 0
  const seated = seatedGuests(state)
  const mult =
    (0.38 +
      seated * 0.1 +
      staffGuestBonus(state) * loungeShopStaffGuestMult(state) +
      personalTrafficBonus(state, now) +
      promotionTrafficBonus(state, now)) *
    weekdayTrafficMult(state)
  return Math.max(0.28, Math.min(3.2, mult))
}

export function trafficLabel(mult: number): string {
  if (mult <= 0) return 'нет гостей'
  if (mult < 0.5) return 'почти пусто'
  if (mult < 0.85) return 'редко'
  if (mult < 1.15) return 'средне'
  if (mult < 1.6) return 'людно'
  return 'сильный поток'
}

export function capacityStatus(state: GameState): {
  seated: number
  capacity: number
  demand: number
  full: boolean
  service: ServiceStatus
} {
  const capacity = seatCapacity(state)
  const demand = guestDemand(state)
  const seated = Math.min(demand, capacity)
  const service = serviceStatus(state, seated, capacity)
  return {
    seated: Math.round(seated),
    capacity: Math.round(capacity),
    demand: Math.round(demand),
    full: demand > capacity + 0.05,
    service,
  }
}

export function trafficBreakdown(state: GameState): string {
  const { seated, capacity, demand, full, service } = capacityStatus(state)
  const active = shelfActiveCount(state)
  const cap = shelfCapacity(state)
  const mood = shelfMood(state)
  const moodText =
    mood === 'empty'
      ? 'полка пуста'
      : mood === 'sparse'
        ? 'мало вкусов'
        : mood === 'rich'
          ? 'богатая полка'
          : 'норм'
  const svc =
    service.mood === 'ok' ? '' : ` · ${service.label.toLowerCase()}`
  const day = weekdayOf(state)
  const weekend = day.traffic > 1 ? ` · ${day.name}` : ''
  const base = `посадка ${seated}/${capacity} · спрос ${demand} · полка ${active}/${cap} (${moodText})${svc}${weekend}`
  return full ? `${base} · лаунж полный` : base
}

export function expansionIncomeBonus(state: GameState): number {
  let sum = 0
  for (const def of EXPANSIONS) {
    if (state.expansions[def.id]) sum += def.incomeBonus
  }
  return sum
}

export function furnitureLevel(state: GameState): number {
  return state.owned.table + state.owned.sofa + state.owned.vip
}
