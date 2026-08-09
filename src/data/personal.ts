/** Личное развитие игрока — медийность и узнаваемость */

import type { GameState } from '../game/state'
import { isActiveAmbassador } from './ambassador'

export type ChannelGearId = 'camera' | 'montage' | 'branding'

export interface ChannelGearDef {
  id: ChannelGearId
  name: string
  blurb: string
  baseCost: number
  costMult: number
  maxLevel: number
}

export const CHANNEL_START_COST = 650

/** Этапов прокачки в каждой ветке оборудования блога — 1 покупка = 1 точка */
export const CHANNEL_GEAR_GRADE_MAX = 8

/** Названия этапов 1–8 для оборудования канала */
export const GEAR_GRADE_TITLES: Record<ChannelGearId, string[]> = {
  camera: ['Телефон', 'Вебка', 'Кольцевой свет', 'Зеркалка', 'Стаб', 'Софтбокс', 'Кино', 'Студия'],
  montage: ['Базовый', 'CapCut', 'Шаблоны', 'Звук', 'Pro', 'LUT-пак', 'Цвет', 'Студия монтажа'],
  branding: ['Черновик', 'Стиль', 'Шрифты', 'Обложки', 'Брендбук', 'Лейблы', 'Узнаваемость', 'Медиа-бренд'],
}

export const CHANNEL_GEAR: ChannelGearDef[] = [
  {
    id: 'camera',
    name: 'Свет и камера',
    blurb: 'Картинка лучше — сильнее ролики и грейд съёмки',
    baseCost: 320,
    costMult: 1.26,
    maxLevel: CHANNEL_GEAR_GRADE_MAX,
  },
  {
    id: 'montage',
    name: 'Монтаж и софт',
    blurb: 'Монтаж быстрее — короче перезарядка между роликами',
    baseCost: 260,
    costMult: 1.24,
    maxLevel: CHANNEL_GEAR_GRADE_MAX,
  },
  {
    id: 'branding',
    name: 'Обложки и стиль',
    blurb: 'Узнаваемый визуал — постоянный приток гостей',
    baseCost: 380,
    costMult: 1.28,
    maxLevel: CHANNEL_GEAR_GRADE_MAX,
  },
]

export function gearUpgradeCost(def: ChannelGearDef, currentLevel: number): number {
  return Math.max(1, Math.floor(def.baseCost * Math.pow(def.costMult, currentLevel)))
}

export function channelTierLabel(level: number): string {
  if (level < 2) return 'старт'
  if (level < 5) return 'растёт'
  if (level < 10) return 'на хайпе'
  if (level < 18) return 'топ локалки'
  return 'медиа-империя'
}

export const VIDEO_BASE_COST = 120
export const VIDEO_COOLDOWN_BASE_MS = 62_000
export const VIDEO_COOLDOWN_MIN_MS = 22_000
/** Окно после ролика: пост в Telegram даёт бонус к охвату */
export const VIDEO_TG_CROSS_PROMO_MS = 180_000

export const EVENT_COST = 2200
export const EVENT_COOLDOWN_MS = 210_000
export const EVENT_BOOST_MS = 120_000
export const EVENT_TRAFFIC_BOOST = 0.42
export const EVENT_FAME_GAIN = 2
export const EVENT_MEDIA_GAIN = 1

export const AWARD_COOLDOWN_MS = 240_000
export const AWARD_WIN_FAME = 14
export const AWARD_WIN_MEDIA = 11
export const AWARD_LOSE_FAME = 1
export const AWARD_LOSE_MEDIA = 3

/** Бонус к приросту узнаваемости и медийности — амбассадор или лауреат «Гайд Мастерс» */
export const PERSONAL_REP_FAME_MULT = 1.25
export const PERSONAL_REP_MEDIA_MULT = 1.25

export function isGuideMastersWinner(state: GameState): boolean {
  return state.personal.awardWins >= 1
}

