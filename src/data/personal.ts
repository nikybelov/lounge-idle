/** Личное развитие игрока — медийность и узнаваемость */

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

export const CHANNEL_GEAR: ChannelGearDef[] = [
  {
    id: 'camera',
    name: 'Свет и камера',
    blurb: 'Без камеры ролик не снять — все три ветки на одном ур.',
    baseCost: 320,
    costMult: 1.26,
    maxLevel: 15,
  },
  {
    id: 'montage',
    name: 'Монтаж и монтажка',
    blurb: 'Монтаж быстрее — короче перезарядка между роликами',
    baseCost: 260,
    costMult: 1.24,
    maxLevel: 12,
  },
  {
    id: 'branding',
    name: 'Обложки и стиль',
    blurb: 'Узнаваемый визуал — постоянный приток гостей',
    baseCost: 380,
    costMult: 1.28,
    maxLevel: 12,
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
export const VIDEO_COOLDOWN_BASE_MS = 42_000
export const VIDEO_COOLDOWN_MIN_MS = 16_000

export const EVENT_COST = 2200
export const EVENT_COOLDOWN_MS = 180_000
export const EVENT_BOOST_MS = 120_000
export const EVENT_TRAFFIC_BOOST = 0.42
export const EVENT_FAME_GAIN = 3
export const EVENT_MEDIA_GAIN = 2

export const AWARD_COOLDOWN_MS = 240_000
export const AWARD_WIN_FAME = 14
export const AWARD_WIN_MEDIA = 11
export const AWARD_LOSE_FAME = 2
export const AWARD_LOSE_MEDIA = 5

export interface ChannelGearLevels {
  camera: number
  montage: number
  branding: number
}

/** Минимальный ур. среди всего оборудования = ур. доступного ролика */
export function minChannelGearLevel(gear: ChannelGearLevels): number {
  return Math.min(gear.camera, gear.montage, gear.branding)
}

export function isBlogger(channelLevel: number): boolean {
  return channelLevel >= 1
}

export function canShootVideo(gear: ChannelGearLevels): boolean {
  return minChannelGearLevel(gear) >= 1
}

export function videoTierRequirementHint(gear: ChannelGearLevels): string {
  const min = minChannelGearLevel(gear)
  const target = min < 1 ? 1 : min + 1
  const missing = CHANNEL_GEAR.filter((g) => gear[g.id] < target)
  if (min < 1) {
    return 'Ролик 1-го ур. — когда всё оборудование на 1-м ур.'
  }
  if (missing.length === 0) {
    return `Снимаешь ролики ${min}-го ур. · для ${target}-го подтяни всё до ${target}`
  }
  const names = missing.map((g) => g.name.split(' ')[0].toLowerCase()).join(', ')
  return `Для ролика ${target}-го ур. подтяни: ${names} → ${target}`
}

export function videoCooldownMs(
  videoLevel: number,
  montageLevel: number,
): number {
  const montageCut = montageLevel * 0.04
  const levelCut = Math.min(0.12, Math.max(0, videoLevel - 1) * 0.015)
  const mult = Math.max(0.38, 1 - montageCut - levelCut)
  return Math.max(VIDEO_COOLDOWN_MIN_MS, Math.round(VIDEO_COOLDOWN_BASE_MS * mult))
}

export function videoRewards(
  videoLevel: number,
): { fame: number; media: number; cash: number } {
  const mult = 1 + (videoLevel - 1) * 0.22
  return {
    fame: Math.max(1, Math.round(2 * mult)),
    media: Math.max(1, Math.round(3 * mult)),
    cash: Math.max(5, Math.round(35 * mult)),
  }
}

/** Постоянный бонус к потоку от прокачки канала */
export function channelTrafficBonus(
  gear: ChannelGearLevels,
  blogger: boolean,
): number {
  if (!blogger) return 0
  const videoLevel = minChannelGearLevel(gear)
  const fromLevel = Math.min(0.18, Math.max(0, videoLevel - 1) * 0.012)
  const fromBranding = Math.min(0.2, gear.branding * 0.016)
  return fromLevel + fromBranding
}

export function fameTitle(fame: number): string {
  if (fame < 8) return 'новичок'
  if (fame < 22) return 'свой в зале'
  if (fame < 45) return 'лицо района'
  if (fame < 75) return 'локальный блогер'
  return 'легенда дыма'
}
