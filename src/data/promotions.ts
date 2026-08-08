/** Маркетинговые акции — грейды 1–4 + запуск на время */

export type PromotionId = 'happy_hour' | 'second_hookah' | 'tasting'

export interface PromotionGradeDef {
  grade: number
  title: string
  /** Разблокировка или повышение до этого грейда */
  upgradeCost: number
  /** Стоимость одного запуска */
  launchCost: number
  /** Постоянный бонус к потоку гостей */
  passiveGuest: number
  /** Доп. бонус, пока акция активна */
  guestBoost: number
  durationMs: number
  cooldownMs: number
}

export interface PromotionDef {
  id: PromotionId
  name: string
  blurb: string
  needFurniture: number
  grades: PromotionGradeDef[]
}

export const PROMOTIONS: PromotionDef[] = [
  {
    id: 'happy_hour',
    name: 'Счастливый час',
    blurb: 'Скидка в «тихие» часы — зал заполняется быстрее',
    needFurniture: 1,
    grades: [
      {
        grade: 1,
        title: 'Листовка у входа',
        upgradeCost: 280,
        launchCost: 120,
        passiveGuest: 0.02,
        guestBoost: 0.1,
        durationMs: 90_000,
        cooldownMs: 180_000,
      },
      {
        grade: 2,
        title: 'Stories в соцсетях',
        upgradeCost: 1200,
        launchCost: 220,
        passiveGuest: 0.04,
        guestBoost: 0.16,
        durationMs: 120_000,
        cooldownMs: 150_000,
      },
      {
        grade: 3,
        title: 'Партнёрский пост',
        upgradeCost: 4800,
        launchCost: 380,
        passiveGuest: 0.07,
        guestBoost: 0.24,
        durationMs: 150_000,
        cooldownMs: 120_000,
      },
      {
        grade: 4,
        title: 'Городской афишный день',
        upgradeCost: 16_000,
        launchCost: 650,
        passiveGuest: 0.1,
        guestBoost: 0.34,
        durationMs: 180_000,
        cooldownMs: 90_000,
      },
    ],
  },
  {
    id: 'second_hookah',
    name: 'Второй кальян',
    blurb: 'Комбо-предложение — приводит компании',
    needFurniture: 3,
    grades: [
      {
        grade: 1,
        title: 'Наклейка на стекле',
        upgradeCost: 650,
        launchCost: 180,
        passiveGuest: 0.015,
        guestBoost: 0.12,
        durationMs: 90_000,
        cooldownMs: 200_000,
      },
      {
        grade: 2,
        title: 'Баннер в зале',
        upgradeCost: 2400,
        launchCost: 320,
        passiveGuest: 0.035,
        guestBoost: 0.18,
        durationMs: 120_000,
        cooldownMs: 170_000,
      },
      {
        grade: 3,
        title: 'Реклама у соседей',
        upgradeCost: 8200,
        launchCost: 520,
        passiveGuest: 0.06,
        guestBoost: 0.26,
        durationMs: 150_000,
        cooldownMs: 140_000,
      },
      {
        grade: 4,
        title: 'Франшиза комбо',
        upgradeCost: 28_000,
        launchCost: 880,
        passiveGuest: 0.09,
        guestBoost: 0.36,
        durationMs: 180_000,
        cooldownMs: 110_000,
      },
    ],
  },
  {
    id: 'tasting',
    name: 'Ночь дегустаций',
    blurb: 'Дегустация вкусов — гурманы и сарафан',
    needFurniture: 5,
    grades: [
      {
        grade: 1,
        title: 'Мини-дегуст на полке',
        upgradeCost: 1400,
        launchCost: 260,
        passiveGuest: 0.02,
        guestBoost: 0.14,
        durationMs: 100_000,
        cooldownMs: 220_000,
      },
      {
        grade: 2,
        title: 'Приглашённые гости',
        upgradeCost: 5200,
        launchCost: 420,
        passiveGuest: 0.045,
        guestBoost: 0.2,
        durationMs: 130_000,
        cooldownMs: 180_000,
      },
      {
        grade: 3,
        title: 'Блогер на дегуст',
        upgradeCost: 15_000,
        launchCost: 680,
        passiveGuest: 0.075,
        guestBoost: 0.28,
        durationMs: 160_000,
        cooldownMs: 150_000,
      },
      {
        grade: 4,
        title: 'Фестиваль вкусов',
        upgradeCost: 42_000,
        launchCost: 1100,
        passiveGuest: 0.11,
        guestBoost: 0.4,
        durationMs: 200_000,
        cooldownMs: 120_000,
      },
    ],
  },
]

export function getPromotionDef(id: PromotionId): PromotionDef | undefined {
  return PROMOTIONS.find((p) => p.id === id)
}

export function getPromotionGradeDef(
  id: PromotionId,
  grade: number,
): PromotionGradeDef | undefined {
  return getPromotionDef(id)?.grades.find((g) => g.grade === grade)
}
