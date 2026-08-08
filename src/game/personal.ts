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
  videoActionRewards,
  videoShootCost,
  VIDEO_TG_CROSS_PROMO_MS,
  getTelegramGradeDef,
  TELEGRAM_TOOLKIT,
  telegramPassiveTraffic,
  telegramPostCooldownMs,
  telegramPostTrafficBoost,
  telegramToolkitUpgradeCost,
  canShootVideo,
  channelVideoGrade,
  channelTierLabel,
  channelTrafficBonus,
  fameTitle,
  gearUpgradeCost,
  isBlogger,
  minChannelGearLevel,
  videoCooldownMs,
  type ChannelGearId,
  type TelegramToolkitId,
  hasPersonalRepBoost,
  isGuideMastersWinner,
  personalRepBonusLabel,
  scaledPersonalFameGain,
  scaledPersonalMediaGain,
} from '../data/personal'
import { furnitureLevel } from './appeal'
import { ambassadorCount } from './ambassador'
import { getLoungeTier } from '../data/loungeTiers'
import type { GameState } from './state'
import type { ActionResult } from './career'

export { fameTitle, channelTierLabel, minChannelGearLevel, channelVideoGrade, canShootVideo, isBlogger }

export function personalTitle(state: GameState): string {
  if (isBlogger(state.personal.channelLevel) && state.personal.telegramGrade > 0) {
    return 'медиа-лидер'
  }
  if (isBlogger(state.personal.channelLevel)) return 'блогер'
  if (state.personal.telegramGrade > 0) return 'тг-админ'
  if (isGuideMastersWinner(state)) return 'лауреат'
  if (ambassadorCount(state) >= 1) return 'амбассадор'
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
  const telegram = p.telegramGrade > 0
    ? Math.min(14, p.telegramGrade * 2.8 + p.telegramPosts * 0.15)
    : 0
  const furn = furnitureLevel(state)
  const expansions = Object.values(state.expansions).filter(Boolean).length
  const tier = getLoungeTier(state.loungeTier)
  const tierPts = tier.id === 'signature' ? 14 : tier.id === 'hall' ? 7 : 0
  const venue = Math.min(32, furn * 2.2 + expansions * 5 + tierPts)
  const total = fame + media + channel + telegram + venue
  const chance = Math.min(0.78, Math.max(0.06, 0.06 + total * 0.0075))
  return { total, fame, media, channel: channel + telegram, venue, chance }
}

export function awardWinChance(state: GameState): number {
  return awardWinBreakdown(state).chance
}

export function isPersonalUnlocked(state: GameState): boolean {
  return state.phase !== 'employed'
}

export function personalVenueReach(state: GameState): number {
  if (state.phase === 'employed') return 0
  const furn = furnitureLevel(state)
  const expansions = Object.values(state.expansions).filter(Boolean).length
  const tierMult =
    state.loungeTier === 'signature'
      ? 1
      : state.loungeTier === 'hall'
        ? 0.78
        : state.loungeTier === 'nook'
          ? 0.55
          : 0.4
  const raw = (furn / 28) * tierMult + expansions * 0.035
  return Math.min(1, Math.max(0, raw))
}

export function mediaActionReachHint(reach: number): string {
  if (reach >= 0.75) return 'Зал тянет охват — сильнее всплеск гостей от роликов'
  if (reach >= 0.4) return 'Средний охват — меньше гостей с ролика, узн. и мед. копятся'
  return 'Слабый охват — ролик слабее по гостям, узн. и мед. только растут'
}

export function mediaSynergyHint(state: GameState, now = Date.now()): string | null {
  const p = state.personal
  if (!isBlogger(p.channelLevel)) return null
  if (p.telegramGrade > 0 && now < p.videoPromoReadyUntil) {
    const sec = Math.ceil((p.videoPromoReadyUntil - now) / 1000)
    return `Анонс в Telegram · бонус +55% · ${sec}с`
  }
  if (p.telegramGrade <= 0) {
    return 'Заведи Telegram — посты усиливают ролики'
  }
  if (now >= p.videoReadyAt && canShootVideo(p.channelGear)) {
    return 'Сначала ролик → пост в TG за 3 мин (+55%)'
  }
  return null
}

