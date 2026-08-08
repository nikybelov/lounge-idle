import type { AchievementId } from '../data/achievements'
import { normalizeAmbassadorOf } from '../game/ambassador'
import { createInitialState, type GameState } from '../game/state'
import { normalizeVenueId } from '../data/venues'
import { difficultyFromVenue } from '../data/difficulty'
import type { TobaccoId } from '../data/tobacco'
import { SHOP_ITEMS, type ShopItemId } from '../data/shop'
import { STAFF_ROLES, type StaffId } from '../data/staff'
import {
  applyLifetimeTrophies,
  persistLifetimeTrophies,
  seedLifetimeTrophiesFromSave,
} from './trophies'

const KEY = 'lounge-idle-save-v1'

type LegacySave = Partial<GameState> & {
  menuSlots?: (TobaccoId | null)[]
  staff?: Partial<Record<StaffId, number>>
  staffCount?: Partial<Record<StaffId, number>>
}

function migrateAchievements(
  raw: Partial<Record<AchievementId, boolean | number>> | undefined,
): GameState['achievements'] {
  const out: GameState['achievements'] = {}
  if (!raw) return out
  for (const id of Object.keys(raw) as AchievementId[]) {
    const v = raw[id]
    if (v === true || (typeof v === 'number' && v > 0)) out[id] = true
  }
  return out
}

function migrateShopOwned(
  parsed: Partial<Record<ShopItemId, number | boolean>> | undefined,
  base: GameState['shopOwned'],
): GameState['shopOwned'] {
  const out: GameState['shopOwned'] = { ...base }
  for (const item of SHOP_ITEMS) {
    const v = parsed?.[item.id]
    if (typeof v === 'boolean') out[item.id] = v ? 1 : 0
    else if (typeof v === 'number') out[item.id] = v
  }
  return out
}

function migrateChannelGearLevel(level: number, oldMax: number): number {
  if (level <= 0) return 0
  if (oldMax <= 8) return Math.min(8, level)
  return Math.min(8, Math.ceil((level / oldMax) * 8))
}

function migrateChannelGear(
  raw: Partial<{ camera: number; montage: number; branding: number }> | undefined,
  base: GameState['personal']['channelGear'],
): GameState['personal']['channelGear'] {
  const merged = { ...base, ...raw }
  return {
    camera: migrateChannelGearLevel(merged.camera, 15),
    montage: migrateChannelGearLevel(merged.montage, 12),
    branding: migrateChannelGearLevel(merged.branding, 12),
  }
}

function migrateTelegramToolkitLevel(level: number, oldMax: number): number {
  if (level <= 0) return 0
  if (oldMax <= 4) return Math.min(4, level)
  return Math.min(4, Math.ceil((level / oldMax) * 4))
}

function migrateTelegramToolkit(
  raw: Partial<{ content: number; visual: number; reach: number }> | undefined,
  base: GameState['personal']['telegramToolkit'],
): GameState['personal']['telegramToolkit'] {
  const merged = { ...base, ...raw }
  return {
    content: migrateTelegramToolkitLevel(merged.content, 12),
    visual: migrateTelegramToolkitLevel(merged.visual, 12),
    reach: migrateTelegramToolkitLevel(merged.reach, 15),
  }
}

function migrateStaffMembers(
  parsed: LegacySave,
  base: GameState['staffMembers'],
): GameState['staffMembers'] {
  if (parsed.staffMembers && Object.keys(parsed.staffMembers).length > 0) {
    const out: GameState['staffMembers'] = { ...base }
    for (const role of STAFF_ROLES) {
      const arr = parsed.staffMembers[role.id]
      if (arr?.length) out[role.id] = [...arr]
    }
    return out
  }
  const out: GameState['staffMembers'] = { ...base }
  for (const role of STAFF_ROLES) {
    const count = parsed.staffCount?.[role.id] ?? 0
    const grade = parsed.staff?.[role.id] ?? 1
    if (count > 0) out[role.id] = Array.from({ length: count }, () => grade)
  }
  return out
}

