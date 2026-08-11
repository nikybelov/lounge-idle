import type { StaffId } from '../data/staff'
import type { BranchId } from '../data/branches'
import type { ExpansionId } from '../data/expansions'
import type { AchievementId } from '../data/achievements'
import type { LoungeTierId } from '../data/loungeTiers'
import type { JobRank } from '../data/ranks'
import type { ShopItemId } from '../data/shop'
import type { TaskId } from '../data/tasks'
import type { TobaccoId } from '../data/tobacco'
import type { UpgradeId } from '../data/upgrades'
import type { VenueId } from '../data/venues'
import type { DifficultyId } from '../data/difficulty'
import type { CareerMilestoneId } from '../data/careerTrack'
import type { PromotionId } from '../data/promotions'
import type { TelegramToolkitLevels } from '../data/personal'

export type GuideStep =
  | 'pick_venue'
  | 'welcome'
  | 'first_task'
  | 'dual_tasks'
  | 'reputation'
  | 'halfway'
  | 'lounge_ready'
  | 'first_order'
  | 'done'

export type CareerPhase = 'employed' | 'dual' | 'ownOnly'
export type Scene = 'job' | 'lounge'

export interface CareerTrackState {
  /** Завершённые полные рабочие дни (0 = первый день) */
  workDays: number
  /** Прогресс текущего дня, сек */
  dayProgressSec: number
  /** Всего активных секунд в этой карьере */
  totalActiveSec: number
  /** Веха → номер дня, когда достигнута */
  milestones: Partial<Record<CareerMilestoneId, number>>
}

export interface PersonalState {
  /** Узнаваемость — постоянный бонус к потоку гостей */
  fame: number
  /** Медийность — усиливает эффект блога и премий */
  media: number
  channelLevel: number
  /** Прокачка канала: камера, монтаж, брендинг */
  channelGear: {
    camera: number
    montage: number
    branding: number
  }
  videosPosted: number
  eventsHeld: number
  awardAttempts: number
  awardWins: number
  videoReadyAt: number
  videoBoostUntil: number
  videoBoostAmount: number
  /** После ролика — окно для бонусного поста в Telegram */
  videoPromoReadyUntil: number
  eventReadyAt: number
  awardReadyAt: number
  eventBoostUntil: number
  eventBoostAmount: number
  /** Telegram-канал: 0 = нет, 1–4 = грейд */
  telegramGrade: number
  telegramPosts: number
  telegramPostReadyAt: number
  telegramBoostUntil: number
  telegramBoostAmount: number
  /** Прокачка инструментов Telegram */
  telegramToolkit: TelegramToolkitLevels
  /** Контракт амбассадора — только один бренд за раз */
  ambassadorOf: Partial<Record<TobaccoId, boolean>>
}

export interface PromotionsState {
  grades: Partial<Record<PromotionId, number>>
  activeId: PromotionId | null
  activeUntil: number
  activeBoost: number
  readyAt: Partial<Record<PromotionId, number>>
}

export interface GameState {
  v: 1
  /**
   * Ревизия одноразовых миграций сейва.
   * Растёт только когда нужна новая сжатие/перекладка шкал — не при каждом reload.
   */
  migrateRev: number
  cash: number
  phase: CareerPhase
  scene: Scene
  jobRank: JobRank
  onboarded: boolean
  playerName: string
  venueId: VenueId | null
  /** Задаётся при выборе заведения на старте — влияет на экономику зала и сети */
  difficulty: DifficultyId | null
  loungeTier: LoungeTierId | null
  loungeIncomeMult: number
  loungeClickMult: number
  loungeName: string
  owned: Record<UpgradeId, number>
  shopOwned: Partial<Record<ShopItemId, number>>
  ownedTobacco: Partial<Record<TobaccoId, boolean>>
  /** Вкусы, выставленные на табачную полку */
  shelfActive: TobaccoId[]
  expansions: Partial<Record<ExpansionId, boolean>>
  /** Открытые точки сети лаунжей */
  branches: Partial<Record<BranchId, boolean>>
  /** Грейды каждого нанятого сотрудника по роли (1–4) */
  staffMembers: Partial<Record<StaffId, number[]>>
  personal: PersonalState
  promotions: PromotionsState
  career: CareerTrackState
  taskReadyAt: Record<TaskId, number>
  taskDone: Record<TaskId, number>
  achievements: Partial<Record<AchievementId, boolean>>
  lastActive: number
  flags: {
    sawBrokeHint: boolean
    sawQuitReady: boolean
    returnedToJob: boolean
    loungeOrders: number
    pickingLounge: boolean
    loungeOfferUnlocked: boolean
    shelfSparseWarned: boolean
    shelfRichToast: boolean
    shelfEmptyWarned: boolean
    /** Вкладка «Сеть» после авторского зала + увольнения */
    empireOfferUnlocked: boolean
    payrollWarned: boolean
    /** Перегруз сервиса — посадка без команды (тост за эпизод) */
    serviceWarned: boolean
    /** Хотя бы раз словили перегруз сервиса (для секрета) */
    everServiceStrain: boolean
    /** Был период «смена + свой зал» — для трофея «Трудяга» */
    hadDualPhase: boolean
    /** Накопил лишнее на смене до открытия зала */
    loyalPockets: boolean
    /** 35+ моек без шуруповёрта — можно купить инструмент позже */
    bareHandsEarned: boolean
    /** Задач смены, сделанных уже после открытия лаунжа */
    tasksAfterLounge: number
    /** Купил табак сам (не стартовый комплект) */
    tobaccoBought: boolean
    /** Хотя бы раз нанимал кого-то */
    everHired: boolean
    /** Роль первого найма */
    firstHireRole: StaffId | null
    /** Какие типы акций запускали */
    promoLaunched: Partial<Record<PromotionId, boolean>>
    guideStep: GuideStep
    /** Индекс последнего шага, который игрок закрыл в coach */
    guideAckedIndex: number
    /** Coach «две задачи на смене» после открытия «Поменяй угли» */
    coalsDualHintSeen: boolean
    /** Сразу после открытия лаунжа — подсказка про вкладку «Табак» / полку */
    tobaccoSetupPending: boolean
    /** Показать intro-подсказку вкладки «Личное развитие» после открытия зала */
    personalIntroPending: boolean
    /** Одноразовые подсказки Огонька после основного гайда */
    milestoneHints: {
      guide_done: boolean
      dual_phase: boolean
      quit_ready: boolean
      shelf_empty: boolean
      shelf_sparse: boolean
      payroll_heavy: boolean
      broke_dual: boolean
      network_unlock: boolean
      first_promo: boolean
      first_hire: boolean
      rank_up: boolean
      idle_nudge: boolean
    }
    tabHints: {
      shop: boolean
      tobacco: boolean
      staff: boolean
      network: boolean
      personal: boolean
      career: boolean
    }
    celebration: {
      kind: 'lounge' | 'rank' | 'award'
      title: string
      subtitle: string
    } | null
  }
}

