import type { UpgradeId } from '../data/upgrades'
import { UPGRADE_MILESTONE_NAMES } from '../data/upgrades'
import type { ChannelGearId, TelegramToolkitId } from '../data/personal'
import { GEAR_GRADE_TITLES, TELEGRAM_TOOLKIT_GRADE_TITLES, CHANNEL_GEAR_GRADE_MAX } from '../data/personal'

export const MILESTONE_STEP = 5
/** Точек прогресса внутри этапа мебели — совпадает с MILESTONE_STEP */
export const MILESTONE_DOTS = MILESTONE_STEP
/** Максимум грейдов в фиксированных ветках (персонал, акции, инструменты…) */
export const FIXED_GRADE_MAX = 4

/** Прогресс внутри этапа для бесконечных уровней (мебель): каждые 5 ур. — новый этап, 5 точек. */
export function milestoneProgress(level: number, step = MILESTONE_STEP): {
  milestone: number
  dots: number
} {
  if (level <= 0) return { milestone: 0, dots: 0 }
  const milestone = Math.floor((level - 1) / step) + 1
  const dots = ((level - 1) % step) + 1
  return { milestone, dots }
}

/** Грейд 1–4 для систем с потолком (инструменты, оборудование канала). */
export function fixedGradeProgress(
  level: number,
  maxLevel: number,
  maxGrades = FIXED_GRADE_MAX,
): { grade: number; dots: number } {
  if (level <= 0) return { grade: 0, dots: 0 }
  if (maxLevel <= maxGrades) {
    return { grade: Math.min(maxGrades, level), dots: Math.min(maxGrades, level) }
  }
  const levelsPerGrade = maxLevel / maxGrades
  const grade = Math.min(maxGrades, Math.ceil(level / levelsPerGrade))
  const gradeStart = Math.floor((grade - 1) * levelsPerGrade)
  const gradeEnd = Math.min(maxLevel, Math.floor(grade * levelsPerGrade))
  const span = Math.max(1, gradeEnd - gradeStart)
  const offset = level - gradeStart
  const dots = Math.min(maxGrades, Math.max(1, Math.ceil((offset / span) * maxGrades)))
  return { grade, dots }
}

export function upgradeMilestoneName(id: UpgradeId, level: number): string {
  if (level <= 0) return ''
  const { milestone } = milestoneProgress(level)
  const names = UPGRADE_MILESTONE_NAMES[id]
  return names[milestone - 1] ?? `Этап ${milestone}`
}

export function gearGradeTitle(id: ChannelGearId, level: number, maxLevel: number): string {
  if (level <= 0) return ''
  const { grade } = fixedGradeProgress(level, maxLevel, CHANNEL_GEAR_GRADE_MAX)
  const titles = GEAR_GRADE_TITLES[id]
  return titles[grade - 1] ?? `Этап ${grade}`
}

export function telegramToolkitGradeTitle(
  id: TelegramToolkitId,
  level: number,
  maxLevel: number,
): string {
  if (level <= 0) return ''
  const { grade } = fixedGradeProgress(level, maxLevel)
  const titles = TELEGRAM_TOOLKIT_GRADE_TITLES[id]
  return titles[grade - 1] ?? `Грейд ${grade}`
}

export function gradeDotsHtml(
  filled: number,
  max = FIXED_GRADE_MAX,
  label?: string,
): string {
  const safe = Math.max(0, Math.min(max, filled))
  const dots = Array.from({ length: max }, (_, i) => {
    const on = i + 1 <= safe
    return `<span class="grade-dot ${on ? 'is-on' : ''}"></span>`
  }).join('')
  const aria = label ?? `Грейд ${safe} из ${max}`
  return `<div class="grade-dots" aria-label="${aria}">${dots}</div>`
}

export function gradeLevelTag(level: number): string {
  if (level <= 0) return ''
  return `<span class="grade-level-tag">ур.${level}</span>`
}

export function gradeRoman(n: number): string {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return map[n - 1] ?? String(n)
}
