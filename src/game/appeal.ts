import { EXPANSIONS } from '../data/expansions'
import { getTobacco, type TobaccoId } from '../data/tobacco'
import type { GameState } from './state'

/** Сколько позиций можно выставить в меню */
export function menuSlotCount(state: GameState): number {
  return Math.min(8, 1 + state.owned.menu + (state.owned.sofa >= 1 ? 1 : 0))
}

export function ensureMenuSlots(state: GameState): void {
  const n = menuSlotCount(state)
  while (state.menuSlots.length < n) state.menuSlots.push(null)
}

export function menuFilledCount(state: GameState): number {
  ensureMenuSlots(state)
  const n = menuSlotCount(state)
  return state.menuSlots.slice(0, n).filter(Boolean).length
}

/** Места от мебели */
export function furnitureSeats(state: GameState): number {
  return (
    state.owned.table * 2 +
    state.owned.sofa * 3 +
    state.owned.vip * 4
  )
}

/** Места от расширений */
export function expansionSeats(state: GameState): number {
  let sum = 0
  for (const def of EXPANSIONS) {
    if (state.expansions[def.id]) sum += def.seats
  }
  return sum
}

/** Максимальная посадка */
export function seatCapacity(state: GameState): number {
  return Math.max(2, furnitureSeats(state) + expansionSeats(state))
}

/** Спрос: сколько «хотят» прийти (меню + техника + зоны) */
export function guestDemand(state: GameState): number {
  const gear = state.owned.hood * 1.2 + state.owned.vip * 0.8

  ensureMenuSlots(state)
  const n = menuSlotCount(state)
  const slots = state.menuSlots.slice(0, n)
  const filled = slots.filter(Boolean) as TobaccoId[]
  const unique = new Set(filled)
  let menuScore = 0
  for (const id of unique) {
    menuScore += getTobacco(id)?.appeal ?? 1
  }
  const emptyPenalty = (n - filled.length) * 0.15
  const catalog = Object.values(state.ownedTobacco).filter(Boolean).length * 0.05

  let demandBonus = 0
  for (const def of EXPANSIONS) {
    if (state.expansions[def.id]) demandBonus += def.demandBonus
  }

  let demand =
    2 + gear * 1.1 + menuScore * 1.4 + catalog * 2 + demandBonus * 4 - emptyPenalty * 2

  if (filled.length === 0) demand *= 0.4

  return Math.max(1, demand)
}

/**
 * Фактические гости = min(спрос, посадка).
 * Переполнение: спрос выше посадки — гости не вмещаются, доход упирается в места.
 */
export function seatedGuests(state: GameState): number {
  return Math.min(guestDemand(state), seatCapacity(state))
}

/** Множитель выручки от заполненности зала */
export function guestTraffic(state: GameState): number {
  if (state.phase === 'employed') return 1
  const seated = seatedGuests(state)
  // ~4 посаженных ≈ ×1.0, дальше растёт с softcap
  const mult = 0.35 + seated * 0.09
  return Math.max(0.28, Math.min(2.5, mult))
}

export function trafficLabel(mult: number): string {
  if (mult < 0.5) return 'почти пусто'
  if (mult < 0.85) return 'редко'
  if (mult < 1.15) return 'средне'
  if (mult < 1.6) return 'людно'
  return 'аншлаг'
}

export function capacityStatus(state: GameState): {
  seated: number
  capacity: number
  demand: number
  full: boolean
} {
  const capacity = seatCapacity(state)
  const demand = guestDemand(state)
  const seated = Math.min(demand, capacity)
  return {
    seated: Math.round(seated * 10) / 10,
    capacity,
    demand: Math.round(demand * 10) / 10,
    full: demand > capacity + 0.05,
  }
}

export function trafficBreakdown(state: GameState): string {
  const { seated, capacity, demand, full } = capacityStatus(state)
  const filled = menuFilledCount(state)
  const slots = menuSlotCount(state)
  const base = `посадка ${seated}/${capacity} · спрос ${demand} · меню ${filled}/${slots}`
  return full ? `${base} · зал полный, гости ждут` : base
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
