import {
  CAREER_MILESTONES,
  SECONDS_PER_WORK_DAY,
  displayWorkDay,
  workDayProgressRatio,
  type CareerMilestoneId,
} from '../data/careerTrack'
import type { GameState } from './state'

export { displayWorkDay, workDayProgressRatio, SECONDS_PER_WORK_DAY }

export function tickWorkDays(state: GameState, dtSec: number): boolean {
  if (!state.onboarded) return false
  state.career.totalActiveSec += dtSec
  state.career.dayProgressSec += dtSec
  let advanced = false
  while (state.career.dayProgressSec >= SECONDS_PER_WORK_DAY) {
    state.career.dayProgressSec -= SECONDS_PER_WORK_DAY
    state.career.workDays += 1
    advanced = true
  }
  return advanced
}

/** Записывает день, когда впервые достигнута веха */
export function syncCareerMilestones(state: GameState): CareerMilestoneId[] {
  if (!state.onboarded) return []
  const day = displayWorkDay(state.career.workDays)
  const fresh: CareerMilestoneId[] = []
  for (const def of CAREER_MILESTONES) {
    if (state.career.milestones[def.id]) continue
    if (!def.check(state)) continue
    state.career.milestones[def.id] = day
    fresh.push(def.id)
  }
  return fresh
}

export function workDayHudLine(state: GameState): string {
  if (!state.onboarded) return ''
  const day = displayWorkDay(state.career.workDays)
  return `День ${day}`
}

/** Игровые часы смены: 08:00 → 20:00 за один рабочий день */
const SHIFT_START_MIN = 8 * 60
const SHIFT_DURATION_MIN = 12 * 60

export interface WorkDayGameClock {
  day: number
  hours: number
  minutes: number
  seconds: number
  ratio: number
}

export function workDayGameClock(state: GameState): WorkDayGameClock {
  const ratio = workDayProgressRatio(state.career.dayProgressSec)
  const shiftSec = SHIFT_START_MIN * 60 + ratio * SHIFT_DURATION_MIN * 60
  return {
    day: displayWorkDay(state.career.workDays),
    hours: Math.floor(shiftSec / 3600) % 24,
    minutes: Math.floor((shiftSec % 3600) / 60),
    seconds: Math.floor(shiftSec % 60),
    ratio,
  }
}

export function formatGameClock(hours: number, minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}`
}
