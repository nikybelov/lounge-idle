import type { ExpansionId } from '../data/expansions'
import type { AchievementId } from '../data/achievements'
import type { LoungeTierId } from '../data/loungeTiers'
import type { JobRank } from '../data/ranks'
import type { ShopItemId } from '../data/shop'
import type { TaskId } from '../data/tasks'
import type { TobaccoId } from '../data/tobacco'
import type { UpgradeId } from '../data/upgrades'
import type { VenueId } from '../data/venues'

export type CareerPhase = 'employed' | 'dual' | 'ownOnly'
export type Scene = 'job' | 'lounge'

export interface GameState {
  v: 1
  cash: number
  phase: CareerPhase
  scene: Scene
  jobRank: JobRank
  onboarded: boolean
  playerName: string
  venueId: VenueId | null
  loungeTier: LoungeTierId | null
  loungeIncomeMult: number
  loungeClickMult: number
  loungeName: string
  owned: Record<UpgradeId, number>
  shopOwned: Partial<Record<ShopItemId, boolean>>
  ownedTobacco: Partial<Record<TobaccoId, boolean>>
  menuSlots: (TobaccoId | null)[]
  menuPickSlot: number | null
  expansions: Partial<Record<ExpansionId, boolean>>
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
  }
}

export function createInitialState(now = Date.now()): GameState {
  return {
    v: 1,
    cash: 0,
    phase: 'employed',
    scene: 'job',
    jobRank: 'assistant',
    onboarded: false,
    playerName: '',
    venueId: null,
    loungeTier: null,
    loungeIncomeMult: 1,
    loungeClickMult: 1,
    loungeName: 'Мой угол',
    owned: {
      table: 0,
      sofa: 0,
      menu: 0,
      hood: 0,
      vip: 0,
    },
    shopOwned: {},
    ownedTobacco: {},
    menuSlots: [],
    menuPickSlot: null,
    expansions: {},
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
    },
  }
}
