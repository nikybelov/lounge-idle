import type { AchievementId } from '../data/achievements'
import type { GameState } from '../game/state'
import { storageKey } from '../platform/runtime'

const KEY_BASE = 'lounge-idle-trophies-v1'
function trophiesKey(): string {
  return storageKey(KEY_BASE)
}

export function loadLifetimeTrophies(): GameState['achievements'] {
  try {
    const raw = localStorage.getItem(trophiesKey())
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Partial<Record<AchievementId, boolean | number>>
    const out: GameState['achievements'] = {}
    for (const id of Object.keys(parsed) as AchievementId[]) {
      const v = parsed[id]
      if (v === true || (typeof v === 'number' && v > 0)) out[id] = true
    }
    return out
  } catch {
    return {}
  }
}

export function saveLifetimeTrophies(achievements: GameState['achievements']): void {
  localStorage.setItem(trophiesKey(), JSON.stringify(achievements))
}

export function mergeLifetimeTrophies(
  current: GameState['achievements'] | undefined,
): GameState['achievements'] {
  return { ...loadLifetimeTrophies(), ...current }
}

/** Подмешать коллекцию трофеев в текущий стейт */
export function applyLifetimeTrophies(state: GameState): void {
  state.achievements = mergeLifetimeTrophies(state.achievements)
}

/** Сохранить новые трофеи из прогона в постоянную коллекцию */
export function persistLifetimeTrophies(state: GameState): void {
  applyLifetimeTrophies(state)
  saveLifetimeTrophies(state.achievements)
}

/** Первый запуск после апдейта — перенести трофеи из сейва */
export function seedLifetimeTrophiesFromSave(
  achievements: GameState['achievements'] | undefined,
): void {
  if (!achievements || Object.keys(achievements).length === 0) return
  const merged = mergeLifetimeTrophies(achievements)
  saveLifetimeTrophies(merged)
}
