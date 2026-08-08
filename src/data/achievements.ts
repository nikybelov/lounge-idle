import { branchCount } from '../game/empire'
import { hiredStaffCount, staffRolesFilled } from '../game/staff'
import { STAFF_ROLES } from './staff'
import { SHOP_ITEMS, shopItemsMaxedCount, shopItemsOwnedCount, BARE_HANDS_WASH_NEED } from './shop'
import type { DifficultyId } from './difficulty'
import type { GameState } from '../game/state'
import { loungeIncomePerSec } from '../game/economy'
import { ambassadorCount } from '../game/ambassador'
import { achievementRewardCash } from '../game/difficulty'

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
  | 'shift_loyal'
  | 'back_shift'
  | 'loyal_pockets'
  | 'own_boss'
  | 'first_guest'
  | 'steady_income'
  | 'signature_hall'
  | 'empire_ready'
  | 'second_door'
  | 'three_spots'
  | 'full_network'
  | 'empire_boss'
  | 'first_hire'
  | 'full_team'
  | 'payroll_master'
  | 'brand_ambassador'
  | 'path_easy'
  | 'path_normal'
  | 'path_hard'
  | 'easy_quit'
  | 'easy_branch'
  | 'normal_dual'
  | 'normal_income'
  | 'hard_quit'
  | 'hard_patience'
  | 'hard_bare'
  | 'iron_empire'

export interface AchievementDef {
  id: AchievementId
  title: string
  hint: string
  reward: number
  /** Только на выбранной сложности */
  difficulty?: DifficultyId
  check: (state: GameState) => boolean
}

function shopCount(state: GameState): number {
  return shopItemsOwnedCount(state.shopOwned)
}

