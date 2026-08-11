import { normalizeAchievementId } from '../data/achievements'
import { normalizeAmbassadorOf } from '../game/ambassador'
import { createInitialState, type GameState } from '../game/state'
import { clampJobRankToProgress, normalizeJobRank } from '../data/ranks'
import { getLoungeTier } from '../data/loungeTiers'
import { normalizeVenueId } from '../data/venues'
import { difficultyFromVenue } from '../data/difficulty'
import type { TobaccoId } from '../data/tobacco'
import { getTobacco } from '../data/tobacco'
import {
  CHANNEL_GEAR_GRADE_MAX,
  TELEGRAM_GRADES,
  TELEGRAM_TOOLKIT,
} from '../data/personal'
import { PROMOTIONS } from '../data/promotions'
import { SHOP_ITEMS, shopMaxLevel, type ShopItemId } from '../data/shop'
import { STAFF_ROLES, maxStaffForRole, type StaffId } from '../data/staff'
import { UPGRADES, type UpgradeId } from '../data/upgrades'
import {
  applyLifetimeTrophies,
  persistLifetimeTrophies,
  seedLifetimeTrophiesFromSave,
} from './trophies'
import { storageKey } from '../platform/runtime'
import {
  clearTelegramCloudSave,
  scheduleTelegramCloudSave,
  flushTelegramCloudSave,
} from '../platform/telegramCloudSave'

const KEY_BASE = 'lounge-idle-save-v1'
function saveKey(): string {
  return storageKey(KEY_BASE)
}

/** Есть ли локальный blob (не путать с createInitialState().lastActive = now). */
export function hasLocalSaveBlob(): boolean {
  try {
    return localStorage.getItem(saveKey()) != null
  } catch {
    return false
  }
}

/** Стереть только локальный сейв (облако не трогаем) — для ?cloud=pull */
export function clearLocalSaveBlob(): void {
  try {
    localStorage.removeItem(saveKey())
  } catch {
    /* ignore */
  }
}

/** Применить сырой JSON сейва (облако → localStorage → миграции). */
export function applySaveRaw(raw: string): GameState {
  localStorage.setItem(saveKey(), raw)
  return loadState()
}

/**
 * Ревизия одноразовых миграций.
 * Увеличивать только когда нужна новая перекладка шкал (не clamp).
 * Синхрон с createInitialState().migrateRev
 */
export const CURRENT_MIGRATE_REV = 2

/** Rev, с которой шкалы канала/TG уже в текущих потолках (не сжимать повторно). */
const SCALED_CAPS_REV = 2

function clampInt(n: unknown, min: number, max: number, fallback = min): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

function clampOwnedUpgrades(
  owned: GameState['owned'],
): GameState['owned'] {
  const next = { ...owned }
  for (const def of UPGRADES) {
    const id = def.id as UpgradeId
    next[id] = clampInt(next[id] ?? 0, 0, def.maxLevel, 0)
  }
  return next
}

type LegacySave = Partial<GameState> & {
  menuSlots?: (TobaccoId | null)[]
  staff?: Partial<Record<StaffId, number>>
  staffCount?: Partial<Record<StaffId, number>>
}

function migrateAchievements(
  raw: Partial<Record<string, boolean | number>> | undefined,
): GameState['achievements'] {
  const out: GameState['achievements'] = {}
  if (!raw) return out
  for (const key of Object.keys(raw)) {
    const id = normalizeAchievementId(key)
    if (!id) continue
    const v = raw[key]
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
    let level = 0
    if (typeof v === 'boolean') level = v ? 1 : 0
    else if (typeof v === 'number') level = v
    out[item.id] = clampInt(level, 0, shopMaxLevel(item), 0)
  }
  return out
}

/**
 * Сжатие со старого потолка на новый — только для уровней выше newMax.
 * Уровни уже в новой шкале не трогаем (иначе F5 снова сжимает прогресс).
 */
export function migrateScaledLevel(
  level: number,
  oldMax: number,
  newMax: number,
): number {
  if (!Number.isFinite(level) || level <= 0) return 0
  const n = Math.floor(level)
  if (n <= newMax) return Math.min(newMax, n)
  if (oldMax <= newMax) return Math.min(newMax, n)
  return Math.min(newMax, Math.ceil((n / oldMax) * newMax))
}