export function hasPersonalRepBoost(state: GameState): boolean {
  return isActiveAmbassador(state) || isGuideMastersWinner(state)
}

/** Мягче прирост на высоких значениях — шкала не падает, только замедляется */
function personalStatGainTaper(current: number): number {
  if (current < 28) return 1
  if (current < 48) return 0.88
  if (current < 72) return 0.72
  return 0.55
}

export function scaledPersonalFameGain(
  boosted: boolean,
  base: number,
  currentFame = 0,
): number {
  if (base <= 0) return 0
  let gain = boosted ? Math.max(base, Math.round(base * PERSONAL_REP_FAME_MULT)) : base
  return Math.max(0, Math.round(gain * personalStatGainTaper(currentFame)))
}

export function scaledPersonalMediaGain(
  boosted: boolean,
  base: number,
  currentMedia = 0,
): number {
  if (base <= 0) return 0
  let gain = boosted ? Math.max(base, Math.round(base * PERSONAL_REP_MEDIA_MULT)) : base
  return Math.max(0, Math.round(gain * personalStatGainTaper(currentMedia)))
}

export function personalRepBonusLabel(): string {
  return `×${PERSONAL_REP_FAME_MULT.toFixed(2)} узн. и мед.`
}

export interface ChannelGearLevels {
  camera: number
  montage: number
  branding: number
}

/** Минимальный ур. среди всего оборудования (для бонусов охвата) */
export function minChannelGearLevel(gear: ChannelGearLevels): number {
  return Math.min(gear.camera, gear.montage, gear.branding)
}

/** Этап 1–8 для одной ветки — уровень = точка на шкале */
export function channelGearVisualGrade(level: number): number {
  if (level <= 0) return 0
  return Math.min(CHANNEL_GEAR_GRADE_MAX, level)
}

/** Грейд ролика = минимальный этап среди камеры, монтажа и стиля */
export function channelVideoGrade(gear: ChannelGearLevels): number {
  let minGrade = CHANNEL_GEAR_GRADE_MAX
  let started = false
  for (const def of CHANNEL_GEAR) {
    const level = gear[def.id]
    if (level <= 0) return 0
    started = true
    minGrade = Math.min(minGrade, channelGearVisualGrade(level))
  }
  return started ? minGrade : 0
}

export function isBlogger(channelLevel: number): boolean {
  return channelLevel >= 1
}

export function canShootVideo(gear: ChannelGearLevels): boolean {
  return channelVideoGrade(gear) >= 1
}

export function videoTierRequirementHint(gear: ChannelGearLevels): string {
  const grade = channelVideoGrade(gear)
  if (grade < 1) {
    return 'Ролик 1-го грейда — прокачай всё оборудование хотя бы до 1-го грейда'
  }
  if (grade >= CHANNEL_GEAR_GRADE_MAX) {
    return `Снимаешь ролики ${grade}-го грейда · оборудование на максимуме`
  }
  const target = grade + 1
  const missing = CHANNEL_GEAR.filter(
    (def) => channelGearVisualGrade(gear[def.id]) < target,
  )
  const names = missing
    .map((def) => {
      const now = channelGearVisualGrade(gear[def.id])
      const short = def.name.split(' ')[0] ?? def.name
      return `${short} (${now}→${target})`
    })
    .join(', ')
  return `Снимаешь ролики ${grade}-го грейда · для ${target}-го подтяни: ${names}`
}

export function videoCooldownMs(
  videoLevel: number,
  montageLevel: number,
): number {
  const montageCut = montageLevel * 0.06
  const levelCut = Math.min(0.12, Math.max(0, videoLevel - 1) * 0.015)
  const mult = Math.max(0.38, 1 - montageCut - levelCut)
  return Math.max(VIDEO_COOLDOWN_MIN_MS, Math.round(VIDEO_COOLDOWN_BASE_MS * mult))
}

export function videoShootCost(videoLevel: number): number {
  return VIDEO_BASE_COST + Math.max(0, videoLevel - 1) * 40
}

