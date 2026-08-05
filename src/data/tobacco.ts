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
  cost: number
  /** Вклад вкуса в привлекательность меню */
  appeal: number
  /** Нужен уровень апгрейда «Меню вкусов» */
  needMenuLevel: number
}

export const TOBACCOS: TobaccoDef[] = [
  {
    id: 'dawn_apple',
    name: 'Рассветное яблоко',
    blurb: 'Базовый вкус — без него меню выглядит пустым',
    cost: 40,
    appeal: 1,
    needMenuLevel: 0,
  },
  {
    id: 'mint_fog',
    name: 'Мятный туман',
    blurb: 'Свежо, гости задерживаются',
    cost: 120,
    appeal: 1.2,
    needMenuLevel: 0,
  },
  {
    id: 'berry_night',
    name: 'Ягодная ночь',
    blurb: 'Сладкий акцент на вечер',
    cost: 280,
    appeal: 1.4,
    needMenuLevel: 1,
  },
  {
    id: 'citrus_lane',
    name: 'Цитрусовый ряд',
    blurb: 'Кислинка — чаще берут вторую миску',
    cost: 450,
    appeal: 1.5,
    needMenuLevel: 1,
  },
  {
    id: 'grape_dock',
    name: 'Виноградная пристань',
    blurb: 'Плотный вкус под диваны',
    cost: 700,
    appeal: 1.7,
    needMenuLevel: 2,
  },
  {
    id: 'peach_ember',
    name: 'Персиковый жар',
    blurb: 'Тёплый профиль под VIP',
    cost: 1100,
    appeal: 1.9,
    needMenuLevel: 2,
  },
  {
    id: 'pine_breeze',
    name: 'Хвойный бриз',
    blurb: 'Необычный — цепляет любопытных',
    cost: 1600,
    appeal: 2.1,
    needMenuLevel: 3,
  },
  {
    id: 'honey_dune',
    name: 'Медовая дюна',
    blurb: 'Мягкий премиум',
    cost: 2400,
    appeal: 2.3,
    needMenuLevel: 3,
  },
  {
    id: 'melon_shift',
    name: 'Дынная смена',
    blurb: 'Летний хит зала',
    cost: 3200,
    appeal: 2.5,
    needMenuLevel: 4,
  },
  {
    id: 'double_ice',
    name: 'Двойной лёд',
    blurb: 'Подпись заведения',
    cost: 4800,
    appeal: 3,
    needMenuLevel: 5,
  },
]

export function getTobacco(id: TobaccoId): TobaccoDef | undefined {
  return TOBACCOS.find((t) => t.id === id)
}
