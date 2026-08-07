import { createInitialState, type GameState } from '../game/state'
import { normalizeVenueId } from '../data/venues'
import type { TobaccoId } from '../data/tobacco'
import { SHOP_ITEMS, type ShopItemId } from '../data/shop'
import { STAFF_ROLES, type StaffId } from '../data/staff'

const KEY = 'lounge-idle-save-v1'

type LegacySave = Partial<GameState> & {
  menuSlots?: (TobaccoId | null)[]
  staff?: Partial<Record<StaffId, number>>
  staffCount?: Partial<Record<StaffId, number>>
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
      achievements: { ...base.achievements, ...parsed.achievements },
      ownedTobacco: { ...base.ownedTobacco, ...parsed.ownedTobacco },
      shelfActive,
      expansions: { ...base.expansions, ...parsed.expansions },
      branches: { ...base.branches, ...parsed.branches },
      staffMembers: migrateStaffMembers(parsed, base.staffMembers),
      personal: { ...base.personal, ...parsed.personal, channelGear: {
        ...base.personal.channelGear,
        ...parsed.personal?.channelGear,
      } },
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
        guideStep: parsed.flags?.guideStep ?? (hasProgress ? 'done' : 'pick_venue'),
        guideAckedIndex:
          parsed.flags?.guideAckedIndex ??
          (hasProgress ? 99 : -1),
        coalsDualHintSeen:
          parsed.flags?.coalsDualHintSeen ??
          (hasProgress && (parsed.taskDone?.wash ?? 0) >= 8),
        personalIntroPending: parsed.flags?.personalIntroPending ?? false,
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
      v: 1,
    }

    return merged
  } catch {
    return createInitialState()
  }
}

export function saveState(state: GameState): void {
  state.lastActive = Date.now()
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