/** Награды: ранние ~15% от ближайшей покупки, поздние ~8–10% от стоимости вехи */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_wash',
    title: 'Первая мойка',
    hint: 'Помой кальян хотя бы раз',
    reward: 40,
    check: (s) => s.taskDone.wash >= 1,
  },
  {
    id: 'coals_hands',
    title: 'Доверили угли',
    hint: 'Сделай «Помой кальян» 15 раз',
    reward: 100,
    check: (s) => s.taskDone.wash >= 15,
  },
  {
    id: 'full_shift',
    title: 'Полная смена',
    hint: 'Сделай «Поменяй угли» 15 раз',
    reward: 180,
    check: (s) => s.taskDone.coals >= 15,
  },
  {
    id: 'made_master',
    title: 'Кальянный мастер',
    hint: 'Получи повышение до кальянного мастера',
    reward: 650,
    check: (s) => s.jobRank === 'master' || s.jobRank === 'senior' || s.phase !== 'employed',
  },
  {
    id: 'made_senior',
    title: 'Старший мастер',
    hint: 'Стань старшим кальянным мастером',
    reward: 1800,
    check: (s) => s.jobRank === 'senior' || s.phase !== 'employed',
  },
  {
    id: 'wash_marathon',
    title: 'Марафон мойки',
    hint: 'Помой кальян 70 раз',
    reward: 550,
    check: (s) => s.taskDone.wash >= 70,
  },
  {
    id: 'coal_stack',
    title: 'Угольный стаж',
    hint: 'Поменяй угли 50 раз',
    reward: 450,
    check: (s) => s.taskDone.coals >= 50,
  },
  {
    id: 'order_runner',
    title: 'Бегунок зала',
    hint: 'Отнеси заказ 40 раз',
    reward: 480,
    check: (s) => s.taskDone.order >= 40,
  },
  {
    id: 'bare_hands',
    title: 'Голыми руками',
    hint: `Сделай «Помой кальян» ${BARE_HANDS_WASH_NEED} раз до покупки шуруповёрта`,
    reward: 900,
    check: (s) => s.flags.bareHandsEarned,
  },
  {
    id: 'first_tool',
    title: 'Свой инструмент',
    hint: 'Купи что-нибудь в магазине смены',
    reward: 200,
    check: (s) => shopCount(s) >= 1,
  },
  {
    id: 'full_kit',
    title: 'Полный комплект',
    hint: 'Прокачай все инструменты смены до максимума',
    reward: 1100,
    check: (s) => shopItemsMaxedCount(s.shopOwned) >= SHOP_ITEMS.length,
  },
  {
    id: 'loyal_pockets',
    title: 'Копил дольше нужного',
    hint: 'Накопи на смене лишнее до открытия своего зала',
    reward: 1200,
    check: (s) => s.flags.loyalPockets,
  },
  {
    id: 'open_corner',
    title: 'Свой угол',
    hint: 'Открой собственный лаунж (достаточно накопить)',
    reward: 1800,
    check: (s) => s.phase !== 'employed',
  },
  {
    id: 'shift_loyal',
    title: 'Трудяга',
    hint: 'Открой свой зал и не увольняйся с первой смены',
    reward: 1500,
    check: (s) => s.flags.hadDualPhase || s.phase === 'dual',
  },
  {
    id: 'back_shift',
    title: 'Старое место помнит',
    hint: 'После открытия угла снова выйди на смену',
    reward: 400,
    check: (s) => s.flags.returnedToJob,
  },
  {
    id: 'first_guest',
    title: 'Первый гость',
    hint: 'Прими заказ в своём зале',
    reward: 250,
    check: (s) => s.flags.loungeOrders >= 1,
  },
  {
    id: 'steady_income',
    title: 'Зал дышит сам',
    hint: 'Доведи свой доход до 8/сек',
    reward: 3000,
    check: (s) => loungeIncomePerSec(s) >= 8,
  },
  {
    id: 'own_boss',
    title: 'Сам себе хозяин',
    hint: 'Уволься со смены — только свой зал (необязательный путь)',
    reward: 6000,
    check: (s) => s.phase === 'ownOnly',
  },
  {
    id: 'signature_hall',
    title: 'Авторский зал',
    hint: 'Открой лаунж тарифа «Авторский зал»',
    reward: 4000,
    check: (s) => s.phase !== 'employed' && s.loungeTier === 'signature',
  },
  {
    id: 'empire_ready',
    title: 'Пора в сеть',
    hint: 'Уволись со смены — откроется вкладка «Сеть»',
    reward: 10_000,
    check: (s) => s.flags.empireOfferUnlocked,
  },
  {
    id: 'second_door',
    title: 'Второй вход',
    hint: 'Открой первый филиал сети',
    reward: 10_000,
    check: (s) => branchCount(s) >= 1,
  },
  {
    id: 'three_spots',
    title: 'Три точки на карте',
    hint: 'Открой три заведения в сети',
    reward: 45_000,
    check: (s) => branchCount(s) >= 3,
  },
  {
    id: 'full_network',
    title: 'Империя дыма',
    hint: 'Открой все пять точек сети',
    reward: 200_000,
    check: (s) => branchCount(s) >= 5,
  },
  {
    id: 'empire_boss',
    title: 'Босс сети',
    hint: 'Три+ филиала и доход 40/сек',
    reward: 40_000,
    check: (s) => branchCount(s) >= 3 && loungeIncomePerSec(s) >= 40,
  },
  {
    id: 'first_hire',
    title: 'Не один',
    hint: 'Наняй первого сотрудника в своём зале',
    reward: 800,
    check: (s) => hiredStaffCount(s) >= 1,
  },
  {
    id: 'full_team',
    title: 'Полная смена',
    hint: 'Наняты все роли команды (хотя бы по одному)',
    reward: 5500,
    check: (s) => staffRolesFilled(s) >= STAFF_ROLES.length,
  },
  {
    id: 'payroll_master',
    title: 'ФОТ под контролем',
    hint: 'Команда из 3+ человек и чистый доход ≥8/с',
    reward: 7000,
    check: (s) =>
      hiredStaffCount(s) >= 3 && loungeIncomePerSec(s) >= 8,
  },
  {
    id: 'brand_ambassador',
    title: 'Амбассадор',
    hint: 'Стань амбассадором бренда',
    reward: 2500,
    check: (s) => ambassadorCount(s) >= 1,
  },
  {
    id: 'path_easy',
    title: 'Неоновый старт',
    hint: 'На лёгком: открой свой зал',
    reward: 2000,
    difficulty: 'easy',
    check: (s) => s.phase !== 'employed' && s.difficulty === 'easy',
  },
  {
    id: 'easy_quit',
    title: 'Золотой уход',
    hint: 'На лёгком: уволься со смены — только свой лаунж',
    reward: 2500,
    difficulty: 'easy',
    check: (s) => s.difficulty === 'easy' && s.phase === 'ownOnly',
  },
  {
    id: 'easy_branch',
    title: 'Неоновая сеть',
    hint: 'На лёгком: открой первый филиал',
    reward: 3000,
    difficulty: 'easy',
    check: (s) => s.difficulty === 'easy' && branchCount(s) >= 1,
  },
  {
    id: 'path_normal',
    title: 'Дым у реки',
    hint: 'На среднем: открой свой зал',
    reward: 2000,
    difficulty: 'normal',
    check: (s) => s.phase !== 'employed' && s.difficulty === 'normal',
  },
  {
    id: 'normal_dual',
    title: 'Две жизни',
    hint: 'На среднем: открой зал и не увольняйся с первой смены',
    reward: 2200,
    difficulty: 'normal',
    check: (s) =>
      s.difficulty === 'normal' && (s.flags.hadDualPhase || s.phase === 'dual'),
  },
  {
    id: 'normal_income',
    title: 'Река денег',
    hint: 'На среднем: свой доход ≥12/с',
    reward: 3500,
    difficulty: 'normal',
    check: (s) =>
      s.difficulty === 'normal' &&
      s.phase !== 'employed' &&
      loungeIncomePerSec(s) >= 12,
  },
  {
    id: 'path_hard',
    title: 'Подвал и упрямство',
    hint: 'На сложном: открой свой зал',
    reward: 3500,
    difficulty: 'hard',
    check: (s) => s.phase !== 'employed' && s.difficulty === 'hard',
  },
  {
    id: 'hard_patience',
    title: 'Железная копилка',
    hint: 'На сложном: накопи лишнее на смене до открытия зала',
    reward: 4000,
    difficulty: 'hard',
    check: (s) => s.difficulty === 'hard' && s.flags.loyalPockets,
  },
  {
    id: 'hard_bare',
    title: 'Подвал без щётки',
    hint: `На сложном: ${BARE_HANDS_WASH_NEED} моек без шуруповёрта`,
    reward: 5000,
    difficulty: 'hard',
    check: (s) => s.difficulty === 'hard' && s.flags.bareHandsEarned,
  },
  {
    id: 'hard_quit',
    title: 'Подвал позади',
    hint: 'На сложном: уволься со смены — только свой лаунж',
    reward: 4500,
    difficulty: 'hard',
    check: (s) => s.difficulty === 'hard' && s.phase === 'ownOnly',
  },
  {
    id: 'iron_empire',
    title: 'Железная империя',
    hint: 'На сложном: открой три+ филиала сети',
    reward: 8000,
    difficulty: 'hard',
    check: (s) => s.difficulty === 'hard' && branchCount(s) >= 3,
  },
]

