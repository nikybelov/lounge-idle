export type UpgradeId = 'table' | 'sofa' | 'menu' | 'hood' | 'vip'

export interface UpgradeDef {
  id: UpgradeId
  name: string
  blurb: string
  baseCost: number
  /** Пассивный доход за уровень */
  incomePerLevel: number
  /** Добавка к заказу (клику) за уровень */
  clickPerLevel: number
  /** Потолок прокачки (не безлимит) */
  maxLevel: number
  unlockAtOwned?: Partial<Record<UpgradeId, number>>
}

export const COST_GROWTH = 1.17

/**
 * Потолки: посадка конечная, но можно обогнать команду → штрафы сервиса.
 * Стол/диван/VIP дают места; стеллаж упирается в shelfCapacity 12; вытяжка — только комфорт/доход.
 */
export const UPGRADES: UpgradeDef[] = [
  {
    id: 'table',
    name: 'Стол у входа',
    blurb: 'Больше посадочных мест — выше поток гостей',
    baseCost: 15,
    incomePerLevel: 0.5,
    clickPerLevel: 0.5,
    maxLevel: 12,
  },
  {
    id: 'sofa',
    name: 'Диван в лаунже',
    blurb: 'Садятся дольше — платят чаще',
    baseCost: 100,
    incomePerLevel: 1.15,
    clickPerLevel: 1,
    maxLevel: 10,
    unlockAtOwned: { table: 3 },
  },
  {
    id: 'menu',
    name: 'Стеллаж для полки',
    blurb: 'Больше мест на табачной полке',
    baseCost: 500,
    incomePerLevel: 2.2,
    clickPerLevel: 8,
    maxLevel: 5,
    unlockAtOwned: { sofa: 2 },
  },
  {
    id: 'hood',
    name: 'Вытяжка',
    blurb: 'Комфортнее сидеть — гости не уходят рано',
    baseCost: 3000,
    incomePerLevel: 5.5,
    clickPerLevel: 3,
    maxLevel: 10,
    unlockAtOwned: { menu: 1 },
  },
  {
    id: 'vip',
    name: 'VIP-зона',
    blurb: 'Тише, дороже, свой свет',
    baseCost: 12000,
    incomePerLevel: 28,
    clickPerLevel: 10,
    maxLevel: 8,
    unlockAtOwned: { hood: 1 },
  },
]

/** Базовый пассив при непустой полке (столы без табака не кормят) */
export const BASE_LOUNGE_PASSIVE = 0.45

export const BASE_LOUNGE_CLICK = 2

export function getUpgrade(id: UpgradeId): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id)
}

export function upgradeMaxLevel(id: UpgradeId): number {
  return getUpgrade(id)?.maxLevel ?? 1
}