function clampChannelGear(
  raw: Partial<{ camera: number; montage: number; branding: number }> | undefined,
  base: GameState['personal']['channelGear'],
): GameState['personal']['channelGear'] {
  const merged = { ...base, ...raw }
  return {
    camera: clampInt(merged.camera, 0, CHANNEL_GEAR_GRADE_MAX, 0),
    montage: clampInt(merged.montage, 0, CHANNEL_GEAR_GRADE_MAX, 0),
    branding: clampInt(merged.branding, 0, CHANNEL_GEAR_GRADE_MAX, 0),
  }
}

function scaleChannelGearOnce(
  raw: Partial<{ camera: number; montage: number; branding: number }> | undefined,
  base: GameState['personal']['channelGear'],
): GameState['personal']['channelGear'] {
  const merged = { ...base, ...raw }
  return {
    camera: migrateScaledLevel(merged.camera, 15, CHANNEL_GEAR_GRADE_MAX),
    montage: migrateScaledLevel(merged.montage, 12, CHANNEL_GEAR_GRADE_MAX),
    branding: migrateScaledLevel(merged.branding, 12, CHANNEL_GEAR_GRADE_MAX),
  }
}

function clampTelegramToolkit(
  raw: Partial<{ content: number; visual: number; reach: number }> | undefined,
  base: GameState['personal']['telegramToolkit'],
): GameState['personal']['telegramToolkit'] {
  const merged = { ...base, ...raw }
  const maxOf = (id: 'content' | 'visual' | 'reach') =>
    TELEGRAM_TOOLKIT.find((d) => d.id === id)?.maxLevel ?? 4
  return {
    content: clampInt(merged.content, 0, maxOf('content'), 0),
    visual: clampInt(merged.visual, 0, maxOf('visual'), 0),
    reach: clampInt(merged.reach, 0, maxOf('reach'), 0),
  }
}

function scaleTelegramToolkitOnce(
  raw: Partial<{ content: number; visual: number; reach: number }> | undefined,
  base: GameState['personal']['telegramToolkit'],
): GameState['personal']['telegramToolkit'] {
  const merged = { ...base, ...raw }
  return {
    content: migrateScaledLevel(merged.content, 12, 4),
    visual: migrateScaledLevel(merged.visual, 12, 4),
    reach: migrateScaledLevel(merged.reach, 15, 4),
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
      if (!arr?.length) continue
      const max = maxStaffForRole(role.id)
      out[role.id] = arr.slice(0, max).map((g) => clampInt(g, 1, 4, 1))
    }
    return out
  }
  const out: GameState['staffMembers'] = { ...base }
  for (const role of STAFF_ROLES) {
    const count = parsed.staffCount?.[role.id] ?? 0
    const grade = clampInt(parsed.staff?.[role.id] ?? 1, 1, 4, 1)
    const max = maxStaffForRole(role.id)
    if (count > 0) {
      out[role.id] = Array.from({ length: Math.min(max, count) }, () => grade)
    }
  }
  return out
}

function migrateShelf(parsed: LegacySave): TobaccoId[] {
  const raw = parsed.shelfActive?.length
    ? parsed.shelfActive
    : ((parsed.menuSlots ?? []).filter(Boolean) as TobaccoId[])
  const uniq: TobaccoId[] = []
  for (const id of raw) {
    if (!getTobacco(id)) continue
    if (uniq.includes(id)) continue
    uniq.push(id)
  }
  return uniq
}

function clampPromotions(
  raw: GameState['promotions'] | undefined,
  base: GameState['promotions'],
): GameState['promotions'] {
  const grades: GameState['promotions']['grades'] = {
    ...base.grades,
    ...raw?.grades,
  }
  for (const def of PROMOTIONS) {
    const max = def.grades.length
    grades[def.id] = clampInt(grades[def.id] ?? 0, 0, max, 0)
  }
  return {
    ...base,
    ...raw,
    grades,
    readyAt: { ...base.readyAt, ...raw?.readyAt },
    activeBoost: typeof raw?.activeBoost === 'number' ? raw.activeBoost : base.activeBoost,
    activeUntil: typeof raw?.activeUntil === 'number' ? raw.activeUntil : base.activeUntil,
    activeId: raw?.activeId ?? base.activeId,
  }
}