export function videoBoostRemainingSec(state: GameState, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.personal.videoBoostUntil - now) / 1000))
}

export function personalTrafficBonus(state: GameState, now = Date.now()): number {
  if (!isPersonalUnlocked(state)) return 0
  const p = state.personal
  const fameBonus = Math.min(0.28, p.fame * 0.0045)
  const mediaBonus = Math.min(0.22, p.media * 0.0035)
  const channelBonus = channelTrafficBonus(p.channelGear, isBlogger(p.channelLevel))
  let telegramBonus = telegramPassiveTraffic(p.telegramGrade, p.telegramToolkit)
  if (p.telegramBoostUntil > now) {
    telegramBonus += p.telegramBoostAmount
  }
  let eventBonus = 0
  if (p.eventBoostUntil > now) {
    eventBonus = p.eventBoostAmount
  }
  let videoBonus = 0
  if (p.videoBoostUntil > now) {
    videoBonus = p.videoBoostAmount
  }
  return fameBonus + mediaBonus + channelBonus + telegramBonus + eventBonus + videoBonus
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
  state.personal.media += scaledPersonalMediaGain(
    hasPersonalRepBoost(state),
    1,
    state.personal.media,
  )
  return {
    ok: true,
    message: 'Ты стал блогером — прокачай всё оборудование до 1-го грейда, чтобы снять первый ролик',
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
    message: `${def.name} · грейд ${level + 1} — канал прокачан`,
  }
}

export function shootPersonalVideo(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const p = state.personal
  if (!isBlogger(p.channelLevel)) {
    return { ok: false, message: 'Сначала стань блогером' }
  }
  const videoLevel = channelVideoGrade(p.channelGear)
  if (videoLevel < 1) {
    return {
      ok: false,
      message: 'Прокачай всё оборудование до 1-го грейда — камера, монтаж и стиль',
    }
  }
  if (now < p.videoReadyAt) {
    return { ok: false, message: 'Монтаж ещё идёт — подожди' }
  }
  const shootCost = videoShootCost(videoLevel)
  if (state.cash < shootCost) {
    return { ok: false, message: 'Не хватает на съёмку' }
  }
  const reach = personalVenueReach(state)
  const rewards = videoActionRewards(videoLevel, reach, p.telegramGrade)
  const boosted = hasPersonalRepBoost(state)
  const fameGain = scaledPersonalFameGain(boosted, rewards.fame, p.fame)
  const mediaGain = scaledPersonalMediaGain(boosted, rewards.media, p.media)
  state.cash -= shootCost
  p.fame += fameGain
  p.media += mediaGain
  state.cash += rewards.cash
  p.videosPosted += 1
  p.videoBoostAmount = rewards.trafficBoost
  p.videoBoostUntil = now + rewards.boostMs
  p.videoPromoReadyUntil = now + VIDEO_TG_CROSS_PROMO_MS
  p.videoReadyAt = now + videoCooldownMs(videoLevel, p.channelGear.montage)
  const min = Math.round(rewards.boostMs / 60_000)
  const famePart = fameGain > 0 ? ` · +${fameGain} узн.` : ''
  const mediaPart = mediaGain > 0 ? ` · +${mediaGain} мед.` : ''
  const tgPart =
    p.telegramGrade > 0 ? ' · анонсируй в Telegram' : ''
  return {
    ok: true,
    message: `Ролик ${videoLevel}: +${Math.round(rewards.trafficBoost * 100)}% гостей на ${min} мин · +${rewards.cash} ₽${famePart}${mediaPart}${tgPart}`,
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
  const boosted = hasPersonalRepBoost(state)
  const fameGain = scaledPersonalFameGain(boosted, EVENT_FAME_GAIN, state.personal.fame)
  const mediaGain = scaledPersonalMediaGain(boosted, EVENT_MEDIA_GAIN, state.personal.media)
  state.personal.fame += fameGain
  state.personal.media += mediaGain
  state.personal.eventsHeld += 1
  state.personal.eventBoostAmount = EVENT_TRAFFIC_BOOST
  state.personal.eventBoostUntil = now + EVENT_BOOST_MS
  state.personal.eventReadyAt = now + EVENT_COOLDOWN_MS
  return {
    ok: true,
    message: `Вечер у себя: +${Math.round(EVENT_TRAFFIC_BOOST * 100)}% гостей на 2 мин · +${fameGain} узн. · +${mediaGain} мед.`,
  }
}

export function enterGuideMastersAward(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (isGuideMastersWinner(state)) {
    return { ok: false, message: 'Ты уже лауреат «Гайд Мастерс» — повторная победа невозможна' }
  }
  if (now < state.personal.awardReadyAt) {
    return { ok: false, message: 'Заявку можно подать позже' }
  }
  const { chance } = awardWinBreakdown(state)
  state.personal.awardAttempts += 1
  state.personal.awardReadyAt = now + AWARD_COOLDOWN_MS

  const won = Math.random() < chance
  const boostedBefore = hasPersonalRepBoost(state)
  if (won) {
    state.personal.awardWins += 1
    const fameGain = scaledPersonalFameGain(true, AWARD_WIN_FAME, state.personal.fame)
    const mediaGain = scaledPersonalMediaGain(true, AWARD_WIN_MEDIA, state.personal.media)
    state.personal.fame += fameGain
    state.personal.media += mediaGain
    state.flags.celebration = {
      kind: 'award',
      title: 'Guide Master\'s',
      subtitle: `${personalRepBonusLabel()} к узнаваемости и медийности — навсегда`,
    }
    return {
      ok: true,
      message: `Премия «Гайд Мастерс»: ПОБЕДА! +${fameGain} узн. · +${mediaGain} мед. · ${personalRepBonusLabel()} навсегда`,
    }
  }

  const fameGain = scaledPersonalFameGain(boostedBefore, AWARD_LOSE_FAME, state.personal.fame)
  const mediaGain = scaledPersonalMediaGain(boostedBefore, AWARD_LOSE_MEDIA, state.personal.media)
  state.personal.fame += fameGain
  state.personal.media += mediaGain
  return {
    ok: true,
    message: `Гайд Мастерс: в финал не прошли (шанс был ${Math.round(chance * 100)}%), но о тебе написали (+${mediaGain} медийность)`,
  }
}

export function eventBoostRemainingSec(state: GameState, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.personal.eventBoostUntil - now) / 1000))
}

