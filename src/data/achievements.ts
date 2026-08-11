import { branchCount } from '../game/empire'
import { hiredStaffCount } from '../game/staff'
import { SHOP_ITEMS, shopItemsMaxedCount, shopItemsOwnedCount, BARE_HANDS_WASH_NEED } from './shop'
import type { GameState } from '../game/state'
import { loungeIncomePerSec, staffPayrollShare } from '../game/economy'
import { ambassadorCount } from '../game/ambassador'
import { achievementRewardCash, quitIncomeThreshold } from '../game/difficulty'
import { shelfCapacity, shelfActiveCount } from '../game/appeal'
import { isGuideMastersWinner } from './personal'
import { PROMOTIONS } from './promotions'

export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'secret' | 'platinum'

export type AchievementId =
  | 'first_wash'
  | 'first_tool'
  | 'open_lounge'
  | 'first_guest'
  | 'coals_trusted'
  | 'back_shift'
  | 'shelf_curated'
  | 'wild_hire'
  | 'tobacco_buyer'
  | 'bare_hands'
  | 'loyal_pockets'
  | 'shift_loyal'
  | 'shelf_full'
  | 'promo_trio'
  | 'full_kit'
  | 'media_voice'
  | 'brand_ambassador'
  | 'signature_hall'
  | 'own_boss'
  | 'payroll_master'
  | 'first_wing'
  | 'full_network'
  | 'secret_laureate'
  | 'secret_solo'
  | 'platinum_set'

export interface AchievementDef {
  id: AchievementId
  title: string
  hint: string
  /** Загадка, пока секрет закрыт */
  secretHint?: string
  reward: number
  tier: TrophyTier
  /** Очки карьеры за трофей */
  careerPoints: number
  check: (state: GameState) => boolean
}

function shopCount(state: GameState): number {
  return shopItemsOwnedCount(state.shopOwned)
}

function promoLaunchCount(state: GameState): number {
  const launched = state.flags.promoLaunched ?? {}
  return PROMOTIONS.filter((p) => launched[p.id]).length
}

function allPromosLaunched(state: GameState): boolean {
  const launched = state.flags.promoLaunched ?? {}
  return PROMOTIONS.every((p) => launched[p.id])
}

