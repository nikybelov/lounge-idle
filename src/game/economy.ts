import {
  BASE_LOUNGE_CLICK,
  COST_GROWTH,
  UPGRADES,
  type UpgradeDef,
  type UpgradeId,
} from '../data/upgrades'
import { guestTraffic, expansionIncomeBonus, shelfBonuses } from './appeal'
import { empireClickMult, empireIncomeMult } from './empire'
import { staffBonuses, staffPayrollPerSec } from './staff'
import type { GameState } from './state'

export function upgradeCost(def: UpgradeDef, level: number): number {
  return Math.floor(def.baseCost * COST_GROWTH ** level)
}

export function isUpgradeUnlocked(state: GameState, def: UpgradeDef): boolean {
  if (!def.unlockAtOwned) return true
  return Object.entries(def.unlockAtOwned).every(
    ([id, need]) => state.owned[id as UpgradeId] >= (need ?? 0),
  )
}

export function loungeGrossIncomePerSec(state: GameState): number {
  let sum = expansionIncomeBonus(state)
  for (const def of UPGRADES) {
    sum += def.incomePerLevel * state.owned[def.id]
  }
  sum += shelfBonuses(state).income
  sum += staffBonuses(state).income
  return (
    sum *
    (state.loungeIncomeMult || 1) *
    guestTraffic(state) *
    empireIncomeMult(state)
  )
}

/** Чистый пассив: выручка минус ФОТ команды */
export function loungeIncomePerSec(state: GameState): number {
  return loungeGrossIncomePerSec(state) - staffPayrollPerSec(state)
}

/** Доля ФОТ в валовой выручке (0–1). Эталон прибыльного заведения ~0.30–0.35 */
export function staffPayrollShare(state: GameState): number {
  const gross = loungeGrossIncomePerSec(state)
  if (gross <= 0) return 0
  return staffPayrollPerSec(state) / gross
}

export function loungeClickPower(state: GameState): number {
  let click = BASE_LOUNGE_CLICK
  for (const def of UPGRADES) {
    click += def.clickPerLevel * state.owned[def.id]
  }
  click += staffBonuses(state).click
  const tip = 1 + shelfBonuses(state).tip
  return (
    click *
    (state.loungeClickMult || 1) *
    guestTraffic(state) *
    tip *
    empireClickMult(state)
  )
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (n < 1000) return n < 10 ? n.toFixed(n % 1 ? 1 : 0) : Math.floor(n).toString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(2)}M`
}