export function hasTelegramChannel(state: GameState): boolean {
  return state.personal.telegramGrade > 0
}

export function telegramBoostRemainingSec(state: GameState, now = Date.now()): number {
  return Math.max(0, Math.ceil((state.personal.telegramBoostUntil - now) / 1000))
}

export function telegramStatusLine(state: GameState, now = Date.now()): string | null {
  const grade = state.personal.telegramGrade
  if (grade <= 0) return null
  const def = getTelegramGradeDef(grade)
  if (!def) return null
  const passive = Math.round(telegramPassiveTraffic(grade, state.personal.telegramToolkit) * 100)
  const boostLeft = telegramBoostRemainingSec(state, now)
  if (boostLeft > 0) {
    return `«${def.title}» · +${Math.round(state.personal.telegramBoostAmount * 100)}% гостей · ${boostLeft}с`
  }
  return `«${def.title}» · +${passive}% гостей постоянно`
}

export function createTelegramChannel(state: GameState): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (hasTelegramChannel(state)) {
    return { ok: false, message: 'Telegram-канал уже есть' }
  }
  const first = getTelegramGradeDef(1)
  if (!first) return { ok: false, message: 'Не удалось создать канал' }
  if (state.cash < first.upgradeCost) {
    return { ok: false, message: 'Не хватает на запуск Telegram-канала' }
  }
  state.cash -= first.upgradeCost
  state.personal.telegramGrade = 1
  const boosted = hasPersonalRepBoost(state)
  const mediaGain = scaledPersonalMediaGain(boosted, 2, state.personal.media)
  const fameGain = scaledPersonalFameGain(boosted, 0, state.personal.fame)
  state.personal.media += mediaGain
  state.personal.fame += fameGain
  return {
    ok: true,
    message: `Канал «${first.title}» запущен · +${mediaGain} медийность · +${Math.round(first.passiveTraffic * 100)}% гостей`,
  }
}

