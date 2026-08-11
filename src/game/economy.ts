import {
  BASE_LOUNGE_CLICK,
  BASE_LOUNGE_PASSIVE,
  COST_GROWTH,
  UPGRADES,
  type UpgradeDef,
  type UpgradeId,
} from '../data/upgrades'
import {
  guestTraffic,
  expansionIncomeBonus,
  loungeService,
  shelfBonuses,
  shelfHasService,
} from './appeal'
import { empireClickMult, empireIncomeMult } from './empire'
import { staffBonuses, staffBasePayrollPerSec, hiredStaffCount, managerPayrollDiscount, maxTeamHeadcount } from './staff'
import type { GameState } from './state'

/** ФОТ: базовые ставки или доля от валовой выручки — что больше (при росте зала команда «съедает» прибыль) */
export function staffPayrollPerSec(state: GameState): number {
  const base = staffBasePayrollPerSec(state)
  const headcount = hiredStaffCount(state)
  if (headcount <= 0) return 0

  const gross = loungeGrossIncomePerSec(state)
  const teamFill = headcount / maxTeamHeadcount()
  const targetShare = 0.12 + teamFill * 0.24
  let payroll = Math.max(base, gross * targetShare)

  const discount = managerPayrollDiscount(state)
  if (discount > 0) payroll *= 1 - discount
  return payroll
}

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
  // Без полки — нечего продавать: ни база, ни мебель не дают выручку
  if (!shelfHasService(state)) return 0

  let sum = BASE_LOUNGE_PASSIVE + expansionIncomeBonus(state)
  for (const def of UPGRADES) {
    sum += def.incomePerLevel * state.owned[def.id]
  }
  sum += shelfBonuses(state).income
  sum += staffBonuses(state).income
  return (
    sum *
    (state.loungeIncomeMult || 1) *
    guestTraffic(state) *
    loungeService(state).incomeMult *
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
    loungeService(state).clickMult *
    empireClickMult(state)
  )
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (n < 1000) return n < 10 ? n.toFixed(n % 1 ? 1 : 0) : Math.floor(n).toString()
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(2)}M`
}