export interface MediaActionRewards {
  fame: number
  media: number
  cash: number
  trafficBoost: number
  boostMs: number
}

/** Награда за ролик: всплеск гостей + чаевые; узн./мед. — накопительные, только вверх */
export function videoActionRewards(
  videoLevel: number,
  venueReach: number,
  telegramGrade = 0,
): MediaActionRewards {
  const gradeMult = 1 + (videoLevel - 1) * 0.07
  const reach = Math.min(1, Math.max(0, venueReach))
  const reachMult = 0.65 + reach * 0.35
  const tgTrafficMult = 1 + telegramGrade * 0.04

  const trafficBoost = Math.min(0.34, (0.04 + videoLevel * 0.026) * tgTrafficMult)
  const boostMs = 80_000 + videoLevel * 10_000

  const fame = Math.max(0, Math.round((0.18 + videoLevel * 0.065) * gradeMult * reachMult))
  const media = Math.max(0, Math.round((0.14 + videoLevel * 0.04) * gradeMult * reachMult))
  const cash = Math.max(5, Math.round(16 * gradeMult * (0.3 + reach * 0.7)))

  return { fame, media, cash, trafficBoost, boostMs }
}

/** @deprecated preview helper — use videoActionRewards with venue reach */
export function videoRewards(videoLevel: number): { fame: number; media: number; cash: number } {
  const r = videoActionRewards(videoLevel, 1)
  return { fame: r.fame, media: r.media, cash: r.cash }
}

/** Постоянный бонус к потоку от прокачки канала */
export function channelTrafficBonus(
  gear: ChannelGearLevels,
  blogger: boolean,
): number {
  if (!blogger) return 0
  const videoLevel = minChannelGearLevel(gear)
  const fromLevel = Math.min(0.18, Math.max(0, videoLevel - 1) * 0.026)
  const fromBranding = Math.min(0.2, gear.branding * 0.025)
  return fromLevel + fromBranding
}

export function fameTitle(fame: number): string {
  if (fame < 8) return 'новичок'
  if (fame < 22) return 'свой в лаунже'
  if (fame < 45) return 'лицо района'
  if (fame < 75) return 'локальный блогер'
  return 'легенда дыма'
}

/** Telegram-канал — отдельно от видеоблога */

export interface TelegramGradeDef {
  grade: number
  title: string
  /** Создание (грейд 1) или апгрейд до этого грейда */
  upgradeCost: number
  /** Стоимость поста */
  postCost: number
  fameGain: number
  mediaGain: number
  /** Постоянный бонус к потоку гостей */
  passiveTraffic: number
  /** Буст от поста */
  postTrafficBoost: number
  postBoostMs: number
  postCooldownMs: number
}

export const TELEGRAM_GRADES: TelegramGradeDef[] = [
  {
    grade: 1,
    title: 'Чат друзей',
    upgradeCost: 420,
    postCost: 70,
    fameGain: 0,
    mediaGain: 1,
    passiveTraffic: 0.018,
    postTrafficBoost: 0.09,
    postBoostMs: 90_000,
    postCooldownMs: 180_000,
  },
  {
    grade: 2,
    title: 'Канал района',
    upgradeCost: 1500,
    postCost: 120,
    fameGain: 0,
    mediaGain: 1,
    passiveTraffic: 0.035,
    postTrafficBoost: 0.14,
    postBoostMs: 110_000,
    postCooldownMs: 165_000,
  },
  {
    grade: 3,
    title: 'Lounge digest',
    upgradeCost: 4800,
    postCost: 200,
    fameGain: 1,
    mediaGain: 1,
    passiveTraffic: 0.055,
    postTrafficBoost: 0.2,
    postBoostMs: 130_000,
    postCooldownMs: 140_000,
  },
  {
    grade: 4,
    title: 'Медиа-хаб',
    upgradeCost: 14_000,
    postCost: 320,
    fameGain: 1,
    mediaGain: 2,
    passiveTraffic: 0.08,
    postTrafficBoost: 0.28,
    postBoostMs: 150_000,
    postCooldownMs: 120_000,
  },
]