const TELEGRAM_GRADE_MAX = TELEGRAM_GRADES.reduce((m, g) => Math.max(m, g.grade), 0)

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(saveKey())
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as LegacySave
    if (parsed.v !== 1) return createInitialState()
    const base = createInitialState()
    const hasProgress =
      (parsed.cash ?? 0) > 0 ||
      (parsed.taskDone?.wash ?? 0) > 0 ||
      parsed.phase === 'dual' ||
      parsed.phase === 'ownOnly'

    const prevRev =
      typeof parsed.migrateRev === 'number' && Number.isFinite(parsed.migrateRev)
        ? Math.floor(parsed.migrateRev)
        : 0
    const needsScaleCaps = prevRev < SCALED_CAPS_REV

    const shelfActive = migrateShelf(parsed)
    const channelGear = needsScaleCaps
      ? scaleChannelGearOnce(parsed.personal?.channelGear, base.personal.channelGear)
      : clampChannelGear(parsed.personal?.channelGear, base.personal.channelGear)
    const telegramToolkit = needsScaleCaps
      ? scaleTelegramToolkitOnce(
          parsed.personal?.telegramToolkit,
          base.personal.telegramToolkit,
        )
      : clampTelegramToolkit(
          parsed.personal?.telegramToolkit,
          base.personal.telegramToolkit,
        )

    const merged: GameState = {
      ...base,
      ...parsed,
      migrateRev: CURRENT_MIGRATE_REV,
      syncRev: clampInt(parsed.syncRev ?? 0, 0, Number.MAX_SAFE_INTEGER, 0),
      owned: clampOwnedUpgrades({ ...base.owned, ...parsed.owned }),
      shopOwned: migrateShopOwned(parsed.shopOwned, base.shopOwned),
      taskReadyAt: { ...base.taskReadyAt, ...parsed.taskReadyAt },
      taskDone: { ...base.taskDone, ...parsed.taskDone },
      achievements: migrateAchievements(parsed.achievements),
      ownedTobacco: { ...base.ownedTobacco, ...parsed.ownedTobacco },
      shelfActive,
      expansions: { ...base.expansions, ...parsed.expansions },
      branches: { ...base.branches, ...parsed.branches },
      staffMembers: migrateStaffMembers(parsed, base.staffMembers),
      personal: {
        ...base.personal,
        ...parsed.personal,
        channelLevel: clampInt(parsed.personal?.channelLevel ?? 0, 0, 1, 0),
        channelGear,
        telegramGrade: clampInt(
          parsed.personal?.telegramGrade ?? 0,
          0,
          TELEGRAM_GRADE_MAX,
          0,
        ),
        telegramPosts: clampInt(parsed.personal?.telegramPosts ?? 0, 0, 1_000_000, 0),
        telegramPostReadyAt: parsed.personal?.telegramPostReadyAt ?? 0,
        videoBoostUntil: parsed.personal?.videoBoostUntil ?? 0,
        videoBoostAmount: parsed.personal?.videoBoostAmount ?? 0,
        videoPromoReadyUntil: parsed.personal?.videoPromoReadyUntil ?? 0,
        telegramBoostUntil: parsed.personal?.telegramBoostUntil ?? 0,
        telegramBoostAmount: parsed.personal?.telegramBoostAmount ?? 0,
        telegramToolkit,
        ambassadorOf: normalizeAmbassadorOf({
          ...base.personal.ambassadorOf,
          ...parsed.personal?.ambassadorOf,
        }),
      },
      promotions: clampPromotions(parsed.promotions, base.promotions),
      career: {
        ...base.career,
        ...parsed.career,
        milestones: { ...base.career.milestones, ...parsed.career?.milestones },
        workDays: clampInt(parsed.career?.workDays ?? 0, 0, 1_000_000, 0),
        dayProgressSec: Math.max(0, parsed.career?.dayProgressSec ?? 0),
        totalActiveSec: Math.max(0, parsed.career?.totalActiveSec ?? 0),
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
        serviceWarned: parsed.flags?.serviceWarned ?? false,
        everServiceStrain: parsed.flags?.everServiceStrain ?? false,
        hadDualPhase:
          parsed.flags?.hadDualPhase ??
          (parsed.phase === 'dual' || parsed.phase === 'ownOnly'),
        loyalPockets:
          parsed.flags?.loyalPockets ?? parsed.achievements?.loyal_pockets === true,
        bareHandsEarned:
          parsed.flags?.bareHandsEarned ?? parsed.achievements?.bare_hands === true,
        tasksAfterLounge: parsed.flags?.tasksAfterLounge ?? 0,
        tobaccoBought: parsed.flags?.tobaccoBought ?? false,
        everHired:
          parsed.flags?.everHired ??
          Object.values(parsed.staffMembers ?? {}).some(
            (m) => Array.isArray(m) && m.length > 0,
          ) ??
          Object.values(parsed.staff ?? {}).some((g) => (g ?? 0) > 0),
        firstHireRole: parsed.flags?.firstHireRole ?? null,
        promoLaunched: { ...(parsed.flags?.promoLaunched ?? {}) },
        guideStep: parsed.flags?.guideStep ?? (hasProgress ? 'done' : 'pick_venue'),
        guideAckedIndex:
          parsed.flags?.guideAckedIndex ??
          (hasProgress ? 99 : -1),
        coalsDualHintSeen:
          parsed.flags?.coalsDualHintSeen ??
          (hasProgress && (parsed.taskDone?.wash ?? 0) >= 8),
        tobaccoSetupPending: parsed.flags?.tobaccoSetupPending ?? false,
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
      jobRank: clampJobRankToProgress(
        normalizeJobRank(parsed.jobRank ?? base.jobRank),
        { ...base.taskDone, ...parsed.taskDone },
      ),
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
    // Название зала = тариф (старые сейвы «Уголок · Nikita» и т.п.)
    if (merged.loungeTier && merged.phase !== 'employed') {
      merged.loungeName = getLoungeTier(merged.loungeTier).name
    }
    return merged
  } catch {
    const base = createInitialState()
    applyLifetimeTrophies(base)
    return base
  }
}

