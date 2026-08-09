import { BRANCHES, getBranch, type BranchDef, type BranchId } from '../data/branches'
import type { GameState } from './state'
import { scaledBranchCost } from './difficulty'

/** Условие «основная карьера пройдена» — свой зал и полная независимость от смены */
export function empireRequirementsMet(state: GameState): boolean {
  return state.phase === 'ownOnly'
}

export function canBrowseEmpire(state: GameState): boolean {
  return (
    state.phase !== 'employed' &&
    (state.flags.empireOfferUnlocked || empireRequirementsMet(state))
  )
}

export function syncEmpireUnlock(state: GameState): void {
  if (empireRequirementsMet(state)) {
    state.flags.empireOfferUnlocked = true
  }
}

export function branchCount(state: GameState): number {
  return BRANCHES.filter((b) => state.branches[b.id]).length
}

export function isBranchOwned(state: GameState, id: BranchId): boolean {
  return !!state.branches[id]
}

export function isBranchUnlocked(state: GameState, def: BranchDef): boolean {
  if (!canBrowseEmpire(state)) return false
  if (!def.needBranch) return true
  return isBranchOwned(state, def.needBranch)
}

export function nextBranch(state: GameState): BranchDef | undefined {
  return BRANCHES.find((b) => !state.branches[b.id] && isBranchUnlocked(state, b))
}

function synergyBonus(count: number): number {
  if (count < 2) return 0
  let bonus = (count - 1) * 0.03
  if (count >= 5) bonus += 0.1
  return bonus
}

export function empireIncomeMult(state: GameState): number {
  let mult = 1
  for (const b of BRANCHES) {
    if (!state.branches[b.id]) continue
    mult += b.incomeMult
  }
  mult += synergyBonus(branchCount(state))
  return mult
}

export function empireClickMult(state: GameState): number {
  let mult = 1
  for (const b of BRANCHES) {
    if (!state.branches[b.id]) continue
    mult += b.clickMult
  }
  mult += synergyBonus(branchCount(state)) * 0.6
  return mult
}

export function networkSynergyBonus(state: GameState): number {
  return synergyBonus(branchCount(state))
}

export function networkLabel(state: GameState): string {
  const n = branchCount(state)
  if (n === 0) return 'Только главный лаунж'
  if (n === 1) return '1 филиал'
  if (n < 5) return `Сеть · ${n} точки`
  return 'Полная сеть · 5 точек'
}

export function empireTeaser(state: GameState): string | null {
  if (canBrowseEmpire(state)) return null
  if (state.phase === 'employed') return null
  if (state.phase === 'dual') {
    return 'Уволься со смены — откроется вкладка «Сеть» и второе заведение.'
  }
  return null
}

export function openBranchCheck(
  state: GameState,
  id: BranchId,
): { ok: true } | { ok: false; message: string } {
  if (!canBrowseEmpire(state)) {
    return {
      ok: false,
      message: 'Сеть откроется после увольнения со смены',
    }
  }
  const def = getBranch(id)
  if (!def) return { ok: false, message: 'Нет такой точки' }
  if (state.branches[id]) {
    return { ok: false, message: 'Уже в сети' }
  }
  if (!isBranchUnlocked(state, def)) {
    const prev = def.needBranch ? getBranch(def.needBranch)?.name : ''
    return {
      ok: false,
      message: prev ? `Сначала открой «${prev}»` : 'Пока закрыто',
    }
  }
  if (state.cash < scaledBranchCost(state, def.cost)) {
    return {
      ok: false,
      message: `Не хватает · нужно ещё ${Math.ceil(scaledBranchCost(state, def.cost) - state.cash)}`,
    }
  }
  return { ok: true }
}