export function createInitialState(now = Date.now()): GameState {
  return {
    v: 1,
    /** Синхрон с CURRENT_MIGRATE_REV в save/storage.ts */
    migrateRev: 2,
    cash: 0,
    phase: 'employed',
    scene: 'job',
    jobRank: 'assistant',
    onboarded: false,
    playerName: '',
    venueId: null,
    difficulty: null,
    loungeTier: null,
    loungeIncomeMult: 1,
    loungeClickMult: 1,
    loungeName: 'Мой лаунж',
    owned: {
      table: 0,
      sofa: 0,
      menu: 0,
      hood: 0,
      vip: 0,
    },
    shopOwned: {},
    ownedTobacco: {},
    shelfActive: [],
    expansions: {},
    branches: {},
      staffMembers: {},
      personal: {
        fame: 0,
        media: 0,
        channelLevel: 0,
        channelGear: { camera: 0, montage: 0, branding: 0 },
        videosPosted: 0,
        eventsHeld: 0,
        awardAttempts: 0,
        awardWins: 0,
        videoReadyAt: 0,
        videoBoostUntil: 0,
        videoBoostAmount: 0,
        videoPromoReadyUntil: 0,
        eventReadyAt: 0,
        awardReadyAt: 0,
        eventBoostUntil: 0,
        eventBoostAmount: 0,
        telegramGrade: 0,
        telegramPosts: 0,
        telegramPostReadyAt: 0,
        telegramBoostUntil: 0,
        telegramBoostAmount: 0,
        telegramToolkit: { content: 0, visual: 0, reach: 0 },
        ambassadorOf: {},
      },
      promotions: {
        grades: {},
        activeId: null,
        activeUntil: 0,
        activeBoost: 0,
        readyAt: {},
      },
      career: {
        workDays: 0,
        dayProgressSec: 0,
        totalActiveSec: 0,
        milestones: {},
      },
      taskReadyAt: {
      wash: 0,
      coals: 0,
      order: 0,
    },
    taskDone: {
      wash: 0,
      coals: 0,
      order: 0,
    },
    achievements: {},
    lastActive: now,
    flags: {
      sawBrokeHint: false,
      sawQuitReady: false,
      returnedToJob: false,
      loungeOrders: 0,
      pickingLounge: false,
      /** Вкладка «Свой зал» открылась после первых 9k */
      loungeOfferUnlocked: false,
      shelfSparseWarned: false,
      shelfRichToast: false,
      shelfEmptyWarned: false,
      empireOfferUnlocked: false,
      payrollWarned: false,
      serviceWarned: false,
      everServiceStrain: false,
      hadDualPhase: false,
      loyalPockets: false,
      bareHandsEarned: false,
      tasksAfterLounge: 0,
      tobaccoBought: false,
      everHired: false,
      firstHireRole: null,
      promoLaunched: {},
      guideStep: 'pick_venue',
      guideAckedIndex: -1,
      coalsDualHintSeen: false,
      tobaccoSetupPending: false,
      personalIntroPending: false,
      milestoneHints: {
        guide_done: false,
        dual_phase: false,
        quit_ready: false,
        shelf_empty: false,
        shelf_sparse: false,
        payroll_heavy: false,
        broke_dual: false,
        network_unlock: false,
        first_promo: false,
        first_hire: false,
        rank_up: false,
        idle_nudge: false,
      },
      tabHints: {
        shop: false,
        tobacco: false,
        staff: false,
        network: false,
        personal: false,
        career: false,
      },
      celebration: null,
    },
  }
}
