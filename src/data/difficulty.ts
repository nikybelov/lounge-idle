import type { VenueId } from './venues'
import { normalizeVenueId } from './venues'

export type DifficultyId = 'easy' | 'normal' | 'hard'

export interface DifficultyDef {
  id: DifficultyId
  label: string
  bootLabel: string
  /** Множитель стоимости улучшений зала */
  upgradeCost: number
  /** Тарифы открытия лаунжа */
  loungeCost: number
  /** Филиалы сети */
  branchCost: number
  /** Зоны расширения */
  expansionCost: number
  /** Найм и повышение команды */
  staffCost: number
  /** Инструменты на смене (магазин смены) */
  shiftShopCost: number
  /** Порог дохода для увольнения (× базового) */
  quitIncome: number
  /** Бонус к награде за трофей */
  achievementReward: number
  /** Сверх минимума на «копил дольше, чем нужно» */
  loyalPocketsExtra: number
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  easy: {
    id: 'easy',
    label: 'Лёгкий',
    bootLabel: 'лёгкий',
    upgradeCost: 0.88,
    loungeCost: 0.92,
    branchCost: 0.86,
    expansionCost: 0.92,
    staffCost: 0.9,
    shiftShopCost: 0.88,
    quitIncome: 0.9,
    achievementReward: 1.05,
    loyalPocketsExtra: 2500,
  },
  normal: {
    id: 'normal',
    label: 'Средний',
    bootLabel: 'средний',
    upgradeCost: 1,
    loungeCost: 1,
    branchCost: 1,
    expansionCost: 1,
    staffCost: 1,
    shiftShopCost: 1,
    quitIncome: 1,
    achievementReward: 1,
    loyalPocketsExtra: 3000,
  },
  hard: {
    id: 'hard',
    label: 'Сложный',
    bootLabel: 'сложный',
    upgradeCost: 1.15,
    loungeCost: 1.08,
    branchCost: 1.16,
    expansionCost: 1.06,
    staffCost: 1.1,
    shiftShopCost: 1.12,
    quitIncome: 1.12,
    achievementReward: 1.15,
    loyalPocketsExtra: 3500,
  },
}

const VENUE_DIFFICULTY: Record<VenueId, DifficultyId> = {
  neon_haze: 'easy',
  smoke_river: 'normal',
  basement: 'hard',
}

export function difficultyFromVenue(venueId: VenueId | null | undefined): DifficultyId {
  const id = normalizeVenueId(venueId)
  return VENUE_DIFFICULTY[id]
}

export function getDifficultyDef(id: DifficultyId): DifficultyDef {
  return DIFFICULTIES[id]
}
