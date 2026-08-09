import type { DifficultyId } from './difficulty'
import type { LoungeTierId } from './loungeTiers'
import { TOBACCOS, type TobaccoId } from './tobacco'

/**
 * Сколько вкусов сразу на полке при открытии лаунжа.
 * Лёгкий + дорогой тариф → больше; сложный + уголок → 0 (надо купить самому).
 */
const STARTER_SHELF_COUNT: Record<
  DifficultyId,
  Record<LoungeTierId, number>
> = {
  easy: { nook: 2, hall: 3, signature: 4 },
  normal: { nook: 1, hall: 2, signature: 3 },
  hard: { nook: 0, hall: 1, signature: 2 },
}

/** Стартовые вкусы на полке (и на складе) — по сложности и тарифу */
export function starterShelfTobaccos(
  difficulty: DifficultyId,
  tierId: LoungeTierId,
): TobaccoId[] {
  const n = STARTER_SHELF_COUNT[difficulty]?.[tierId] ?? 0
  const count = Math.max(0, Math.min(n, TOBACCOS.length))
  return TOBACCOS.slice(0, count).map((t) => t.id)
}

export function starterShelfCount(
  difficulty: DifficultyId,
  tierId: LoungeTierId,
): number {
  return starterShelfTobaccos(difficulty, tierId).length
}