/** Порядок важен: платина последней */
export const ACHIEVEMENTS: AchievementDef[] = [
  // —— Бронза ——
  {
    id: 'first_wash',
    title: 'Первая мойка',
    hint: 'Помой кальян хотя бы раз',
    reward: 40,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.taskDone.wash >= 1,
  },
  {
    id: 'first_tool',
    title: 'Свой инструмент',
    hint: 'Купи что-нибудь в магазине смены',
    reward: 200,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => shopCount(s) >= 1,
  },
  {
    id: 'open_lounge',
    title: 'Свой лаунж',
    hint: 'Открой собственный лаунж',
    reward: 1800,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.phase !== 'employed',
  },
  {
    id: 'first_guest',
    title: 'Первый гость',
    hint: 'Прими заказ в своём лаунже',
    reward: 250,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.flags.loungeOrders >= 1,
  },
  {
    id: 'coals_trusted',
    title: 'Доверили угли',
    hint: 'Поменяй угли 10 раз',
    reward: 120,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.taskDone.coals >= 10,
  },
  {
    id: 'back_shift',
    title: 'Старое место помнит',
    hint: 'После открытия лаунжа снова выйди на смену и сделай ещё 3 задачи',
    reward: 450,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.flags.returnedToJob && (s.flags.tasksAfterLounge ?? 0) >= 3,
  },
  {
    id: 'shelf_curated',
    title: 'Витрина',
    hint: 'Выставь на полку хотя бы 3 вкуса',
    reward: 350,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => shelfActiveCount(s) >= 3,
  },
  {
    id: 'wild_hire',
    title: 'Не с хостес',
    hint: 'Первым найми не хостес — официанта, кальянщика, бармена или управляющего',
    reward: 400,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => {
      const role = s.flags.firstHireRole
      return !!role && role !== 'host'
    },
  },
  {
    id: 'tobacco_buyer',
    title: 'Свой заказ на склад',
    hint: 'Купи вкус табака сам (не только стартовый комплект)',
    reward: 280,
    tier: 'bronze',
    careerPoints: 8,
    check: (s) => s.flags.tobaccoBought === true,
  },

  // —— Серебро ——
  {
    id: 'bare_hands',
    title: 'Голыми руками',
    hint: `Сделай «Помой кальян» ${BARE_HANDS_WASH_NEED} раз до покупки шуруповёрта`,
    reward: 900,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => s.flags.bareHandsEarned,
  },
  {
    id: 'loyal_pockets',
    title: 'Копил дольше',
    hint: 'Накопи на смене лишнее до открытия своего лаунжа',
    reward: 1200,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => s.flags.loyalPockets,
  },
  {
    id: 'shift_loyal',
    title: 'Трудяга',
    hint: 'Открой лаунж и не увольняйся с первой смены — поработай в режиме «смена + свой лаунж»',
    reward: 1500,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => s.flags.hadDualPhase || s.phase === 'dual',
  },
  {
    id: 'shelf_full',
    title: 'Полка под завязку',
    hint: 'Заполни полку целиком (нужна вместимость от 4 слотов)',
    reward: 2200,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => {
      const cap = shelfCapacity(s)
      return cap >= 4 && shelfActiveCount(s) >= cap
    },
  },
  {
    id: 'promo_trio',
    title: 'Афиша на всё',
    hint: 'Запусти все три типа акций хотя бы по разу',
    reward: 2800,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => allPromosLaunched(s),
  },
  {
    id: 'full_kit',
    title: 'Полный комплект',
    hint: 'Прокачай все инструменты смены до максимума',
    reward: 3200,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => shopItemsMaxedCount(s.shopOwned) >= SHOP_ITEMS.length,
  },
  {
    id: 'media_voice',
    title: 'Голос в ленте',
    hint: 'Сделай пост в Telegram или сними видео для канала',
    reward: 1800,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => s.personal.telegramPosts >= 1 || s.personal.videosPosted >= 1,
  },
  {
    id: 'brand_ambassador',
    title: 'Амбассадор',
    hint: 'Стань амбассадором бренда',
    reward: 2500,
    tier: 'silver',
    careerPoints: 20,
    check: (s) => ambassadorCount(s) >= 1,
  },

  // —— Золото ——
  {
    id: 'signature_hall',
    title: 'Дымный мир',
    hint: 'Открой лаунж «Дымный мир»',
    reward: 8000,
    tier: 'gold',
    careerPoints: 50,
    check: (s) => s.phase !== 'employed' && s.loungeTier === 'signature',
  },
  {
    id: 'own_boss',
    title: 'Сам себе хозяин',
    hint: 'Уволься со смены — только свой лаунж',
    reward: 12_000,
    tier: 'gold',
    careerPoints: 50,
    check: (s) => s.phase === 'ownOnly',
  },
  {
    id: 'payroll_master',
    title: 'ФОТ под контролем',
    hint: 'Команда из 4+ человек, чистые ≥ порога увольнения, ФОТ не выше 40%',
    reward: 15_000,
    tier: 'gold',
    careerPoints: 50,
    check: (s) =>
      hiredStaffCount(s) >= 4 &&
      loungeIncomePerSec(s) >= quitIncomeThreshold(s) &&
      staffPayrollShare(s) <= 0.4,
  },
  {
    id: 'first_wing',
    title: 'Пристройка',
    hint: 'Купи первое расширение лаунжа',
    reward: 10_000,
    tier: 'gold',
    careerPoints: 50,
    check: (s) => Object.values(s.expansions).some(Boolean),
  },
  {
    id: 'full_network',
    title: 'Империя дыма',
    hint: 'Открой все пять точек сети',
    reward: 80_000,
    tier: 'gold',
    careerPoints: 50,
    check: (s) => branchCount(s) >= 5,
  },

  // —— Секреты ——
  {
    id: 'secret_laureate',
    title: 'Лауреат Гайд Мастерс',
    hint: 'Выиграй премию «Гайд Мастерс»',
    secretHint: 'Золотая рамка ждёт в «Личном»…',
    reward: 12_000,
    tier: 'secret',
    careerPoints: 50,
    check: (s) => isGuideMastersWinner(s),
  },
  {
    id: 'secret_solo',
    title: 'Зал не тянет',
    hint: 'Слови жалобы гостей: столов больше, чем команда тянет',
    secretHint: 'Жадность к столам иногда громче голоса команды…',
    reward: 8_000,
    tier: 'secret',
    careerPoints: 40,
    check: (s) => s.flags.everServiceStrain,
  },


  // —— Платина (всегда последней) ——
  {
    id: 'platinum_set',
    title: 'Платиновый набор',
    hint: 'Собери все трофеи и секреты',
    reward: 200_000,
    tier: 'platinum',
    careerPoints: 150,
    check: (s) =>
      ACHIEVEMENTS.filter((a) => a.tier !== 'platinum').every((a) =>
        isAchievementUnlocked(s, a.id),
      ),
  },
]