export function saveState(
  state: GameState,
  opts?: { bumpSync?: boolean },
): boolean {
  const bumpSync = opts?.bumpSync !== false
  if (bumpSync) {
    const prev =
      typeof state.syncRev === 'number' && Number.isFinite(state.syncRev)
        ? Math.max(0, Math.floor(state.syncRev))
        : 0
    state.syncRev = prev + 1
  } else if (
    typeof state.syncRev !== 'number' ||
    !Number.isFinite(state.syncRev)
  ) {
    state.syncRev = 0
  }
  state.lastActive = Date.now()
  state.migrateRev = CURRENT_MIGRATE_REV
  try {
    persistLifetimeTrophies(state)
    localStorage.setItem(saveKey(), JSON.stringify(state))
    scheduleTelegramCloudSave(state)
    return true
  } catch {
    // Safari private / квота / блокировка storage
    return false
  }
}

export function isSaveStorageAvailable(): boolean {
  try {
    const probe = '__lounge_idle_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function createDebouncedSave(ms = 400): ((state: GameState) => void) & {
  flush: (state: GameState, opts?: { bumpSync?: boolean }) => boolean
} {
  let t: ReturnType<typeof setTimeout> | null = null
  let pending: GameState | null = null
  const schedule = ((state: GameState) => {
    pending = state
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      t = null
      if (pending) {
        saveState(pending, { bumpSync: true })
        pending = null
      }
    }, ms)
  }) as ((state: GameState) => void) & {
    flush: (state: GameState, opts?: { bumpSync?: boolean }) => boolean
  }
  schedule.flush = (state: GameState, opts?: { bumpSync?: boolean }) => {
    const hadPending = pending != null || t != null
    if (t) clearTimeout(t)
    t = null
    pending = null
    // Сворот без новых действий — не бампаем syncRev (иначе телефон затирает Mac)
    const bumpSync = opts?.bumpSync ?? hadPending
    const ok = saveState(state, { bumpSync })
    if (ok) void flushTelegramCloudSave(state)
    return ok
  }
  return schedule
}

export function resetSave(): void {
  try {
    localStorage.removeItem(saveKey())
  } catch {
    /* ignore */
  }
  void clearTelegramCloudSave()
}
