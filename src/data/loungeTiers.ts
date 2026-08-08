import type { ShopItemId } from './shop'
import { SHOP_ITEMS } from './shop'
import type { UpgradeId } from './upgrades'

export type LoungeTierId = 'nook' | 'hall' | 'signature'

export interface LoungeTierDef {
  id: LoungeTierId
  name: string
  blurb: string
  cost: number
  /** Постоянный множитель пассивного дохода */
  incomeMult: number
  /** Постоянный множитель клика «Принять заказ» */
  clickMult: number
  /** Стартовые уровни апгрейдов зала */
  startOwned: Partial<Record<UpgradeId, number>>
  /** Инструменты смены, которые сразу «есть» */
  startShop: ShopItemId[]
  vibe: string
}

export const LOUNGE_TIERS: LoungeTierDef[] = [
  {
    id: 'nook',
    name: 'Уголок',
    blurb: 'Минимум для старта. Один стол — инструменты смены покупаешь сам.',
    cost: 10_500,
    incomeMult: 1,
    clickMult: 1,
    startOwned: { table: 1 },
    startShop: [],
    vibe: 'бюджет',
  },
  {
    id: 'hall',
    name: 'Малый зал',
    blurb: 'Диван на старте + шуруповёрт в комплекте. Остальное — на подработке.',
    cost: 17_500,
    incomeMult: 1.2,
    clickMult: 1.15,
    startOwned: { table: 2, sofa: 1 },
    startShop: ['drill_brush'],
    vibe: 'стандарт',
  },
  {
    id: 'signature',
    name: 'Авторский зал',
    blurb: 'Меню и вытяжка на старте + шуруповёрт и щипцы в комплекте.',
    cost: 23_000,
    incomeMult: 1.45,
    clickMult: 1.3,
    startOwned: { table: 3, sofa: 2, menu: 1, hood: 1 },
    startShop: ['drill_brush', 'tongs'],
    vibe: 'премиум',
  },
]

export function cheapestLoungeTier(): LoungeTierDef {
  return LOUNGE_TIERS.reduce((a, b) => (a.cost <= b.cost ? a : b))
}

export function getLoungeTier(id: LoungeTierId | null | undefined): LoungeTierDef {
  return LOUNGE_TIERS.find((t) => t.id === id) ?? LOUNGE_TIERS[0]
}

/** Что тариф даёт из инструментов смены (остальное — с нуля) */
export function tierShopBonusLabel(tier: LoungeTierDef): string {
  if (!tier.startShop.length) {
    return 'инструменты смены — с нуля'
  }
  const names = tier.startShop
    .map((id) => SHOP_ITEMS.find((i) => i.id === id)?.name ?? id)
    .join(', ')
  return `в комплекте: ${names}`
}
