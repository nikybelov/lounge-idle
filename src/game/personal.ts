import {
  AWARD_COOLDOWN_MS,
  AWARD_LOSE_FAME,
  AWARD_LOSE_MEDIA,
  AWARD_WIN_FAME,
  AWARD_WIN_MEDIA,
  CHANNEL_GEAR,
  CHANNEL_START_COST,
  EVENT_BOOST_MS,
  EVENT_COOLDOWN_MS,
  EVENT_COST,
  EVENT_FAME_GAIN,
  EVENT_MEDIA_GAIN,
  EVENT_TRAFFIC_BOOST,
  VIDEO_BASE_COST,
  canShootVideo,
  channelTierLabel,
  channelTrafficBonus,
  fameTitle,
  gearUpgradeCost,
  isBlogger,
  minChannelGearLevel,
  videoCooldownMs,
  videoRewards,
  type ChannelGearId,
} from '../data/personal'
import { furnitureLevel } from './appeal'
import { getLoungeTier } from '../data/loungeTiers'
import type { GameState } from './state'
import type { ActionResult } from './career'

export { fameTitle, channelTierLabel, minChannelGearLevel, canShootVideo, isBlogger }

export function personalTitle(state: GameState): string {
  if (isBlogger(state.personal.channelLevel)) return 'блогер'
  return fameTitle(state.personal.fame)
}

export interface AwardWinBreakdown {
  total: number
  fame: number
  media: number
  channel: number
  venue: number
  chance: number
}

/** Сила заявки на «Гайд Мастерс» — от личной репутации, канала и зала */
export function awardWinBreakdown(state: GameState): AwardWinBreakdown {
  const p = state.personal
  const fame = Math.min(35, p.fame * 0.42)
  const media = Math.min(12, p.media * 0.2)
  const gear = p.channelGear.camera + p.channelGear.montage + p.channelGear.branding
  const videoLevel = isBlogger(p.channelLevel) ? minChannelGearLevel(p.channelGear) : 0
  const channel = isBlogger(p.channelLevel)
    ? Math.min(28, videoLevel * 2.8 + gear * 0.8)
    : 0
  const furn = furnitureLevel(state)
  const expansions = Object.values(state.expansions).filter(Boolean).length
  const tier = getLoungeTier(state.loungeTier)
  const tierPts = tier.id === 'signature' ? 14 : tier.id === 'hall' ? 7 : 0
  const venue = Math.min(32, furn * 2.2 + expansions * 5 + tierPts)
  const total = fame + media + channel + venue
  const chance = Math.min(0.78, Math.max(0.06, 0.06 + total * 0.0075))
  return { total, fame, media, channel, venue, chance }
}

export function awardWinChance(state: GameState): number {
  return awardWinBreakdown(state).chance
}

export function isPersonalUnlocked(state: GameState): boolean {
  return state.phase !== 'employed'
}

export function personalTrafficBonus(state: GameState, now = Date.now()): number {
  if (!isPersonalUnlocked(state)) return 0
  const p = state.personal
  const fameBonus = Math.min(0.28, p.fame * 0.0045)
  const mediaBonus = Math.min(0.22, p.media * 0.0035)
  const channelBonus = channelTrafficBonus(p.channelGear, isBlogger(p.channelLevel))
  let eventBonus = 0
  if (p.eventBoostUntil > now) {
    eventBonus = p.eventBoostAmount
  }
  return fameBonus + mediaBonus + channelBonus + eventBonus
}

export function personalStatusLine(state: GameState, now = Date.now()): string {
  const bonus = personalTrafficBonus(state, now)
  if (bonus <= 0.01) return 'Пока без бонуса к потоку гостей'
  return `+${Math.round(bonus * 100)}% к потоку гостей`
}

function gate(state: GameState): ActionResult | null {
  if (!isPersonalUnlocked(state)) {
    return { ok: false, message: 'Личный бренд — после открытия своего зала' }
  }
  return null
}

export function startPersonalChannel(state: GameState): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (isBlogger(state.personal.channelLevel)) {
    return { ok: false, message: 'Ты уже блогер' }
  }
  if (state.cash < CHANNEL_START_COST) {
    return { ok: false, message: 'Не хватает, чтобы стать блогером' }
  }
  state.cash -= CHANNEL_START_COST
  state.personal.channelLevel = 1
  state.personal.media += 2
  return {
    ok: true,
    message: 'Ты стал блогером — прокачай всё оборудование до 1 ур., чтобы снять первый ролик',
  }
}