function migrateShelf(parsed: LegacySave): TobaccoId[] {
  if (parsed.shelfActive?.length) return parsed.shelfActive
  const fromSlots = (parsed.menuSlots ?? []).filter(Boolean) as TobaccoId[]
  if (fromSlots.length) return [...new Set(fromSlots)]
  return []
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as LegacySave
    if (parsed.v !== 1) return createInitialState()
    const base = createInitialState()
    const hasProgress =
      (parsed.cash ?? 0) > 0 ||
      (parsed.taskDone?.wash ?? 0) > 0 ||
      parsed.phase === 'dual' ||
      parsed.phase === 'ownOnly'

    const shelfActive = migrateShelf(parsed)

    const merged: GameState = {
      ...base,
      ...parsed,
      owned: { ...base.owned, ...parsed.owned },
      shopOwned: migrateShopOwned(parsed.shopOwned, base.shopOwned),
      taskReadyAt: { ...base.taskReadyAt, ...parsed.taskReadyAt },
      taskDone: { ...base.taskDone, ...parsed.taskDone },
      achievements: migrateAchievements(parsed.achievements),
      ownedTobacco: { ...base.ownedTobacco, ...parsed.ownedTobacco },
      shelfActive,
      expansions: { ...base.expansions, ...parsed.expansions },
      branches: { ...base.branches, ...parsed.branches },
      staffMembers: migrateStaffMembers(parsed, base.staffMembers),
      personal: { ...base.personal, ...parsed.personal,       channelGear: migrateChannelGear(parsed.personal?.channelGear, base.personal.channelGear),
      telegramGrade: parsed.personal?.telegramGrade ?? 0,
      telegramPosts: parsed.personal?.telegramPosts ?? 0,
      telegramPostReadyAt: parsed.personal?.telegramPostReadyAt ?? 0,
      videoBoostUntil: parsed.personal?.videoBoostUntil ?? 0,
      videoBoostAmount: parsed.personal?.videoBoostAmount ?? 0,
      videoPromoReadyUntil: parsed.personal?.videoPromoReadyUntil ?? 0,
      telegramBoostUntil: parsed.personal?.telegramBoostUntil ?? 0,
      telegramBoostAmount: parsed.personal?.telegramBoostAmount ?? 0,
      telegramToolkit: migrateTelegramToolkit(parsed.personal?.telegramToolkit, base.personal.telegramToolkit),
      ambassadorOf: normalizeAmbassadorOf({
        ...base.personal.ambassadorOf,
        ...parsed.personal?.ambassadorOf,
      }),
      },
      promotions: {
        ...base.promotions,
        ...parsed.promotions,
        grades: { ...base.promotions.grades, ...parsed.promotions?.grades },
        readyAt: { ...base.promotions.readyAt, ...parsed.promotions?.readyAt },
      },
      career: {
        ...base.career,
        ...parsed.career,
        milestones: { ...base.career.milestones, ...parsed.career?.milestones },
      },
      flags: {
        ...base.flags,
        ...parsed.flags,
        pickingLounge: false,
        loungeOfferUnlocked: parsed.flags?.loungeOfferUnlocked ?? false,
        shelfSparseWarned: parsed.flags?.shelfSparseWarned ?? false,
        shelfRichToast: parsed.flags?.shelfRichToast ?? false,
        shelfEmptyWarned: parsed.flags?.shelfEmptyWarned ?? false,
        empireOfferUnlocked: parsed.flags?.empireOfferUnlocked ?? false,
        payrollWarned: parsed.flags?.payrollWarned ?? false,
        hadDualPhase:
          parsed.flags?.hadDualPhase ??
          (parsed.phase === 'dual' || parsed.phase === 'ownOnly'),
        loyalPockets:
          parsed.flags?.loyalPockets ?? parsed.achievements?.loyal_pockets === true,
        bareHandsEarned:
          parsed.flags?.bareHandsEarned ?? parsed.achievements?.bare_hands === true,
        guideStep: parsed.flags?.guideStep ?? (hasProgress ? 'done' : 'pick_venue'),
        guideAckedIndex:
          parsed.flags?.guideAckedIndex ??
          (hasProgress ? 99 : -1),
        coalsDualHintSeen:
          parsed.flags?.coalsDualHintSeen ??
          (hasProgress && (parsed.taskDone?.wash ?? 0) >= 8),
        personalIntroPending: parsed.flags?.personalIntroPending ?? false,
        milestoneHints: {
          guide_done: parsed.flags?.milestoneHints?.guide_done ?? false,
          dual_phase: parsed.flags?.milestoneHints?.dual_phase ?? false,
          quit_ready:
            parsed.flags?.milestoneHints?.quit_ready ??
            parsed.flags?.sawQuitReady ??
            false,
          shelf_empty:
            parsed.flags?.milestoneHints?.shelf_empty ??
            parsed.flags?.shelfEmptyWarned ??
            false,
          shelf_sparse:
            parsed.flags?.milestoneHints?.shelf_sparse ??
            parsed.flags?.shelfSparseWarned ??
            false,
          payroll_heavy:
            parsed.flags?.milestoneHints?.payroll_heavy ??
            parsed.flags?.payrollWarned ??
            false,
          broke_dual:
            parsed.flags?.milestoneHints?.broke_dual ??
            parsed.flags?.sawBrokeHint ??
            false,
          network_unlock:
            parsed.flags?.milestoneHints?.network_unlock ?? false,
          first_promo: parsed.flags?.milestoneHints?.first_promo ?? false,
          first_hire: parsed.flags?.milestoneHints?.first_hire ?? false,
          rank_up: parsed.flags?.milestoneHints?.rank_up ?? false,
          idle_nudge: parsed.flags?.milestoneHints?.idle_nudge ?? false,
        },
        tabHints: {
          shop: parsed.flags?.tabHints?.shop ?? hasProgress,
          tobacco: parsed.flags?.tabHints?.tobacco ?? hasProgress,
          staff: parsed.flags?.tabHints?.staff ?? hasProgress,
          network: parsed.flags?.tabHints?.network ?? hasProgress,
          personal: parsed.flags?.tabHints?.personal ?? hasProgress,
          career: parsed.flags?.tabHints?.career ?? hasProgress,
        },
        celebration: null,
      },
      loungeTier: parsed.loungeTier ?? null,
      loungeIncomeMult: parsed.loungeIncomeMult ?? 1,
      loungeClickMult: parsed.loungeClickMult ?? 1,
      jobRank: parsed.jobRank ?? base.jobRank,
      onboarded: parsed.onboarded ?? hasProgress,
      playerName: parsed.playerName || (hasProgress ? 'Игрок' : ''),
      venueId: parsed.venueId
        ? normalizeVenueId(parsed.venueId)
        : hasProgress
          ? 'smoke_river'
          : null,
      difficulty:
        parsed.difficulty ??
        (parsed.venueId || hasProgress
          ? difficultyFromVenue(
              parsed.venueId ? normalizeVenueId(parsed.venueId) : 'smoke_river',
            )
          : null),
      v: 1,
    }

    seedLifetimeTrophiesFromSave(merged.achievements)
    applyLifetimeTrophies(merged)
    return merged
  } catch {
    const base = createInitialState()
    applyLifetimeTrophies(base)
    return base
  }
}

export function saveState(state: GameState): void {
  state.lastActive = Date.now()
  persistLifetimeTrophies(state)
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function createDebouncedSave(ms = 400): (state: GameState) => void {
  let t: ReturnType<typeof setTimeout> | null = null
  return (state) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => saveState(state), ms)
  }
}

export function resetSave(): void {
  localStorage.removeItem(KEY)
}