export function getTelegramGradeDef(grade: number): TelegramGradeDef | undefined {
  return TELEGRAM_GRADES.find((g) => g.grade === grade)
}

export function telegramPassiveTraffic(grade: number, toolkit?: TelegramToolkitLevels): number {
  const base = getTelegramGradeDef(grade)?.passiveTraffic ?? 0
  if (!toolkit) return base
  const visualBonus = Math.min(0.024, toolkit.visual * 0.006)
  return base + visualBonus
}

/** Инструменты Telegram — прокачка после создания канала */

export type TelegramToolkitId = 'content' | 'visual' | 'reach'

export interface TelegramToolkitDef {
  id: TelegramToolkitId
  name: string
  blurb: string
  baseCost: number
  costMult: number
  maxLevel: number
}

export interface TelegramToolkitLevels {
  content: number
  visual: number
  reach: number
}

export const TELEGRAM_TOOLKIT_GRADE_TITLES: Record<TelegramToolkitId, string[]> = {
  content: ['Заметки', 'Рубрики', 'Редакция', 'Медиа-студия'],
  visual: ['Черновик', 'Стиль', 'Брендинг', 'Премиум'],
  reach: ['Друзья', 'Реклама', 'Бот', 'Сеть'],
}

export const TELEGRAM_TOOLKIT: TelegramToolkitDef[] = [
  {
    id: 'content',
    name: 'Контент-план',
    blurb: 'Сильнее посты — больше узнаваемости и медийности',
    baseCost: 190,
    costMult: 1.23,
    maxLevel: 4,
  },
  {
    id: 'visual',
    name: 'Оформление',
    blurb: 'Красивый канал — постояннее приток гостей',
    baseCost: 240,
    costMult: 1.25,
    maxLevel: 4,
  },
  {
    id: 'reach',
    name: 'Продвижение',
    blurb: 'Шире охват — сильнее всплеск гостей от поста',
    baseCost: 300,
    costMult: 1.27,
    maxLevel: 4,
  },
]

export function telegramToolkitUpgradeCost(def: TelegramToolkitDef, currentLevel: number): number {
  return Math.max(1, Math.floor(def.baseCost * Math.pow(def.costMult, currentLevel)))
}

export function telegramPostBoostPreview(
  grade: number,
  toolkit: TelegramToolkitLevels,
  crossPromo = false,
): { trafficBoost: number; boostMs: number; cooldownMs: number; crossPromo: boolean } {
  const def = getTelegramGradeDef(grade)
  if (!def) return { trafficBoost: 0, boostMs: 0, cooldownMs: 0, crossPromo: false }
  let trafficBoost = telegramPostTrafficBoost(grade, toolkit)
  if (crossPromo) trafficBoost = Math.min(0.45, trafficBoost * 1.55)
  return {
    trafficBoost,
    boostMs: def.postBoostMs,
    cooldownMs: telegramPostCooldownMs(grade, toolkit),
    crossPromo,
  }
}

/** @deprecated — посты больше не дают постоянную узнаваемость */
export function telegramPostRewards(
  _grade: number,
  _toolkit: TelegramToolkitLevels,
): { fame: number; media: number } {
  return { fame: 0, media: 0 }
}

export function telegramPostTrafficBoost(grade: number, toolkit: TelegramToolkitLevels): number {
  const def = getTelegramGradeDef(grade)
  if (!def) return 0
  const reachBonus = Math.min(0.12, toolkit.reach * 0.03)
  return def.postTrafficBoost + reachBonus
}

export function telegramPostCooldownMs(grade: number, toolkit: TelegramToolkitLevels): number {
  const def = getTelegramGradeDef(grade)
  if (!def) return 0
  const reachCut = Math.min(0.35, toolkit.reach * 0.0875)
  return Math.max(45_000, Math.round(def.postCooldownMs * (1 - reachCut)))
}
