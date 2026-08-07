/** Вымышленные линейки вкусов — не реальные SKU */

export type TobaccoId =
  | 'dawn_apple'
  | 'mint_fog'
  | 'berry_night'
  | 'citrus_lane'
  | 'grape_dock'
  | 'peach_ember'
  | 'pine_breeze'
  | 'honey_dune'
  | 'melon_shift'
  | 'double_ice'

export interface TobaccoDef {
  id: TobaccoId
  name: string
  blurb: string
  /** Цена заказа на склад */
  cost: number
  /** Добавка к спросу гостей, когда на полке */
  guestBonus: number
  /** Добавка к множителю чаевых (к клику), когда на полке */
  tipBonus: number
  /** Пассивный +/с за позицию на полке */
  incomeBonus: number
}

export const TOBACCOS: TobaccoDef[] = [
  {
    id: 'dawn_apple',
    name: 'Рассветное яблоко',
    blurb: 'Базовый вкус — с него начинают полку',
    cost: 35,
    guestBonus: 0.35,
    tipBonus: 0.02,
    incomeBonus: 0.02,
  },
  {
    id: 'mint_fog',
    name: 'Мятный туман',
    blurb: 'Освежает — гости задерживаются',
    cost: 90,
    guestBonus: 0.45,
    tipBonus: 0.03,
    incomeBonus: 0.04,
  },
  {
    id: 'berry_night',
    name: 'Ягодная ночь',
    blurb: 'Сладкий акцент на вечер',
    cost: 220,
    guestBonus: 0.55,
    tipBonus: 0.04,
    incomeBonus: 0.06,
  },
  {
    id: 'citrus_lane',
    name: 'Цитрусовый ряд',
    blurb: 'Кислинка — чаще берут вторую миску',
    cost: 380,
    guestBonus: 0.5,
    tipBonus: 0.08,
    incomeBonus: 0.05,
  },
  {
    id: 'grape_dock',
    name: 'Виноградная пристань',
    blurb: 'Плотный вкус под диваны',
    cost: 650,
    guestBonus: 0.7,
    tipBonus: 0.05,
    incomeBonus: 0.1,
  },
  {
    id: 'peach_ember',
    name: 'Персиковый жар',
    blurb: 'Тёплый профиль — выше чек',
    cost: 950,
    guestBonus: 0.6,
    tipBonus: 0.12,
    incomeBonus: 0.08,
  },
  {
    id: 'pine_breeze',
    name: 'Хвойный бриз',
    blurb: 'Необычный — цепляет любопытных',
    cost: 1400,
    guestBonus: 0.85,
    tipBonus: 0.06,
    incomeBonus: 0.12,
  },
  {
    id: 'honey_dune',
    name: 'Медовая дюна',
    blurb: 'Мягкий премиум для постоянных',
    cost: 2100,
    guestBonus: 0.75,
    tipBonus: 0.1,
    incomeBonus: 0.15,
  },
  {
    id: 'melon_shift',
    name: 'Дынная смена',
    blurb: 'Летний хит — тянет толпу',
    cost: 3200,
    guestBonus: 1.1,
    tipBonus: 0.07,
    incomeBonus: 0.18,
  },
  {
    id: 'double_ice',
    name: 'Двойной лёд',
    blurb: 'Подпись заведения — жирные чаевые',
    cost: 4800,
    guestBonus: 0.9,
    tipBonus: 0.18,
    incomeBonus: 0.22,
  },
]

export function getTobacco(id: TobaccoId): TobaccoDef | undefined {
  return TOBACCOS.find((t) => t.id === id)
}

export function tobaccoBonusLabel(t: TobaccoDef): string {
  const parts: string[] = []
  if (t.guestBonus > 0) parts.push(`+${t.guestBonus.toFixed(2)} гостей`)
  if (t.tipBonus > 0) parts.push(`+${Math.round(t.tipBonus * 100)}% чаевые`)
  if (t.incomeBonus > 0) parts.push(`+${t.incomeBonus}/с`)
  return parts.join(' · ')
}
