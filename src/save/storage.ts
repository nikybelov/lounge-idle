import { createInitialState, type GameState } from '../game/state'
import { normalizeVenueId } from '../data/venues'

const KEY = 'lounge-idle-save-v1'

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (parsed.v !== 1) return createInitialState()
    const base = createInitialState()
    const hasProgress =
      (parsed.cash ?? 0) > 0 ||
      (parsed.taskDone?.wash ?? 0) > 0 ||
      parsed.phase === 'dual' ||
      parsed.phase === 'ownOnly'

    const merged = {
      ...base,
      ...parsed,
      owned: { ...base.owned, ...parsed.owned },
      shopOwned: { ...base.shopOwned, ...parsed.shopOwned },
      taskReadyAt: { ...base.taskReadyAt, ...parsed.taskReadyAt },
      taskDone: { ...base.taskDone, ...parsed.taskDone },
      achievements: { ...base.achievements, ...parsed.achievements },
      ownedTobacco: { ...base.ownedTobacco, ...parsed.ownedTobacco },
      expansions: { ...base.expansions, ...parsed.expansions },
      menuSlots: parsed.menuSlots ?? base.menuSlots,
      menuPickSlot: null,
      flags: {
        ...base.flags,
        ...parsed.flags,
        pickingLounge: false,
        loungeOfferUnlocked: parsed.flags?.loungeOfferUnlocked ?? false,
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
      v: 1 as const,
    }

    // Старые залы без меню — стартовый вкус
    if (
      (merged.phase === 'dual' || merged.phase === 'ownOnly') &&
      !Object.values(merged.ownedTobacco).some(Boolean)
    ) {
      merged.ownedTobacco.dawn_apple = true
      if (!merged.menuSlots.length) merged.menuSlots = ['dawn_apple']
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
