export type ReducedMotionPref = 'system' | 'reduce' | 'full'

export interface GameSettings {
  sound: boolean
  music: boolean
  reducedMotion: ReducedMotionPref
  coachHints: boolean
}

const KEY = 'lounge-idle-settings-v1'

const DEFAULTS: GameSettings = {
  sound: true,
  music: true,
  reducedMotion: 'system',
  coachHints: true,
}

let cached: GameSettings = { ...DEFAULTS }

export function getSettings(): GameSettings {
  return cached
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      cached = { ...DEFAULTS }
      return cached
    }
    const parsed = JSON.parse(raw) as Partial<GameSettings>
    cached = {
      sound: parsed.sound ?? DEFAULTS.sound,
      music: parsed.music ?? DEFAULTS.music,
      reducedMotion: parsed.reducedMotion ?? DEFAULTS.reducedMotion,
      coachHints: parsed.coachHints ?? DEFAULTS.coachHints,
    }
  } catch {
    cached = { ...DEFAULTS }
  }
  return cached
}

export function saveSettings(next: GameSettings): void {
  cached = { ...next }
  localStorage.setItem(KEY, JSON.stringify(cached))
}

export function patchSettings(patch: Partial<GameSettings>): GameSettings {
  const next = { ...cached, ...patch }
  saveSettings(next)
  return next
}

export function isSoundEnabled(): boolean {
  return cached.sound
}

export function isMusicEnabled(): boolean {
  return cached.music
}

export function isCoachEnabled(): boolean {
  return cached.coachHints
}

export function prefersReducedMotion(): boolean {
  if (cached.reducedMotion === 'reduce') return true
  if (cached.reducedMotion === 'full') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function applySettings(root: HTMLElement): void {
  root.classList.toggle('settings-motion-reduce', cached.reducedMotion === 'reduce')
  root.classList.toggle('settings-motion-full', cached.reducedMotion === 'full')
}