export function isAchievementUnlocked(
  state: GameState,
  id: AchievementId,
): boolean {
  return state.achievements[id] === true
}

/** Разблокировать один раз — повторно не вызывать награду и баннер */
export function markAchievementUnlocked(
  state: GameState,
  id: AchievementId,
): boolean {
  if (isAchievementUnlocked(state, id)) return false
  state.achievements[id] = true
  return true
}

export function evaluateAchievements(state: GameState): AchievementDef[] {
  const unlocked: AchievementDef[] = []
  for (const def of ACHIEVEMENTS) {
    if (isAchievementUnlocked(state, def.id)) continue
    if (def.difficulty && state.difficulty && state.difficulty !== def.difficulty) {
      continue
    }
    if (!def.check(state)) continue
    if (!markAchievementUnlocked(state, def.id)) continue
    state.cash += achievementRewardCash(state, def.reward)
    unlocked.push(def)
  }
  return unlocked
}

export function achievementProgress(state: GameState): { done: number; total: number } {
  const total = ACHIEVEMENTS.length
  const done = ACHIEVEMENTS.filter((a) => isAchievementUnlocked(state, a.id)).length
  return { done, total }
}

export function achievementDifficultyOnly(def: AchievementDef, state: GameState): boolean {
  return !!def.difficulty && state.difficulty !== def.difficulty && !isAchievementUnlocked(state, def.id)
}
