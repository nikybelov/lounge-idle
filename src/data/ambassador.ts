import { TOBACCOS, type TobaccoDef, type TobaccoId } from './tobacco'
import type { GameState } from '../game/state'

/** Порог секции «Амбассадор» — после первых роликов/постов, не под конец игры */
export const AMBASSADOR_UNLOCK_FAME = 14
export const AMBASSADOR_UNLOCK_MEDIA = 12
/** fame + media×0.55 — если одна шкала отстаёт */
export const AMBASSADOR_UNLOCK_REP = 22

export function ambassadorReputationScore(fame: number, media: number): number {
  return Math.round(fame + media * 0.55)
}

export interface AmbassadorNeeds {
  fame: number
  media: number
  rep: number
}

/** Множитель бонусов вкуса на полке, если ты амбассадор этой линейки */
export const AMBASSADOR_SHELF_MULT = 1.55

export function isActiveAmbassador(state: GameState): boolean {
  for (const t of TOBACCOS) {
    if (state.personal.ambassadorOf[t.id]) return true
  }
  return false
}

export function ambassadorTierIndex(id: TobaccoId): number {
  const i = TOBACCOS.findIndex((t) => t.id === id)
  return i >= 0 ? i : 0
}

/** Порог для контракта: обе шкалы или сводный рейтинг (ранние бренды — сразу после unlock секции) */
export function ambassadorNeeds(id: TobaccoId): AmbassadorNeeds {
  const i = ambassadorTierIndex(id)
  return {
    fame: 10 + i * 2,
    media: 8 + i * 2,
    rep: 16 + i * 2,
  }
}

export function ambassadorContractCost(def: TobaccoDef): number {
  return Math.floor(def.cost * 5 + 150)
}

export function ambassadorShelfBonusLabel(): string {
  return `амбассадор ×${AMBASSADOR_SHELF_MULT.toFixed(2)} на полке`
}
