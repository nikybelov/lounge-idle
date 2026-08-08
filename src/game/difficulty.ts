import { cheapestLoungeTier } from '../data/loungeTiers'
import {
  DIFFICULTIES,
  difficultyFromVenue,
  type DifficultyDef,
  type DifficultyId,
} from '../data/difficulty'
import { QUIT_INCOME_THRESHOLD } from '../data/tasks'
import type { GameState } from './state'

export function resolveDifficulty(state: GameState): DifficultyId {
  return state.difficulty ?? difficultyFromVenue(state.venueId)
}

export function getDifficulty(state: GameState): DifficultyDef {
  return DIFFICULTIES[resolveDifficulty(state)]
}

function scaled(_state: GameState, base: number, mult: number): number {
  return Math.max(1, Math.round(base * mult))
}

export function scaledUpgradeCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).upgradeCost)
}

export function scaledLoungeCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).loungeCost)
}

export function scaledBranchCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).branchCost)
}

export function scaledExpansionCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).expansionCost)
}

export function scaledStaffHireCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).staffCost)
}

export function scaledShiftShopCost(state: GameState, base: number): number {
  return scaled(state, base, getDifficulty(state).shiftShopCost)
}

export function shiftShopCostMult(state: GameState): number {
  return getDifficulty(state).shiftShopCost
}

export function minOpenLoungeCost(state: GameState): number {
  return scaledLoungeCost(state, cheapestLoungeTier().cost)
}

export function loungeTierCost(state: GameState, base: number): number {
  return scaledLoungeCost(state, base)
}

export function quitIncomeThreshold(state: GameState): number {
  const base = QUIT_INCOME_THRESHOLD * getDifficulty(state).quitIncome
  return Math.round(base * 10) / 10
}

export function loyalPocketsThreshold(state: GameState): number {
  return minOpenLoungeCost(state) + getDifficulty(state).loyalPocketsExtra
}

export function achievementRewardCash(state: GameState, base: number): number {
  return Math.round(base * getDifficulty(state).achievementReward)
}
