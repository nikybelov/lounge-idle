/** Эффекты магазина своего зала — читают state.loungeShop */

import {
  LOUNGE_SHOP_LINES,
  getLoungeShopGrade,
  loungeShopLevel,
  type LoungeShopId,
} from '../data/loungeShop'
import type { TaskId } from '../data/tasks'
import type { GameState } from './state'

function gradesOf(state: GameState) {
  return LOUNGE_SHOP_LINES.map((line) => {
    const level = loungeShopLevel(state.loungeShop, line.id)
    return level > 0 ? getLoungeShopGrade(line, level) : undefined
  }).filter(Boolean)
}

function hasMasterHired(state: GameState): boolean {
  return (state.staffMembers.master?.length ?? 0) > 0
}

/** Множитель CD задач «Сам на смене» / подработки в зале */
export function loungeShopTaskCdMult(state: GameState, taskId: TaskId): number {
  if (state.phase === 'employed') return 1
  let mult = 1
  for (const g of gradesOf(state)) {
    const m = g!.taskCdMult?.[taskId]
    if (m != null && m > 0) mult *= m
  }
  return Math.max(0.55, mult)
}

export function loungeShopTipBonus(state: GameState): number {
  if (state.phase === 'employed') return 0
  let tip = 0
  for (const g of gradesOf(state)) tip += g!.tipBonus ?? 0
  return Math.min(0.12, tip)
}

export function loungeShopServicePower(state: GameState): number {
  if (state.phase === 'employed') return 0
  const hasMaster = hasMasterHired(state)
  let power = 0
  for (const g of gradesOf(state)) {
    const add = g!.servicePower ?? 0
    if (!add) continue
    if (g!.needMaster && !hasMaster) continue
    power += add
  }
  return power
}

export function loungeShopStaffGuestMult(state: GameState): number {
  if (state.phase === 'employed') return 1
  let bonus = 0
  for (const g of gradesOf(state)) bonus += g!.staffGuestBonus ?? 0
  return 1 + Math.min(0.2, bonus)
}

export function loungeShopFotRelief(state: GameState): number {
  if (state.phase === 'employed') return 0
  let relief = 0
  for (const g of gradesOf(state)) relief += g!.fotRelief ?? 0
  return Math.min(0.02, relief)
}

export function loungeShopWalkawayCut(state: GameState): number {
  if (state.phase === 'employed') return 0
  let cut = 0
  for (const g of gradesOf(state)) cut += g!.walkawayCut ?? 0
  return Math.min(0.08, cut)
}

/** 0–1: насколько сжать «дыру» сервиса к чеку (печка) */
export function loungeShopServicePenaltySoft(state: GameState): number {
  if (state.phase === 'employed') return 0
  let soft = 0
  for (const g of gradesOf(state)) soft += g!.servicePenaltySoft ?? 0
  return Math.min(0.2, soft)
}

export function emptyLoungeShop(): Partial<Record<LoungeShopId, number>> {
  return {}
}