export function upgradeChannelGear(state: GameState, id: ChannelGearId): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (!isBlogger(state.personal.channelLevel)) {
    return { ok: false, message: 'Сначала стань блогером' }
  }
  const def = CHANNEL_GEAR.find((g) => g.id === id)
  if (!def) return { ok: false, message: 'Нет такого' }
  const level = state.personal.channelGear[id]
  if (level >= def.maxLevel) {
    return { ok: false, message: 'Улучшение на максимуме' }
  }
  const cost = gearUpgradeCost(def, level)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= cost
  state.personal.channelGear[id] = level + 1
  return {
    ok: true,
    message: `${def.name} ур.${level + 1} — канал прокачан`,
  }
}

export function shootPersonalVideo(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const p = state.personal
  if (!isBlogger(p.channelLevel)) {
    return { ok: false, message: 'Сначала стань блогером' }
  }
  const videoLevel = minChannelGearLevel(p.channelGear)
  if (videoLevel < 1) {
    return {
      ok: false,
      message: 'Прокачай всё оборудование до 1 ур. — камера, монтаж и стиль',
    }
  }
  if (now < p.videoReadyAt) {
    return { ok: false, message: 'Монтаж ещё идёт — подожди' }
  }
  if (state.cash < VIDEO_BASE_COST) {
    return { ok: false, message: 'Не хватает на съёмку' }
  }
  state.cash -= VIDEO_BASE_COST
  const rewards = videoRewards(videoLevel)
  p.fame += rewards.fame
  p.media += rewards.media
  state.cash += rewards.cash
  p.videosPosted += 1
  p.videoReadyAt = now + videoCooldownMs(videoLevel, p.channelGear.montage)
  return {
    ok: true,
    message: `Ролик ${videoLevel}-го ур.: +${rewards.fame} узнаваемость · +${rewards.media} медийность · +${rewards.cash} чаевые`,
  }
}

export function holdVenueEvent(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (now < state.personal.eventReadyAt) {
    return { ok: false, message: 'Недавно уже было мероприятие' }
  }
  if (state.cash < EVENT_COST) {
    return { ok: false, message: 'Не хватает на организацию' }
  }
  state.cash -= EVENT_COST
  state.personal.fame += EVENT_FAME_GAIN
  state.personal.media += EVENT_MEDIA_GAIN
  state.personal.eventsHeld += 1
  state.personal.eventBoostAmount = EVENT_TRAFFIC_BOOST
  state.personal.eventBoostUntil = now + EVENT_BOOST_MS
  state.personal.eventReadyAt = now + EVENT_COOLDOWN_MS
  return {
    ok: true,
    message: `Вечер у себя: +${Math.round(EVENT_TRAFFIC_BOOST * 100)}% гостей на 2 мин · +${EVENT_FAME_GAIN} узнаваемость`,
  }
}

export function enterGuideMastersAward(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (now < state.personal.awardReadyAt) {
    return { ok: false, message: 'Заявку можно подать позже' }
  }
  const { chance } = awardWinBreakdown(state)
  state.personal.awardAttempts += 1
  state.personal.awardReadyAt = now + AWARD_COOLDOWN_MS

  const won = Math.random() < chance
  if (won) {
    state.personal.awardWins += 1
    state.personal.fame += AWARD_WIN_FAME
    state.personal.media += AWARD_WIN_MEDIA
    state.flags.celebration = {
      kind: 'rank',
      title: 'Гайд Мастерс — победа!',
      subtitle: `${state.playerName || 'Ты'} в числе лучших. Узнаваемость и поток гостей выросли.`,
    }
    return {
      ok: true,
      message: `Премия «Гайд Мастерс»: ПОБЕДА! +${AWARD_WIN_FAME} узнаваемость · +${AWARD_WIN_MEDIA} медийность`,
    }
  }

  state.personal.fame += AWARD_LOSE_FAME
  state.personal.media += AWARD_LOSE_MEDIA
  return {
    ok: true,
    message: `Гайд Мастерс: в финал не прошли (шанс был ${Math.round(chance * 100)}%), но о тебе написали (+${AWARD_LOSE_MEDIA} медийность)`,
  }
}

export function eventBoostRemainingSec(state: GameState, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.personal.eventBoostUntil - now) / 1000))
}