export const TROPHY_TIERS: TrophyTier[] = [
  'bronze',
  'silver',
  'gold',
  'secret',
  'platinum',
]

export const TROPHY_TIER_LABEL: Record<TrophyTier, string> = {
  bronze: 'Бронза',
  silver: 'Серебро',
  gold: 'Золото',
  secret: 'Секреты',
  platinum: 'Платина',
}

export function achievementsByTier(tier: TrophyTier): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.tier === tier)
}

export function isAchievementUnlocked(
  state: GameState,
  id: AchievementId,
): boolean {
  return state.achievements[id] === true
}

export function markAchievementUnlocked(
  state: GameState,
  id: AchievementId,
): boolean {
  if (isAchievementUnlocked(state, id)) return false
  state.achievements[id] = true
  return true
}

export function evaluateAchievements(
  state: GameState,
  limit = 1,
): AchievementDef[] {
  const unlocked: AchievementDef[] = []
  const cap = Math.max(1, limit)
  for (const def of ACHIEVEMENTS) {
    if (unlocked.length >= cap) break
    if (isAchievementUnlocked(state, def.id)) continue
    let ok = false
    try {
      ok = def.check(state)
    } catch {
      // битый check не должен ронять игровой цикл
      continue
    }
    if (!ok) continue
    if (!markAchievementUnlocked(state, def.id)) continue
    state.cash += achievementRewardCash(state, def.reward)
    unlocked.push(def)
  }
  return unlocked
}

/** Прогресс без платины (она отдельно) */
export function achievementProgress(state: GameState): {
  done: number
  total: number
  platinum: boolean
} {
  const track = ACHIEVEMENTS.filter((a) => a.tier !== 'platinum')
  const total = track.length
  const done = track.filter((a) => isAchievementUnlocked(state, a.id)).length
  return {
    done,
    total,
    platinum: isAchievementUnlocked(state, 'platinum_set'),
  }
}

export function achievementTierProgress(
  state: GameState,
  tier: TrophyTier,
): { done: number; total: number } {
  const list = achievementsByTier(tier)
  return {
    total: list.length,
    done: list.filter((a) => isAchievementUnlocked(state, a.id)).length,
  }
}

export function trophyCareerPoints(state: GameState): number {
  let sum = 0
  for (const def of ACHIEVEMENTS) {
    if (isAchievementUnlocked(state, def.id)) sum += def.careerPoints
  }
  return sum
}

export function achievementProgressLabel(def: AchievementDef, state: GameState): string | null {
  if (isAchievementUnlocked(state, def.id)) return null
  if (def.id === 'promo_trio') {
    return `акции ${promoLaunchCount(state)}/${PROMOTIONS.length}`
  }
  if (def.id === 'shelf_full') {
    const cap = shelfCapacity(state)
    const n = shelfActiveCount(state)
    if (cap < 4) return `полка ${n}/${cap} · нужно ≥4 слотов`
    return `полка ${n}/${cap}`
  }
  if (def.id === 'shelf_curated') {
    return `на полке ${shelfActiveCount(state)}/3`
  }
  if (def.id === 'back_shift') {
    const n = state.flags.tasksAfterLounge ?? 0
    if (!state.flags.returnedToJob) return 'выйди на смену'
    return `задач после открытия ${Math.min(n, 3)}/3`
  }
  return null
}

/** @deprecated path-трофеев больше нет */
export function achievementDifficultyOnly(
  _def: AchievementDef,
  _state: GameState,
): boolean {
  return false
}

/** Старые id → новые при миграции сейва */
export const LEGACY_ACHIEVEMENT_MAP: Record<string, AchievementId> = {
  open_corner: 'open_lounge',
}

export function normalizeAchievementId(raw: string): AchievementId | null {
  const mapped = LEGACY_ACHIEVEMENT_MAP[raw] ?? raw
  return ACHIEVEMENTS.some((a) => a.id === mapped) ? (mapped as AchievementId) : null
}
