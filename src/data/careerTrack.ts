import { achievementProgress } from './achievements'
import { branchCount } from '../game/empire'
import { minChannelGearLevel } from './personal'
import { rankDef, rankIndex } from './ranks'
import type { GameState } from '../game/state'

/** Активных секунд в игре = один рабочий день (вкладка открыта) */
export const SECONDS_PER_WORK_DAY = 180

export type CareerMilestoneId =
  | 'open_lounge'
  | 'dual_worker'
  | 'own_boss'
  | 'signature_hall'
  | 'empire_start'
  | 'full_network'
  | 'blogger'
  | 'rank_master'
  | 'rank_senior'

export interface CareerScorePart {
  label: string
  points: number
}

/** Раскладка очков карьеры для подсказки в UI */
export function careerScoreBreakdown(state: GameState): CareerScorePart[] {
  const parts: CareerScorePart[] = []
  const { done } = achievementProgress(state)
  if (done > 0) parts.push({ label: `Трофеи · ${done} шт.`, points: done * 15 })
  if (state.phase === 'dual') parts.push({ label: 'Смена + свой зал', points: 40 })
  if (state.phase === 'ownOnly') parts.push({ label: 'Только свой бизнес', points: 70 })
  if (state.loungeTier === 'nook') parts.push({ label: 'Тариф «Угол»', points: 20 })
  if (state.loungeTier === 'hall') parts.push({ label: 'Тариф «Зал»', points: 45 })
  if (state.loungeTier === 'signature') parts.push({ label: 'Авторский зал', points: 80 })
  const branches = branchCount(state)
  if (branches > 0) parts.push({ label: `Филиалы · ${branches}`, points: branches * 30 })
  const famePts = Math.min(40, Math.round(state.personal.fame * 0.5))
  if (famePts > 0) parts.push({ label: 'Узнаваемость', points: famePts })
  const videoLvl = minChannelGearLevel(state.personal.channelGear)
  if (videoLvl > 0) parts.push({ label: `Ролики · ${videoLvl} ур.`, points: videoLvl * 5 })
  const rankPts = rankIndex(state.jobRank) * 12
  if (rankPts > 0) parts.push({ label: rankDef(state.jobRank).title, points: rankPts })
  return parts
}

/** Сводный «вес» карьеры для таблицы лидеров */
export function careerScore(state: GameState): number {
  const { done } = achievementProgress(state)
  let score = done * 15
  if (state.phase === 'dual') score += 40
  if (state.phase === 'ownOnly') score += 70
  if (state.loungeTier === 'nook') score += 20
  if (state.loungeTier === 'hall') score += 45
  if (state.loungeTier === 'signature') score += 80
  score += branchCount(state) * 30
  score += Math.min(40, state.personal.fame * 0.5)
  score += minChannelGearLevel(state.personal.channelGear) * 5
  score += rankIndex(state.jobRank) * 12
  return Math.round(score)
}

export function displayWorkDay(workDays: number): number {
  return workDays + 1
}

export function workDayProgressRatio(dayProgressSec: number): number {
  return Math.min(1, dayProgressSec / SECONDS_PER_WORK_DAY)
}
