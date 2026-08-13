import {
  SECONDS_PER_WORK_DAY,
  displayWorkDay,
  workDayProgressRatio,
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

export type WeekdayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type ShiftPeriod = 'morning' | 'day' | 'evening'

export interface WeekdayDef {
  id: WeekdayId
  short: string
  name: string
  /** Множитель потока гостей на весь день */
  traffic: number
}

/** День 1 смены = понедельник. Пт–Сб люднее, следить за часами не нужно. */
export const WEEKDAYS: readonly WeekdayDef[] = [
  { id: 'mon', short: 'Пн', name: 'понедельник', traffic: 1 },
  { id: 'tue', short: 'Вт', name: 'вторник', traffic: 1 },
  { id: 'wed', short: 'Ср', name: 'среда', traffic: 1 },
  { id: 'thu', short: 'Чт', name: 'четверг', traffic: 1 },
  { id: 'fri', short: 'Пт', name: 'пятница', traffic: 1.22 },
  { id: 'sat', short: 'Сб', name: 'суббота', traffic: 1.28 },
  { id: 'sun', short: 'Вс', name: 'воскресенье', traffic: 1 },
]

export function weekdayOf(state: GameState): WeekdayDef {
  const i = ((state.career.workDays % 7) + 7) % 7
  return WEEKDAYS[i] ?? WEEKDAYS[0]!
}

export function isWeekend(state: GameState): boolean {
  const id = weekdayOf(state).id
  return id === 'fri' || id === 'sat'
}

export function weekdayTrafficMult(state: GameState): number {
  return weekdayOf(state).traffic
}

export function shiftPeriodOf(state: GameState): ShiftPeriod {
  const hours = workDayGameClock(state).hours
  if (hours < 12) return 'morning'
  if (hours < 16) return 'day'
  return 'evening'
}

export function shiftPeriodLabel(period: ShiftPeriod): string {
  if (period === 'morning') return 'утро'
  if (period === 'evening') return 'вечер'
  return 'день'
}
