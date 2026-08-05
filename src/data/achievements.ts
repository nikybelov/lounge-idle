import { cheapestLoungeTier } from './loungeTiers'
import { SHOP_ITEMS, type ShopItemId } from './shop'
import type { GameState } from '../game/state'
import { loungeIncomePerSec } from '../game/economy'

export type AchievementId =
  | 'first_wash'
  | 'coals_hands'
  | 'full_shift'
  | 'made_master'
  | 'made_senior'
  | 'wash_marathon'
  | 'coal_stack'
  | 'order_runner'
  | 'bare_hands'
  | 'first_tool'
  | 'full_kit'
  | 'open_corner'
  | 'back_shift'
  | 'loyal_pockets'
  | 'own_boss'
  | 'first_guest'
  | 'steady_income'

export interface AchievementDef {
  id: AchievementId
  title: string
  hint: string
  reward: number
  check: (state: GameState) => boolean
}

function shopCount(state: GameState): number {
  return SHOP_ITEMS.filter((i) => state.shopOwned[i.id as ShopItemId]).length
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_wash',
    title: 'Первая мойка',
    hint: 'Помой кальян хотя бы раз',
    reward: 30,
    check: (s) => s.taskDone.wash >= 1,
  },
  {
    id: 'coals_hands',
    title: 'Доверили угли',
    hint: 'Открой задачу «Поменяй угли»',
    reward: 80,
    check: (s) => s.taskDone.wash >= 15,
  },
  {
    id: 'full_shift',
    title: 'Полная смена',
    hint: 'Открой все три задачи на смене',
    reward: 150,
    check: (s) => s.taskDone.coals >= 15,
  },
  {
    id: 'made_master',
    title: 'Кальянный мастер',
    hint: 'Получи повышение до кальянного мастера',
    reward: 400,
    check: (s) => s.jobRank === 'master' || s.jobRank === 'senior' || s.phase !== 'employed',
  },
  {
    id: 'made_senior',
    title: 'Старший мастер',
    hint: 'Стань старшим кальянным мастером',
    reward: 900,
    check: (s) => s.jobRank === 'senior' || s.phase !== 'employed',
  },
  {
    id: 'wash_marathon',
    title: 'Марафон мойки',
    hint: 'Помой кальян 70 раз',
    reward: 450,
    check: (s) => s.taskDone.wash >= 70,
  },
  {
    id: 'coal_stack',
    title: 'Угольный стаж',
    hint: 'Поменяй угли 50 раз',
    reward: 350,
    check: (s) => s.taskDone.coals >= 50,
  },
  {
    id: 'order_runner',
    title: 'Бегунок зала',
    hint: 'Отнеси заказ 40 раз',
    reward: 380,
    check: (s) => s.taskDone.order >= 40,
  },
  {
    id: 'bare_hands',
    title: 'Голыми руками',
    hint: 'Сделай 35 моек без шуруповёрта',
    reward: 500,
    check: (s) => s.taskDone.wash >= 35 && !s.shopOwned.drill_brush,
  },
  {
    id: 'first_tool',
    title: 'Свой инструмент',
    hint: 'Купи что-нибудь в магазине смены',
    reward: 100,
    check: (s) => shopCount(s) >= 1,
  },
  {
    id: 'full_kit',
    title: 'Полный комплект',
    hint: 'Купи все товары магазина смены',
    reward: 800,
    check: (s) => shopCount(s) >= SHOP_ITEMS.length,
  },
  {
    id: 'loyal_pockets',
    title: 'Копил дольше нужного',
    hint: `Набери ${cheapestLoungeTier().cost + 3000}+ на смене, ещё не открывая угол`,
    reward: 700,
    check: (s) =>
      s.phase === 'employed' && s.cash >= cheapestLoungeTier().cost + 3000,
  },
  {
    id: 'open_corner',
    title: 'Свой угол',
    hint: 'Открой собственный лаунж (достаточно накопить)',
    reward: 500,
    check: (s) => s.phase !== 'employed',
  },
  {
    id: 'back_shift',
    title: 'Старое место помнит',
    hint: 'После открытия угла снова выйди на смену',
    reward: 300,
    check: (s) => s.flags.returnedToJob,
  },
  {
    id: 'first_guest',
    title: 'Первый гость',
    hint: 'Прими заказ в своём зале',
    reward: 150,
    check: (s) => s.flags.loungeOrders >= 1,
  },
  {
    id: 'steady_income',
    title: 'Зал дышит сам',
    hint: 'Доведи свой доход до 8/сек',
    reward: 700,
    check: (s) => loungeIncomePerSec(s) >= 8,
  },
  {
    id: 'own_boss',
    title: 'Сам себе хозяин',
    hint: 'Уволься из «Дым у реки»',
    reward: 1500,
    check: (s) => s.phase === 'ownOnly',
  },
]

export function evaluateAchievements(state: GameState): AchievementDef[] {
  const unlocked: AchievementDef[] = []
  for (const def of ACHIEVEMENTS) {
    if (state.achievements[def.id]) continue
    if (!def.check(state)) continue
    state.achievements[def.id] = true
    state.cash += def.reward
    unlocked.push(def)
  }
  return unlocked
}

export function achievementProgress(state: GameState): { done: number; total: number } {
  const total = ACHIEVEMENTS.length
  const done = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length
  return { done, total }
}