export function upgradeTelegramChannel(state: GameState): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const grade = state.personal.telegramGrade
  if (grade <= 0) {
    return { ok: false, message: 'Сначала создай Telegram-канал' }
  }
  if (grade >= 4) {
    return { ok: false, message: 'Максимальный грейд канала' }
  }
  const next = getTelegramGradeDef(grade + 1)
  if (!next) return { ok: false, message: 'Нет следующего грейда' }
  if (state.cash < next.upgradeCost) {
    return { ok: false, message: 'Не хватает на прокачку канала' }
  }
  state.cash -= next.upgradeCost
  state.personal.telegramGrade = grade + 1
  state.personal.media += scaledPersonalMediaGain(
    hasPersonalRepBoost(state),
    1,
    state.personal.media,
  )
  return {
    ok: true,
    message: `Telegram → «${next.title}» · +${Math.round(next.passiveTraffic * 100)}% гостей постоянно`,
  }
}

export function postTelegram(state: GameState, now = Date.now()): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const grade = state.personal.telegramGrade
  if (grade <= 0) {
    return { ok: false, message: 'Сначала создай Telegram-канал' }
  }
  const def = getTelegramGradeDef(grade)
  if (!def) return { ok: false, message: 'Нет данных канала' }
  if (now < state.personal.telegramPostReadyAt) {
    return { ok: false, message: 'Пост можно опубликовать позже' }
  }
  if (state.cash < def.postCost) {
    return { ok: false, message: 'Не хватает на пост в Telegram' }
  }
  state.cash -= def.postCost
  const crossPromo = now < state.personal.videoPromoReadyUntil
  let boost = telegramPostTrafficBoost(grade, state.personal.telegramToolkit)
  if (crossPromo) {
    boost = Math.min(0.45, boost * 1.55)
    state.personal.videoPromoReadyUntil = 0
  }
  state.personal.telegramPosts += 1
  const boosted = hasPersonalRepBoost(state)
  const fameGain = scaledPersonalFameGain(boosted, def.fameGain, state.personal.fame)
  const mediaGain = scaledPersonalMediaGain(boosted, def.mediaGain, state.personal.media)
  if (fameGain > 0) state.personal.fame += fameGain
  if (mediaGain > 0) state.personal.media += mediaGain
  state.personal.telegramBoostAmount = boost
  state.personal.telegramBoostUntil = now + def.postBoostMs
  state.personal.telegramPostReadyAt = now + telegramPostCooldownMs(grade, state.personal.telegramToolkit)
  const min = Math.round(def.postBoostMs / 60_000)
  const famePart = fameGain > 0 ? ` · +${fameGain} узн.` : ''
  const mediaPart = mediaGain > 0 ? ` · +${mediaGain} мед.` : ''
  return {
    ok: true,
    message: crossPromo
      ? `Анонс ролика в TG · +${Math.round(boost * 100)}% гостей на ${min} мин · связка сработала${famePart}${mediaPart}`
      : `Пост в TG · +${Math.round(boost * 100)}% гостей на ${min} мин${famePart}${mediaPart}`,
  }
}

export function upgradeTelegramToolkit(
  state: GameState,
  id: TelegramToolkitId,
): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  if (!hasTelegramChannel(state)) {
    return { ok: false, message: 'Сначала создай Telegram-канал' }
  }
  const def = TELEGRAM_TOOLKIT.find((t) => t.id === id)
  if (!def) return { ok: false, message: 'Неизвестное улучшение' }
  const level = state.personal.telegramToolkit[id]
  if (level >= def.maxLevel) {
    return { ok: false, message: `${def.name} на максимуме` }
  }
  const cost = telegramToolkitUpgradeCost(def, level)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает на прокачку' }
  }
  state.cash -= cost
  state.personal.telegramToolkit[id] = level + 1
  return {
    ok: true,
    message: `${def.name} · грейд ${level + 1} — канал прокачан`,
  }
}
