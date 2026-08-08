import type { ShopItem } from '../data/shop'
import type { UpgradeId } from '../data/upgrades'
import type { ChannelGearId, TelegramToolkitId } from '../data/personal'
import { CHANNEL_GEAR_GRADE_MAX } from '../data/personal'
import {
  fixedGradeProgress,
  gearGradeTitle,
  gradeDotsHtml,
  gradeLevelTag,
  gradeRoman,
  milestoneProgress,
  MILESTONE_DOTS,
  telegramToolkitGradeTitle,
  upgradeMilestoneName,
} from '../game/grades'

export function renderUpgradeGradeRow(
  id: UpgradeId,
  level: number,
  blurb: string,
): { title: string; sub: string; dots: string } {
  if (level <= 0) {
    return { title: '', sub: blurb, dots: gradeDotsHtml(0) }
  }
  const { dots } = milestoneProgress(level)
  const milestone = upgradeMilestoneName(id, level)
  return {
    title: `${milestone} · ${gradeRoman(milestoneProgress(level).milestone)}`,
    sub: blurb,
    dots: gradeDotsHtml(dots, MILESTONE_DOTS),
  }
}

export function renderShopGradeRow(
  item: ShopItem,
  level: number,
  gradeTitle: string | undefined,
  blurb: string,
): { title: string; sub: string; dots: string; meta: string } {
  const max = item.grades.length
  const { grade } = fixedGradeProgress(level, max)
  const title =
    level > 0 && gradeTitle ? `${item.name} · ${gradeTitle}` : item.name
  return {
    title,
    sub: blurb,
    dots: gradeDotsHtml(level > 0 ? grade : 0, max),
    meta: level >= max ? '★ макс.' : level > 0 ? `грейд ${grade}` : '',
  }
}

export function renderGearGradeRow(
  id: ChannelGearId,
  name: string,
  level: number,
  maxLevel: number,
  blurb: string,
): { title: string; sub: string; dots: string; meta: string } {
  const { grade } = fixedGradeProgress(level, maxLevel, CHANNEL_GEAR_GRADE_MAX)
  const gradeTitle = gearGradeTitle(id, level, maxLevel)
  return {
    title: level > 0 ? `${name} · ${gradeTitle}` : name,
    sub: blurb,
    dots: gradeDotsHtml(level > 0 ? grade : 0, CHANNEL_GEAR_GRADE_MAX),
    meta: level >= maxLevel ? '★ макс.' : level > 0 ? `${grade}/${CHANNEL_GEAR_GRADE_MAX}` : '',
  }
}

export function renderTelegramToolkitRow(
  id: TelegramToolkitId,
  name: string,
  level: number,
  maxLevel: number,
  blurb: string,
): { title: string; sub: string; dots: string; meta: string } {
  const { grade } = fixedGradeProgress(level, maxLevel)
  const gradeTitle = telegramToolkitGradeTitle(id, level, maxLevel)
  return {
    title: level > 0 ? `${name} · ${gradeTitle}` : name,
    sub: blurb,
    dots: gradeDotsHtml(level > 0 ? grade : 0),
    meta: level >= maxLevel ? '★ макс.' : level > 0 ? `грейд ${grade}` : '',
  }
}

export { gradeDotsHtml, gradeLevelTag, gradeRoman }
