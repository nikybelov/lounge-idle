export type ExpansionId =
  | 'second_hall'
  | 'terrace'
  | 'vip_suite'
  | 'bar_wing'
  | 'hookah_lab'

export interface ExpansionDef {
  id: ExpansionId
  name: string
  blurb: string
  cost: number
  /** Сколько посадочных мест добавляет */
  seats: number
  /** Плоский бонус к пассивному доходу (/сек) */
  incomeBonus: number
  /** Добавка к спросу гостей (меню/атмосфера зоны) */
  demandBonus: number
  /** Нужно столов суммарно (table+sofa уровни) */
  needFurniture: number
}

export const EXPANSIONS: ExpansionDef[] = [
  {
    id: 'second_hall',
    name: 'Второй зал',
    blurb: 'Ещё одна комната — больше посадки',
    cost: 4550,
    seats: 8,
    incomeBonus: 3,
    demandBonus: 0.15,
    needFurniture: 4,
  },
  {
    id: 'terrace',
    name: 'Летняя терраса',
    blurb: 'Свежий воздух, сезонная посадка',
    cost: 9100,
    seats: 10,
    incomeBonus: 6,
    demandBonus: 0.25,
    needFurniture: 7,
  },
  {
    id: 'vip_suite',
    name: 'VIP-комнаты',
    blurb: 'Закрытые кабины — дорогие гости',
    cost: 18_200,
    seats: 6,
    incomeBonus: 14,
    demandBonus: 0.4,
    needFurniture: 10,
  },
  {
    id: 'bar_wing',
    name: 'Барное крыло',
    blurb: 'Стойка и места у бара',
    cost: 13_000,
    seats: 7,
    incomeBonus: 9,
    demandBonus: 0.2,
    needFurniture: 8,
  },
  {
    id: 'hookah_lab',
    name: 'Лаунж-лаборатория',
    blurb: 'Открытая кухня мисок — вау-эффект',
    cost: 28_600,
    seats: 5,
    incomeBonus: 18,
    demandBonus: 0.55,
    needFurniture: 14,
  },
]

export function getExpansion(id: ExpansionId): ExpansionDef | undefined {
  return EXPANSIONS.find((e) => e.id === id)
}
