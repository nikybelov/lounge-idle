import {
  canBrowseLoungeOffer,
  canDoJobTasks,
  canQuitJob,
  jobReputationPerSec,
  jobTaskCooldownMult,
  jobTaskPayMult,
  minOpenLoungeCost,
  quitIncomeThreshold,
  shopItemCost,
  syncLoungeOfferUnlock,
} from '../game/career'
import {
  loungeTierCost,
  scaledExpansionCost,
  scaledStaffHireCost,
  scaledUpgradeCost,
  getDifficulty,
  resolveDifficulty,
} from '../game/difficulty'
import {
  branchCount,
  canBrowseEmpire,
  empireIncomeMult,
  empireTeaser,
  networkLabel,
} from '../game/empire'
import {
  formatMoney,
  isUpgradeUnlocked,
  loungeClickPower,
  loungeGrossIncomePerSec,
  loungeIncomePerSec,
  staffPayrollPerSec,
  staffPayrollShare,
  upgradeCost,
} from '../game/economy'
import { pluralRuCount } from '../game/ru'
import {
  hiredStaffCount,
  maxTeamHeadcount,
  staffMembers,
} from '../game/staff'
import {
  STAFF_ROLES,
  extraStaffHireCost,
  getStaffGradeDef,
  maxStaffForRole,
  type StaffId,
} from '../data/staff'
import type { GameState } from '../game/state'
import {
  JOB_TASKS,
  isTaskUnlocked,
  taskUnlockHint,
} from '../data/tasks'
import {
  SHOP_ITEMS,
  bareHandsStillPossible,
  BARE_HANDS_WASH_NEED,
  canUpgradeShopItem,
  getShopGrade,
  nextShopGrade,
  shopEffectLabel,
  shopLevel,
  shopMaxLevel,
  shopUnlockHint,
  taskCooldownMs,
  taskPay,
  type ShopItemId,
} from '../data/shop'
import {
  LOUNGE_SHOP_LINES,
  getLoungeShopGrade,
  getLoungeShopLine,
  loungeShopLevel,
  loungeShopMaxLevel,
  nextLoungeShopGrade,
  type LoungeShopId,
} from '../data/loungeShop'
import { loungeShopTaskCdMult } from '../game/loungeShop'
import {
  nextRank,
  promoteProgress,
  promoteProgressRatio,
  rankDef,
} from '../data/ranks'
import { getVenue } from '../data/venues'
import { LOUNGE_TIERS, tierShopBonusLabel, type LoungeTierId } from '../data/loungeTiers'
import { type BranchId } from '../data/branches'
import type { CityMapPinId } from '../data/cityMap'
import {
  cityMapArtUrl,
  clearNetworkMapSelection,
  getNetworkMapSelection,
  normalizeNetworkMapSelection,
  renderCityMapSvg,
  fitCityMapPinChips,
  renderNetworkMapDetail,
  setNetworkMapSelection,
} from './networkMap'
import { TOBACCOS, getTobacco, tobaccoBonusLabel, type TobaccoId } from '../data/tobacco'
import {
  CHANNEL_GEAR,
  CHANNEL_START_COST,
  EVENT_COST,
  EVENT_TRAFFIC_BOOST,
  EVENT_FAME_GAIN,
  AWARD_WIN_FAME,
  AWARD_WIN_MEDIA,
  VIDEO_BASE_COST,
  channelTierLabel,
  channelTrafficBonus,
  gearUpgradeCost,
  channelVideoGrade,
  videoActionRewards,
  videoShootCost,
  videoCooldownMs,
  videoTierRequirementHint,
  TELEGRAM_TOOLKIT,
  getTelegramGradeDef,
  telegramPassiveTraffic,
  telegramPostBoostPreview,
  telegramToolkitUpgradeCost,
  canShootVideo,
  isBlogger,
  isGuideMastersWinner,
  personalRepBonusLabel,
} from '../data/personal'
import {
  awardWinBreakdown,
  eventBoostRemainingSec,
  telegramBoostRemainingSec,
  telegramStatusLine,
  videoBoostRemainingSec,
  personalVenueReach,
  mediaActionReachHint,
  mediaSynergyHint,
  personalStatusLine,
  personalTitle,
} from '../game/personal'
import {
  ambassadorCount,
  ambassadorSectionProgress,
  canSignAmbassador,
  currentAmbassadorId,
  isAmbassador,
  isAmbassadorSectionUnlocked,
} from '../game/ambassador'
import {
  AMBASSADOR_UNLOCK_FAME,
  AMBASSADOR_UNLOCK_MEDIA,
  AMBASSADOR_UNLOCK_REP,
  ambassadorContractCost,
  ambassadorNeeds,
  ambassadorReputationScore,
  ambassadorShelfBonusLabel,
} from '../data/ambassador'
import type { ChannelGearId, TelegramToolkitId } from '../data/personal'
import {
  guestTraffic,
  shelfActiveCount,
  shelfCapacity,
  shelfMood,
  tobaccoStockCount,
  trafficLabel,
  capacityStatus,
  furnitureLevel,
  seatCapacity,
} from '../game/appeal'
import {
  seatsFromUpgrade,
  seatingPurchaseWarns,
  staffServiceCapacity,
} from '../game/service'
import { EXPANSIONS, type ExpansionId } from '../data/expansions'
import {
  ACHIEVEMENTS,
  achievementProgress,
  achievementProgressLabel,
  achievementTierProgress,
  achievementsByTier,
  isAchievementUnlocked,
  TROPHY_TIER_LABEL,
  TROPHY_TIERS,
  type AchievementDef,
  type TrophyTier,
} from '../data/achievements'
import {
  SECONDS_PER_WORK_DAY,
  careerScore,
  careerScoreBreakdown,
  displayWorkDay,
  workDayProgressRatio,
} from '../data/careerTrack'
import {
  formatGameClock,
  isWeekend,
  shiftPeriodLabel,
  shiftPeriodOf,
  WEEKDAYS,
  weekdayOf,
  workDayGameClock,
} from '../game/workDays'
import { loadHallOfFame, type CareerShareCard } from '../save/leaderboard'
import { applyLayoutLab, usesLayoutD } from './layoutLab'
import { wireCityMapGestures } from './cityMapGestures'
import { isGoalStripExpanded, patchSettings } from '../save/settings'
import { UPGRADES } from '../data/upgrades'
import type { TaskId } from '../data/tasks'
import type { UpgradeId } from '../data/upgrades'
import {
  ackGuideCoach,
  goalLine,
  guideCoach,
  markMilestoneHintSeen,
  milestoneTabPing,
  ogonyokChipPulse,
  ogonyokChipVisible,
  rankUpCoach,
  touchOgonokInteraction,
  type CoachContext,
} from '../game/guide'
import { initStageAtmosphere, syncStageAtmosphere } from './atmosphere'
import {
  hasPendingMilestoneCoach,
  hasPendingTabHint,
  isGuideCoachVisible,
  queueMilestoneCoach,
  syncGuideOverlay,
} from './guideOverlay'
import { updateLoungeStageArt } from './loungeStage'
import { revealWords } from './textReveal'
import {
  isCelebrationVisible,
  playCoinSound,
  playAchievementFanfare,
  burstAchievementFx,
  playUnlockSound,
  primeAudio,
  pulseCashHud,
  showCelebration,
  showGuideMastersDiploma,
  spawnFloatCash,
  spawnTapSparks,
} from './juice'
import {
  icon,
  staffIcon,
  shopIcon,
  tobaccoIcon,
  stageSceneArt,
  taskIcon,
  tabIcon,
  tierIcon,
  promotionIcon,
  upgradeIcon,
  channelGearIcon,
  expansionIcon,
  loungeShopIcon,
} from './icons'
import { isTelegramMiniApp } from '../platform/runtime'
import {
  PROMOTIONS,
  getPromotionGradeDef,
  type PromotionId,
} from '../data/promotions'
import {
  activePromotionLabel,
  canLaunchPromotion,
  isPromotionSlotUnlocked,
  isPromotionsUnlocked,
  promotionGrade,
  promotionLaunchReadyAt,
} from '../game/promotions'
import {
  renderGearGradeRow,
  renderTelegramToolkitRow,
  renderShopGradeRow,
  renderUpgradeGradeRow,
  gradeDotsHtml,
} from './gradeUi'

function cashHudLabel(state: GameState): string {
  return state.scene === 'job' ? 'Касса' : 'Выручка'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const VENUE_SIGN_CLASSES = ['sign--basement', 'sign--smoke_river', 'sign--neon_haze'] as const
const LOUNGE_SIGN_CLASSES = ['sign--nook', 'sign--hall', 'sign--signature'] as const

function clearSignClasses(brand: HTMLElement): void {
  brand.classList.remove('sign', ...VENUE_SIGN_CLASSES, ...LOUNGE_SIGN_CLASSES)
}

/** В макете D меньше серого «учебника» — оставляем то, что влияет на решение. */
function quietUiCopy(): boolean {
  return usesLayoutD()
}

/** Одна строка «зачем» под заголовком секции — только если секция неочевидна */
function sectionPurpose(text: string): string {
  if (quietUiCopy()) return ''
  return `<p class="section-purpose">${text}</p>`
}

function taskReadySub(hint: string, speedNote: string, cooldownMs: number): string {
  if (quietUiCopy()) {
    return speedNote.trim()
      ? speedNote.replace(/^ · /, '')
      : `${(cooldownMs / 1000).toFixed(1)}с`
  }
  return `${hint}${speedNote}`
}

function menuTabButton(
  tab: MenuTab | 'own',
  label: string,
  active: boolean,
  opts: {
    extraClass?: string
    locked?: boolean
    title?: string
    chip?: boolean
  } = {},
): string {
  const { extraClass = '', locked = false, title = '', chip = false } = opts
  const cls = [
    'menu-btn',
    chip ? 'menu-btn--chip' : '',
    active ? 'active' : '',
    locked ? 'locked' : '',
    extraClass,
  ]
    .filter(Boolean)
    .join(' ')
  const tip = title || label.replace(/<br\s*\/?>/gi, ' ')
  if (chip) {
    return `<button type="button" class="${cls}" data-menu-tab="${tab}" title="${tip}">${tabIcon(tab)}<span class="menu-btn-chip-label">${label}</span></button>`
  }
  return `<button type="button" class="${cls}" data-menu-tab="${tab}" title="${tip}">${tabIcon(tab)}<span class="menu-btn-label">${label}</span></button>`
}

function upgradeUnlockHint(
  def: (typeof UPGRADES)[number],
  owned: Partial<Record<UpgradeId, number>>,
): string {
  if (!def.unlockAtOwned) return def.blurb
  const missing = Object.entries(def.unlockAtOwned)
    .filter(([id, need]) => (owned[id as UpgradeId] ?? 0) < (need ?? 0))
    .map(([id, need]) => {
      const prereq = UPGRADES.find((u) => u.id === id)
      return `${prereq?.name ?? id} — ${need}+ ур.`
    })
  return missing.length ? `Сначала: ${missing.join(', ')}` : def.blurb
}

function updateRateHud(
  rateWrap: HTMLElement,
  rateLabel: HTMLElement | null,
  rateEl: HTMLElement,
  rateSub: HTMLElement | null,
  state: GameState,
): void {
  const inGame = typeof document === 'undefined' || !document.hidden
  const repWrap = rateWrap.parentElement?.querySelector(
    '[data-reputation-wrap]',
  ) as HTMLElement | null
  const repEl = rateWrap.parentElement?.querySelector(
    '[data-reputation]',
  ) as HTMLElement | null
  const rep = jobReputationPerSec(state)
  const taskTotal =
    state.taskDone.wash + state.taskDone.coals + state.taskDone.order

  if (repWrap && repEl) {
    if (state.phase === 'employed' && rep > 0) {
      repWrap.hidden = false
      repEl.textContent = inGame
        ? `+${rep < 1 ? rep.toFixed(2) : formatMoney(rep)}/с`
        : 'пауза'
      if (!repWrap.classList.contains('is-live')) {
        repWrap.classList.add('is-live')
      }
      repWrap.classList.toggle('is-paused', !inGame)
      repWrap.classList.remove('is-warming')
    } else if (state.phase === 'employed' && taskTotal >= 2) {
      repWrap.hidden = false
      repEl.textContent = 'скоро…'
      repWrap.classList.add('is-warming')
      repWrap.classList.remove('is-live')
    } else {
      repWrap.hidden = true
      repWrap.classList.remove('is-live', 'is-warming')
    }
  }

  if (state.phase === 'employed') {
    rateWrap.hidden = true
    return
  }
  rateWrap.hidden = false
  rateWrap.classList.toggle('is-paused', !inGame)
  const net = loungeIncomePerSec(state)
  const payroll = staffPayrollPerSec(state)
  const gross = loungeGrossIncomePerSec(state)
  const fotPct = payroll > 0 ? Math.round(staffPayrollShare(state) * 100) : 0
  if (rateLabel) {
    rateLabel.textContent = !inGame
      ? 'Пауза'
      : net < 0 && payroll > 0
        ? 'Убыток'
        : payroll > 0
          ? `Чистыми · ${fotPct}%`
          : 'Пассив'
  }
  rateEl.textContent = inGame ? `${formatMoney(net)}/с` : '—'
  rateEl.classList.toggle('negative', inGame && net < 0)
  if (rateSub) rateSub.hidden = true
  rateWrap.title =
    !inGame
      ? 'Пассив копится только пока игра открыта'
      : payroll > 0
        ? `Выручка ${formatMoney(gross)}/с · ФОТ ${payroll < 10 ? payroll.toFixed(1) : formatMoney(payroll)}/с · ${fotPct}%`
        : 'Пассивный доход лаунжа — только пока ты в игре'
}

function coachContext(
  menuTab: MenuTab,
  storySubTab: StorySubTab,
  scene: GameState['scene'],
): CoachContext {
  return { menuTab, storySubTab, scene }
}

function updateGoalStrip(root: HTMLElement, state: GameState, ctx: CoachContext): void {
  const row = root.querySelector('.goal-strip-row') as HTMLElement | null
  const el = root.querySelector('[data-goal]') as HTMLElement | null
  const chip = root.querySelector('[data-ogonyok-tip]') as HTMLButtonElement | null
  const text = goalLine(state)
  const coachOnGoal =
    Boolean(el?.classList.contains('guide-highlight')) ||
    Boolean(el?.classList.contains('guide-pulse'))
  const collapsed = Boolean(text) && !isGoalStripExpanded() && !coachOnGoal
  const showGoal = Boolean(text)

  if (el) {
    el.hidden = !showGoal
    el.classList.toggle('is-collapsed', collapsed)
    if (showGoal) {
      el.textContent = collapsed ? 'Цель' : text
      el.title = collapsed ? 'Развернуть цель' : `${text} · свернуть`
      el.setAttribute(
        'aria-label',
        collapsed ? 'Развернуть цель' : `Цель: ${text}. Свернуть`,
      )
      el.setAttribute('aria-expanded', collapsed ? 'false' : 'true')
    }
  }

  const showChip = ogonyokChipVisible(state)
  if (row) {
    row.hidden = !showGoal && !showChip
    row.classList.toggle('is-collapsed', collapsed)
  }

  if (chip) {
    chip.hidden = !showChip
    chip.classList.toggle('goal-strip-ogonyok--pulse', ogonyokChipPulse(state, ctx))
    chip.title = 'Подсказка от Огонька'
  }
}

function updateTopbarHints(root: HTMLElement, state: GameState): void {
  const cashBlock = root.querySelector('.cash-block') as HTMLElement | null
  if (cashBlock) {
    cashBlock.title =
      state.scene === 'job'
        ? 'Деньги на смене — задачи и покупки инструментов'
        : 'Выручка лаунжа — заказы, пассив и минус зарплата команды'
  }

  const repWrap = root.querySelector('[data-reputation-wrap]') as HTMLElement | null
  if (repWrap && !repWrap.hidden) {
    repWrap.title = 'Пассивный доход на смене — капает в кассу после нескольких задач'
  }

  const cta = root.querySelector('[data-cta]') as HTMLButtonElement | null
  if (cta && !cta.hidden) {
    cta.title = 'Принять заказ гостя — чаевые и выручка'
  }
}

function setWeekdayPopOpen(root: HTMLElement, open: boolean): void {
  const pop = root.querySelector('[data-weekday-pop]') as HTMLElement | null
  const chip = root.querySelector('[data-workday-wrap]') as HTMLElement | null
  if (!pop || !chip) return
  pop.hidden = !open
  chip.classList.toggle('is-open', open)
  chip.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function paintWeekdayRibbon(root: HTMLElement, state: GameState): void {
  const ribbon = root.querySelector('[data-weekday-ribbon]') as HTMLElement | null
  if (!ribbon) return
  const weekday = weekdayOf(state)
  const prev = ribbon.dataset.wd
  ribbon.classList.toggle('is-weekend', isWeekend(state))
  if (prev === weekday.id) return
  for (const pill of ribbon.querySelectorAll<HTMLElement>('[data-wd]')) {
    pill.classList.toggle('is-now', pill.dataset.wd === weekday.id)
    pill.classList.remove('is-flip')
  }
  if (prev) {
    const nowPill = ribbon.querySelector<HTMLElement>(`[data-wd="${weekday.id}"]`)
    nowPill?.classList.add('is-flip')
    ribbon.classList.remove('is-flip')
    void ribbon.offsetWidth
    ribbon.classList.add('is-flip')
  }
  ribbon.dataset.wd = weekday.id
}

function updateWorkDayHud(root: HTMLElement, state: GameState): void {
  const wrap = root.querySelector('[data-workday-wrap]') as HTMLElement | null
  const nameEl = root.querySelector('[data-workday-name]') as HTMLElement | null
  const timeEl = root.querySelector('[data-workday-time]') as HTMLElement | null
  if (!wrap || !timeEl) return
  if (!state.onboarded) {
    wrap.hidden = true
    setWeekdayPopOpen(root, false)
    return
  }
  wrap.hidden = false
  const inGame = !document.hidden
  wrap.classList.toggle('is-paused', !inGame)
  wrap.classList.toggle('is-weekend', isWeekend(state))
  const clock = workDayGameClock(state)
  const weekday = weekdayOf(state)
  if (nameEl) {
    nameEl.textContent = isWeekend(state)
      ? `${weekday.short} · людно`
      : `${weekday.short} · ${clock.day}`
  }
  timeEl.textContent = inGame ? formatGameClock(clock.hours, clock.minutes) : 'пауза'
  const min = Math.round(SECONDS_PER_WORK_DAY / 60)
  const period = shiftPeriodLabel(shiftPeriodOf(state))
  const crowd = isWeekend(state) ? 'Пт и Сб — больше гостей весь день.' : 'Пт и Сб люднее обычного.'
  wrap.title = `${weekday.name} · ${period} · день ${clock.day}. ${crowd} Акции жми когда удобно. День = ${min} мин (08:00→20:00).`
  paintWeekdayRibbon(root, state)
}

function canPresentAchievements(state: GameState, _menuTab: MenuTab): boolean {
  if (isGuideCoachVisible()) return false
  if (hasPendingTabHint()) return false
  if (hasPendingMilestoneCoach()) return false
  if (guideCoach(state)) return false
  if (isCelebrationVisible()) return false
  return true
}

function tryPresentAchievements(
  root: HTMLElement,
  state: GameState,
  menuTab: MenuTab,
): void {
  if (!canPresentAchievements(state, menuTab)) return
  if (achieveShowing || !achieveQueue.length) return
  const tab = root.querySelector<HTMLElement>('[data-menu-tab="career"]')
  tab?.classList.add('achieve-ping')
  presentNextAchievement(state, menuTab)
}

/** Показать отложенные ачивки, когда экран смены свободен от подсказок */
export function flushAchievementQueue(
  root: HTMLElement,
  state: GameState,
  menuTab: MenuTab,
): void {
  tryPresentAchievements(root, state, menuTab)
}

/** Кнопка «Принять заказ» — только вкладка «Сюжет», свой зал, не «Магазин» */
function showLoungeOrderCta(
  state: GameState,
  menuTab: MenuTab,
  storySubTab: StorySubTab,
): boolean {
  if (state.scene !== 'lounge') return false
  if (menuTab !== 'story') return false
  if (storySubTab === 'shop' && canAccessShopPanel(state)) return false
  return true
}

function syncOrderCta(root: HTMLElement, state: GameState): void {
  const pay = root.querySelector('[data-cta-pay]') as HTMLElement | null
  if (pay) pay.textContent = `+${formatMoney(loungeClickPower(state))}`
}

/** Подраздел сюжета: задачи/обзор и магазин */
function showJobSubnav(state: GameState, menuTab: MenuTab): boolean {
  if (menuTab !== 'story') return false
  if (state.phase === 'dual') return true
  if (state.phase === 'employed') return state.scene === 'job'
  if (state.phase === 'ownOnly') return true
  return false
}

function canAccessShiftShop(state: GameState): boolean {
  return state.phase === 'dual' || (state.phase === 'employed' && state.scene === 'job')
}

/** Панель «Магазин»: инструменты на смене и/или табачный каталог в своём зале */
function canAccessShopPanel(state: GameState): boolean {
  return canAccessShiftShop(state) || state.phase === 'ownOnly'
}

function showTobaccoCatalogInShop(state: GameState): boolean {
  if (state.phase === 'ownOnly') return true
  if (state.phase === 'dual' && state.scene === 'lounge') return true
  return false
}

export type CareerSubTab = 'track' | 'trophies'

export type StorySubTab = 'tasks' | 'shop'

export type MenuTab =
  | 'story'
  | 'own'
  | 'tobacco'
  | 'staff'
  | 'personal'
  | 'network'
  | 'career'

/** Вкладки только для своего зала — смена тут не нужна */
export function isLoungeOnlyMenuTab(tab: MenuTab): boolean {
  return tab === 'tobacco' || tab === 'staff' || tab === 'personal' || tab === 'network'
}

export interface ShellHandlers {
  onJobTask: (id: TaskId) => void
  onLoungeOrder: () => void
  onBuy: (id: UpgradeId) => void
  onBuyShop: (id: ShopItemId) => void
  onBuyLoungeShop: (id: LoungeShopId) => void
  onBuyTobacco: (id: TobaccoId) => void
  onPutOnShelf: (id: TobaccoId) => void
  onRemoveFromShelf: (id: TobaccoId) => void
  onHireStaff: (id: StaffId) => void
  onUpgradeStaff: (id: StaffId, index: number) => void
  onAddStaff: (id: StaffId) => void
  onFireStaff: (id: StaffId, index: number) => void
  onOpenBranch: (id: BranchId) => void
  onBuyExpansion: (id: ExpansionId) => void
  onBeginLoungePick: () => void
  onCancelLoungePick: () => void
  onOpenLounge: (tier: LoungeTierId) => void
  onQuit: () => void
  onScene: (scene: 'job' | 'lounge') => void
  onStartChannel: () => void
  onUpgradeChannelGear: (id: ChannelGearId) => void
  onShootVideo: () => void
  onHoldEvent: () => void
  onEnterAward: () => void
  onUpgradePromotion: (id: PromotionId) => void
  onLaunchPromotion: (id: PromotionId) => void
  onCreateTelegram: () => void
  onUpgradeTelegram: () => void
  onUpgradeTelegramToolkit: (id: TelegramToolkitId) => void
  onPostTelegram: () => void
  onSignAmbassador: (id: TobaccoId) => void
  onBreakAmbassador: (id: TobaccoId) => void
  onMenuTab: (tab: MenuTab) => void
  onCareerSubTab: (sub: CareerSubTab) => void
  onStorySubTab: (sub: StorySubTab) => void
  onGuideAck: () => void
  onReset: () => void
  onShareCareer: () => void
  onImportCareer: (code: string) => void
  onClearCareerCompare: () => void
  onOpenSettings: () => void
  onStoryMenuBack?: () => void
  onOgonokTip: () => void
}

let careerCompareCard: CareerShareCard | null = null
/** Чтобы после покупки/апгрейда панель не прыгала наверх */
let panelScrollKey = ''

export function setCareerCompareCard(card: CareerShareCard | null): void {
  careerCompareCard = card
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
let achieveQueue: AchievementDef[] = []
const achieveFanfareSeen = new Set<string>()
let achieveShowing = false
let achieveHost: HTMLElement | null = null
let achieveCtx: { root: HTMLElement; state: GameState; menuTab: MenuTab } | null =
  null

function syncAchievementContext(
  root: HTMLElement,
  state: GameState,
  menuTab: MenuTab,
): void {
  achieveCtx = { root, state, menuTab }
}

function ensureAchieveFanfare(): HTMLElement {
  if (achieveHost?.isConnected) return achieveHost
  document.getElementById('achieve-fanfare-root')?.remove()

  const wrap = document.createElement('div')
  wrap.id = 'achieve-fanfare-root'
  wrap.className = 'achieve-fanfare'
  wrap.hidden = true
  wrap.innerHTML = `
    <div class="achieve-fanfare-backdrop"></div>
    <div class="achieve-fanfare-fx" aria-hidden="true"></div>
    <div class="achieve-fanfare-card gradient-surface gradient-surface--hero" role="dialog" aria-modal="true" aria-live="assertive">
      <div class="achieve-fanfare-glow" aria-hidden="true"></div>
      <div class="achieve-fanfare-ring" aria-hidden="true"></div>
      <p class="achieve-fanfare-icon" aria-hidden="true">🏆</p>
      <p class="achieve-fanfare-kicker">Достижение открыто</p>
      <p class="achieve-fanfare-title" data-achieve-title></p>
      <p class="achieve-fanfare-hint" data-achieve-hint></p>
      <p class="achieve-fanfare-reward" data-achieve-reward></p>
      <button type="button" class="achieve-fanfare-btn" data-achieve-ok>Круто</button>
    </div>
  `
  document.body.appendChild(wrap)
  wrap.querySelector('[data-achieve-ok]')!.addEventListener('click', () => {
    if (!achieveCtx) return
    dismissAchievementFanfare(achieveCtx.root, achieveCtx.state, achieveCtx.menuTab)
  })
  achieveHost = wrap
  return wrap
}

export function mountShell(root: HTMLElement, handlers: ShellHandlers): void {
  root.innerHTML = `
    <div class="app-shell">
      <div class="hero-band">
      <header class="topbar">
        <div class="cash-block">
          <p class="lounge-name" data-lounge-name hidden></p>
          <span class="cash-label" data-cash-label>Выручка</span>
          <span class="cash-value" data-cash>0</span>
        </div>
        <div class="rate-block" data-rate-wrap hidden>
          <span class="rate-label" data-rate-label>Пассив</span>
          <span class="rate-value" data-rate>0/с</span>
          <span class="rate-sub" data-rate-sub hidden></span>
        </div>
        <div class="rate-block rate-block--rep" data-reputation-wrap hidden>
          <span class="rate-label">Пассив</span>
          <span class="rate-value" data-reputation>0/с</span>
        </div>
        <button type="button" class="rate-block rate-block--day workday-clock" data-workday-wrap hidden aria-expanded="false" aria-controls="weekday-pop">
          <span class="rate-label" data-workday-name>Пн · 1</span>
          <span class="rate-value workday-clock-digital" data-workday-time>08:00</span>
        </button>
        <div class="weekday-pop" id="weekday-pop" data-weekday-pop hidden>
          <p class="weekday-pop-kicker">Неделя смены</p>
          <div class="weekday-ribbon" data-weekday-ribbon>
            ${WEEKDAYS.map((d) => {
              const peak = d.traffic > 1 ? ' is-peak' : ''
              return `<span class="weekday-pill${peak}" data-wd="${d.id}">${d.short}</span>`
            }).join('')}
          </div>
          <p class="weekday-pop-hint">Пт и Сб гостей больше. Акции в эти дни жирнее.</p>
        </div>
      </header>
      <div class="goal-strip-row">
        <button type="button" class="goal-strip-ogonyok" data-ogonyok-tip hidden aria-label="Подсказка от Огонька">
          <span class="goal-strip-ogonyok__glyph" aria-hidden="true">🔥</span>
        </button>
        <button type="button" class="goal-strip" data-goal hidden></button>
      </div>

      <main class="stage">
        <div class="stage-bg" aria-hidden="true"></div>
        <div class="stage-frame" aria-hidden="true"></div>
        <div class="haze" aria-hidden="true"></div>
        <div class="embers" aria-hidden="true"></div>
        ${stageSceneArt()}
        <div class="stage-copy">
          <p class="brand" data-brand></p>
          <p class="tagline" data-tagline></p>
          <button type="button" class="order-cta" data-cta hidden aria-label="Принять заказ гостя">
            <span class="order-cta__icon" aria-hidden="true">${icon('order')}</span>
            <span class="order-cta__copy">
              <span class="order-cta__label">Принять заказ</span>
              <span class="order-cta__hint">Чаевые и выручка</span>
            </span>
            <span class="order-cta__pay" data-cta-pay>+0 ₽</span>
          </button>
        </div>
        <p class="toast" data-toast hidden></p>
      </main>
      </div>

      <section class="panel">
        <div class="menu-shell" data-menu-shell aria-label="Меню">
          <div class="menu-toolbar">
            <button type="button" class="menu-back" data-story-menu-back hidden aria-label="К сюжету">
              <span class="menu-back__chevron" aria-hidden="true">‹</span>
              <span class="menu-back__label">Сюжет</span>
            </button>
            <nav class="menu-nav menu-nav--primary" data-menu-primary></nav>
            <button type="button" class="menu-settings" data-settings-open aria-label="Настройки">
              ${icon('settings', 'topbar-settings__icon')}
              <span class="menu-settings__label">Настройки</span>
            </button>
          </div>
          <nav class="menu-nav menu-nav--secondary" data-menu-secondary hidden></nav>
        </div>
        <nav class="scene-nav subnav subnav-stack" data-nav aria-label="Подраздел"></nav>
        <div class="panel-scroll">
          <div class="panel-scroll-fade panel-scroll-fade--top" aria-hidden="true"></div>
          <div class="panel-body" data-panel></div>
          <div class="panel-scroll-fade panel-scroll-fade--bottom" aria-hidden="true"></div>
        </div>
      </section>
    </div>
  `

  const cta = root.querySelector('[data-cta]') as HTMLButtonElement
  cta.addEventListener('click', () => {
    primeAudio()
    handlers.onLoungeOrder()
    cta.classList.remove('pulse')
    void cta.offsetWidth
    cta.classList.add('pulse')
  })

  root.querySelector('[data-menu-shell]')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-menu-tab]')
    if (!btn?.dataset.menuTab) return
    handlers.onMenuTab(btn.dataset.menuTab as MenuTab)
  })

  root.querySelector('[data-settings-open]')!.addEventListener('click', () => {
    handlers.onOpenSettings()
  })
  root.querySelector('[data-story-menu-back]')?.addEventListener('click', () => {
    handlers.onStoryMenuBack?.()
  })

  const dayChip = root.querySelector('[data-workday-wrap]') as HTMLElement | null
  dayChip?.addEventListener('click', (e) => {
    e.stopPropagation()
    const pop = root.querySelector('[data-weekday-pop]') as HTMLElement | null
    if (!pop || dayChip.hidden) return
    setWeekdayPopOpen(root, pop.hidden)
  })
  document.addEventListener('click', (e) => {
    const pop = root.querySelector('[data-weekday-pop]') as HTMLElement | null
    if (!pop || pop.hidden) return
    const t = e.target as Node
    if (pop.contains(t) || dayChip?.contains(t)) return
    setWeekdayPopOpen(root, false)
  })

  root.querySelector('[data-ogonyok-tip]')?.addEventListener('click', () => {
    handlers.onOgonokTip()
  })

  root.querySelector('[data-goal]')?.addEventListener('click', () => {
    const el = root.querySelector('[data-goal]') as HTMLElement | null
    if (!el || el.hidden) return
    if (el.classList.contains('guide-highlight') || isGuideCoachVisible()) return
    patchSettings({ goalStrip: !isGoalStripExpanded() })
  })

  const panelBody = root.querySelector('[data-panel]') as HTMLElement | null
  panelBody?.addEventListener('scroll', () => syncPanelScrollFades(root), {
    passive: true,
  })
  syncPanelScrollFades(root)

  applyLayoutLab(root)
  ensureAchieveFanfare()
}

function syncPanelScrollFades(root: HTMLElement): void {
  const panel = root.querySelector('[data-panel]') as HTMLElement | null
  const fadeTop = root.querySelector('.panel-scroll-fade--top')
  const fadeBottom = root.querySelector('.panel-scroll-fade--bottom')
  if (!panel || !fadeTop || !fadeBottom) return

  const canScroll = panel.scrollHeight > panel.clientHeight + 2
  const atTop = panel.scrollTop <= 2
  const atBottom =
    panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2

  fadeTop.classList.toggle('is-visible', canScroll && !atTop)
  fadeBottom.classList.toggle('is-visible', canScroll && !atBottom)
}

function panelContentScrollKey(
  menuTab: MenuTab,
  storySubTab: StorySubTab,
  careerSubTab: CareerSubTab,
  state: GameState,
): string {
  return [
    menuTab,
    storySubTab,
    careerSubTab,
    state.scene,
    state.phase,
    state.flags.pickingLounge ? 'pick' : '',
  ].join('|')
}

function restorePanelScroll(
  root: HTMLElement,
  panel: HTMLElement,
  keepScroll: boolean,
  savedTop: number,
): void {
  const apply = (): void => {
    if (keepScroll) {
      const max = Math.max(0, panel.scrollHeight - panel.clientHeight)
      panel.scrollTop = Math.min(savedTop, max)
    } else {
      panel.scrollTop = 0
    }
    syncPanelScrollFades(root)
  }
  apply()
  requestAnimationFrame(apply)
}

export function updateHud(
  root: HTMLElement,
  state: GameState,
  ctx?: CoachContext,
): void {
  syncLoungeOfferUnlock(state)
  const cashEl = root.querySelector('[data-cash]') as HTMLElement | null
  const rateWrap = root.querySelector('[data-rate-wrap]') as HTMLElement | null
  const rateEl = root.querySelector('[data-rate]') as HTMLElement | null
  const rateLabel = root.querySelector('[data-rate-label]') as HTMLElement | null
  const rateSub = root.querySelector('[data-rate-sub]') as HTMLElement | null
  const cta = root.querySelector('[data-cta]') as HTMLButtonElement | null
  const cashLabel = root.querySelector('[data-cash-label]') as HTMLElement | null
  if (!cashEl || !rateWrap || !rateEl) return

  const cashText = formatMoney(state.cash)
  if (cashEl.textContent !== cashText) cashEl.textContent = cashText
  if (cashLabel) cashLabel.textContent = cashHudLabel(state)
  updateRateHud(rateWrap, rateLabel, rateEl, rateSub, state)
  if (ctx) updateGoalStrip(root, state, ctx)
  updateWorkDayHud(root, state)
  updateTopbarHints(root, state)
  if (cta && !cta.hidden) {
    syncOrderCta(root, state)
  }

  const ownTab = root.querySelector<HTMLButtonElement>('[data-menu-tab="own"]')
  if (ownTab && state.phase === 'employed') {
    const ready = canBrowseLoungeOffer(state)
    ownTab.classList.toggle('locked', !ready)
    ownTab.classList.toggle('ready', ready)
    ownTab.title = ready
      ? 'Выбор своего лаунжа'
      : `Накопи ${formatMoney(minOpenLoungeCost(state))}`
  }

  const networkTab = root.querySelector<HTMLButtonElement>('[data-menu-tab="network"]')
  if (networkTab && state.phase !== 'employed') {
    const ready = canBrowseEmpire(state)
    networkTab.classList.toggle('locked', !ready)
    networkTab.classList.toggle('ready', ready)
  }

  // Afford-кнопки только если они есть в текущей панели (не гоняем пустые querySelectorAll-пачки)
  if (root.querySelector('[data-buy]')) {
    root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
      const id = btn.dataset.buy as UpgradeId
      const def = UPGRADES.find((u) => u.id === id)
      if (!def) return
      const unlocked = isUpgradeUnlocked(state, def)
      const level = state.owned[id]
      const maxed = level >= def.maxLevel
      const cost = scaledUpgradeCost(state, upgradeCost(def, level))
      const canBuy = unlocked && !maxed && state.cash >= cost
      btn.disabled = !canBuy
      btn.classList.toggle('afford', canBuy)
      btn.classList.toggle('locked', !unlocked)
      btn.classList.toggle('owned', maxed)
    })
  }

  if (root.querySelector('[data-expansion]')) {
    root.querySelectorAll<HTMLButtonElement>('[data-expansion]').forEach((btn) => {
      const id = btn.dataset.expansion as ExpansionId
      const def = EXPANSIONS.find((e) => e.id === id)
      if (!def || state.expansions[id]) return
      const unlocked = furnitureLevel(state) >= def.needFurniture
      const cost = scaledExpansionCost(state, def.cost)
      const canBuy = unlocked && state.cash >= cost
      btn.disabled = !canBuy
      btn.classList.toggle('afford', canBuy)
      btn.classList.toggle('locked', !unlocked)
    })
  }

  if (root.querySelector('[data-shop]')) {
    root.querySelectorAll<HTMLButtonElement>('[data-shop]').forEach((btn) => {
      const id = btn.dataset.shop as ShopItemId
      const item = SHOP_ITEMS.find((i) => i.id === id)
      if (!item) return
      const level = shopLevel(state.shopOwned, id)
      const next = nextShopGrade(item, level)
      if (!next) return
      const available = canUpgradeShopItem(
        item,
        level,
        state.taskDone,
        state.jobRank,
      )
      const cost = shopItemCost(state, next.cost)
      const canBuy = available && state.cash >= cost
      btn.disabled = !canBuy
      btn.classList.toggle('afford', canBuy)
      btn.classList.toggle('locked', !available)
      const meta = btn.querySelector('.row-meta')
      if (meta) meta.textContent = formatMoney(cost)
    })
  }

  if (root.querySelector('[data-lounge-shop]')) {
    root.querySelectorAll<HTMLButtonElement>('[data-lounge-shop]').forEach((btn) => {
      const id = btn.dataset.loungeShop as LoungeShopId
      const line = getLoungeShopLine(id)
      if (!line) return
      const level = loungeShopLevel(state.loungeShop, id)
      const next = nextLoungeShopGrade(line, level)
      if (!next) return
      const cost = shopItemCost(state, next.cost)
      const canBuy = state.phase !== 'employed' && state.cash >= cost
      btn.disabled = !canBuy
      btn.classList.toggle('afford', canBuy)
    })
  }

  const openBtn = root.querySelector<HTMLButtonElement>('[data-open]')
  if (openBtn) openBtn.disabled = !canBrowseLoungeOffer(state)

  const quitBtn = root.querySelector<HTMLButtonElement>('[data-quit]')
  if (quitBtn) quitBtn.disabled = !canQuitJob(state)

  if (state.phase === 'employed') {
    const openCost = minOpenLoungeCost(state)
    const openMilestone = root.querySelector('[data-open]')?.closest('.milestone')
    const head = openMilestone?.querySelector('.milestone-head span:last-child')
    if (head) {
      head.textContent = `${formatMoney(Math.min(state.cash, openCost))} / ${formatMoney(openCost)}`
    }
    const openBar = openMilestone?.querySelector('.bar i') as HTMLElement | null
    if (openBar) {
      openBar.style.width = `${Math.min(1, state.cash / openCost) * 100}%`
    }
  }

  if (root.querySelector('[data-tier]')) {
    root.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((btn) => {
      const tier = LOUNGE_TIERS.find((t) => t.id === btn.dataset.tier)
      if (!tier) return
      const tierCost = loungeTierCost(state, tier.cost)
      const can = state.cash >= tierCost
      btn.disabled = !can
      btn.classList.toggle('afford', can)
      const sub = btn.querySelector('.row-sub')
      if (sub && !can) {
        const need = Math.ceil(tierCost - state.cash)
        sub.textContent = `Ещё ${formatMoney(need)} — и можно открыть`
      }
    })
  }
}

export function updateJobCooldowns(
  root: HTMLElement,
  state: GameState,
  now = Date.now(),
): void {
  if (!canDoJobTasks(state)) return
  for (const t of JOB_TASKS) {
    const btn = root.querySelector<HTMLButtonElement>(`[data-task="${t.id}"]`)
    if (!btn || !isTaskUnlocked(t, state.taskDone)) continue
    const ready = now >= state.taskReadyAt[t.id]
    const left = Math.max(0, state.taskReadyAt[t.id] - now)
    const cd = Math.round(
      taskCooldownMs(t.cooldownMs, t.id, state.shopOwned) *
        jobTaskCooldownMult(state) *
        loungeShopTaskCdMult(state, t.id),
    )
    const pay = taskPay(
      t.pay,
      t.id,
      state.shopOwned,
      jobTaskPayMult(state),
    )
    const speedNote = cd < t.cooldownMs ? ` · ${(cd / 1000).toFixed(1)}с` : ''
    btn.disabled = !ready
    btn.classList.toggle('busy', !ready)
    btn.classList.toggle('task-ready', ready)
    const sub = btn.querySelector('.row-sub')
    const meta = btn.querySelector('.row-meta')
    if (sub) {
      sub.textContent = ready ? taskReadySub(t.hint, speedNote, cd) : `ещё ${(left / 1000).toFixed(1)}с`
    }
    if (meta) meta.textContent = `+${pay}`
  }
}

export function showToast(root: HTMLElement, message: string): void {
  let el = root.querySelector('[data-toast]') as HTMLElement | null
  if (!el) {
    el = document.createElement('div')
    el.className = 'toast show'
    el.setAttribute('data-toast', '')
    el.setAttribute('role', 'status')
    root.appendChild(el)
  }
  el.textContent = message
  el.hidden = false
  el.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    el.classList.remove('show')
    el.hidden = true
  }, 3200)
}

export function syncAchievementFanfareSeen(state: GameState): void {
  for (const def of ACHIEVEMENTS) {
    if (isAchievementUnlocked(state, def.id)) achieveFanfareSeen.add(def.id)
  }
}

export function resetAchievementFanfareSeen(): void {
  achieveFanfareSeen.clear()
}

/** Очередь баннеров достижений — закрывается только кнопкой «Круто» */
export function announceAchievements(
  root: HTMLElement,
  state: GameState,
  menuTab: MenuTab,
  unlocked: AchievementDef[],
): void {
  const fresh = unlocked.filter(
    (def) =>
      isAchievementUnlocked(state, def.id) &&
      !achieveFanfareSeen.has(def.id) &&
      !achieveQueue.some((q) => q.id === def.id),
  )
  for (const def of fresh) achieveFanfareSeen.add(def.id)
  if (fresh.length) achieveQueue.push(...fresh)
  if (!achieveQueue.length) return
  tryPresentAchievements(root, state, menuTab)
}

function presentNextAchievement(state: GameState, menuTab: MenuTab): void {
  if (achieveShowing) return
  if (!canPresentAchievements(state, menuTab)) return
  const next = achieveQueue.shift()
  if (!next) return
  achieveShowing = true

  const wrap = ensureAchieveFanfare()
  const title = wrap.querySelector('[data-achieve-title]') as HTMLElement
  const hint = wrap.querySelector('[data-achieve-hint]') as HTMLElement
  const reward = wrap.querySelector('[data-achieve-reward]') as HTMLElement

  title.textContent = next.title
  hint.textContent = next.hint
  reward.textContent = `+${formatMoney(next.reward)} к выручке`
  wrap.classList.remove('out')
  wrap.hidden = false
  void wrap.offsetWidth
  wrap.classList.add('in')
  document.body.classList.add('achieve-locked')
  playAchievementFanfare()
  burstAchievementFx(wrap)
  revealWords(title, 75)
  ;(wrap.querySelector('[data-achieve-ok]') as HTMLButtonElement).focus()
}

function dismissAchievementFanfare(
  root: HTMLElement,
  state: GameState,
  menuTab: MenuTab,
): void {
  const wrap = achieveHost
  if (!wrap || wrap.hidden) {
    achieveShowing = false
    document.body.classList.remove('achieve-locked')
    tryPresentAchievements(root, state, menuTab)
    return
  }
  wrap.classList.remove('in')
  wrap.classList.add('out')
  window.setTimeout(() => {
    wrap.hidden = true
    wrap.classList.remove('out')
    achieveShowing = false
    document.body.classList.remove('achieve-locked')
    tryPresentAchievements(root, state, menuTab)
  }, 220)
}

export function renderShell(
  root: HTMLElement,
  state: GameState,
  handlers: ShellHandlers,
  menuTab: MenuTab,
  now = Date.now(),
  careerSubTab: CareerSubTab = 'track',
  storySubTab: StorySubTab = 'tasks',
): void {
  const ctx = coachContext(menuTab, storySubTab, state.scene)
  syncAchievementContext(root, state, menuTab)
  // Если stage был повреждён (старый баг data-menu) — пересобираем оболочку
  if (!root.querySelector('[data-brand]') || !root.querySelector('[data-menu-primary]')) {
    mountShell(root, handlers)
  }

  const cashEl = root.querySelector('[data-cash]') as HTMLElement
  const rateWrap = root.querySelector('[data-rate-wrap]') as HTMLElement
  const rateEl = root.querySelector('[data-rate]') as HTMLElement
  const rateLabel = root.querySelector('[data-rate-label]') as HTMLElement | null
  const rateSub = root.querySelector('[data-rate-sub]') as HTMLElement | null
  const brand = root.querySelector('[data-brand]') as HTMLElement
  const tagline = root.querySelector('[data-tagline]') as HTMLElement
  const cta = root.querySelector('[data-cta]') as HTMLButtonElement
  const nav = root.querySelector('[data-nav]') as HTMLElement
  const panel = root.querySelector('[data-panel]') as HTMLElement
  const stage = root.querySelector('.stage') as HTMLElement
  const menuPrimary = root.querySelector('[data-menu-primary]') as HTMLElement
  const menuSecondary = root.querySelector('[data-menu-secondary]') as HTMLElement

  const cashLabel = root.querySelector('[data-cash-label]') as HTMLElement | null
  cashEl.textContent = formatMoney(state.cash)
  if (cashLabel) cashLabel.textContent = cashHudLabel(state)
  updateRateHud(rateWrap, rateLabel, rateEl, rateSub, state)
  if (ctx) updateGoalStrip(root, state, ctx)
  updateWorkDayHud(root, state)
  updateTopbarHints(root, state)
  updateLoungeStageArt(root, state)

  if (state.onboarded) {
    root.dataset.difficulty = resolveDifficulty(state)
  } else {
    delete root.dataset.difficulty
  }

  initStageAtmosphere(stage)
  syncStageAtmosphere(stage)

  const shell = root.querySelector('.app-shell') as HTMLElement | null
  shell?.classList.toggle('app-shell--lounge', state.scene === 'lounge' && state.phase !== 'employed')

  stage.dataset.scene = state.scene
  stage.dataset.phase = state.phase
  stage.dataset.tab = menuTab
  if (menuTab === 'story' && showJobSubnav(state, menuTab)) {
    stage.dataset.storySub = storySubTab
  } else {
    delete stage.dataset.storySub
  }
  if (state.scene === 'job' && state.venueId) {
    stage.dataset.venue = state.venueId
  } else {
    delete stage.dataset.venue
  }
  if (state.scene === 'lounge' && state.loungeTier) {
    stage.dataset.tier = state.loungeTier
  } else {
    delete stage.dataset.tier
  }

  if (state.scene === 'job') {
    const venueId = state.venueId
    clearSignClasses(brand)
    brand.classList.add('sign', `sign--${venueId}`)
    brand.textContent = getVenue(venueId).name

    const rank = rankDef(state.jobRank).title
    const chips: string[] = []
    if (state.playerName) {
      chips.push(`<span class="stage-chip">${escapeHtml(state.playerName)}</span>`)
    }
    chips.push(`<span class="stage-chip stage-chip--rank">${escapeHtml(rank)}</span>`)
    if (state.difficulty) {
      chips.push(
        `<span class="stage-chip stage-chip--diff stage-chip--diff-${state.difficulty}">${escapeHtml(getDifficulty(state).label)}</span>`,
      )
    }
    if (state.phase !== 'employed') {
      chips.push(`<span class="stage-chip stage-chip--soft">можно на смену</span>`)
    }
    tagline.classList.add('tagline--chips')
    tagline.innerHTML = `<span class="stage-chips">${chips.join('')}</span>`
  } else {
    const tier = state.loungeTier ?? 'nook'
    clearSignClasses(brand)
    brand.classList.add('sign', `sign--${tier}`)
    brand.textContent = state.loungeName

    const traffic = guestTraffic(state)
    const chips: string[] = []
    chips.push(
      `<span class="stage-chip stage-chip--traffic">Гости ${escapeHtml(trafficLabel(traffic))}</span>`,
    )
    chips.push(
      `<span class="stage-chip ${isWeekend(state) ? 'stage-chip--traffic' : 'stage-chip--soft'}">${escapeHtml(weekdayOf(state).name)}</span>`,
    )
    chips.push(`<span class="stage-chip">×${traffic.toFixed(2)}</span>`)
    if (state.loungeIncomeMult !== 1 || state.loungeClickMult !== 1) {
      chips.push(
        `<span class="stage-chip stage-chip--soft">×${state.loungeIncomeMult}/×${state.loungeClickMult}</span>`,
      )
    }
    if (branchCount(state) > 0) {
      chips.push(
        `<span class="stage-chip stage-chip--soft">${escapeHtml(networkLabel(state))} ×${empireIncomeMult(state).toFixed(2)}</span>`,
      )
    }
    tagline.classList.add('tagline--chips')
    tagline.innerHTML = `<span class="stage-chips">${chips.join('')}</span>`
  }

  const loungeNameEl = root.querySelector('[data-lounge-name]') as HTMLElement | null
  if (loungeNameEl) {
    // В D название живёт у CTA; в шапке оставляем «Выручка»
    loungeNameEl.hidden = true
    loungeNameEl.textContent = ''
  }

  const showOrder = showLoungeOrderCta(state, menuTab, storySubTab)
  cta.hidden = !showOrder
  if (showOrder) {
    stage.dataset.hasCta = '1'
    syncOrderCta(root, state)
  } else {
    delete stage.dataset.hasCta
  }

  const ownReady = canBrowseLoungeOffer(state)
  const empireReady = canBrowseEmpire(state)
  menuPrimary.innerHTML = [
    menuTabButton('story', 'Сюжет', menuTab === 'story', {
      title: 'Задачи смены, свой лаунж и сюжетные цели',
    }),
    menuTabButton('career', 'Карьера', menuTab === 'career', {
      title: 'Дни, очки карьеры, трофеи и сравнение',
    }),
    state.phase === 'employed'
      ? menuTabButton('own', 'Свой<br>лаунж', menuTab === 'own', {
          extraClass: ownReady ? 'ready' : 'locked',
          locked: !ownReady,
          title: ownReady
            ? 'Выбор своего лаунжа'
            : `Накопи ${formatMoney(minOpenLoungeCost(state))} на свой лаунж`,
        })
      : '',
  ]
    .filter(Boolean)
    .join('')

  const storyMenuOpen = shell?.dataset.storyMenu === 'open'
  const backBtn = root.querySelector<HTMLButtonElement>('[data-story-menu-back]')
  if (backBtn) backBtn.hidden = !storyMenuOpen

  if (state.phase !== 'employed') {
    menuSecondary.hidden = shell?.dataset.ui === 'd' ? !storyMenuOpen : false
    menuSecondary.innerHTML = [
      menuTabButton('tobacco', 'Табак', menuTab === 'tobacco', {
        chip: true,
        title: 'Полка и склад — выставь купленный табак на работу',
      }),
      menuTabButton('staff', 'Команда', menuTab === 'staff', {
        chip: true,
        title: 'Найм, грейды и зарплата команды',
      }),
      menuTabButton('personal', 'Личное', menuTab === 'personal', {
        chip: true,
        title: 'Блог, мероприятия и премия «Гайд Мастерс»',
      }),
      menuTabButton('network', 'Сеть', menuTab === 'network', {
        chip: true,
        extraClass: empireReady ? 'ready' : 'locked',
        locked: !empireReady,
        title: empireReady ? 'Сеть лаунжей' : 'Уволиться со смены',
      }),
    ].join('')
  } else {
    menuSecondary.hidden = true
    menuSecondary.innerHTML = ''
  }

  // Пинг только пока ждём intro и табак уже закрыт — иначе каждый paint
  // перезапускает анимацию и вкладка «моргает» без остановки.
  if (
    state.flags.personalIntroPending &&
    !state.flags.tobaccoSetupPending &&
    !state.flags.tabHints.personal &&
    menuTab !== 'personal' &&
    state.phase !== 'employed'
  ) {
    root.querySelector('[data-menu-tab="personal"]')?.classList.add('tab-ping')
  }

  const milestonePing = milestoneTabPing(state, ctx)
  if (milestonePing) {
    root.querySelector(`[data-menu-tab="${milestonePing}"]`)?.classList.add('tab-ping')
  }

  nav.innerHTML = ''
  const subRows: string[] = []

  if (menuTab === 'career') {
    const { done, total } = achievementProgress(state)
    const trophiesPing = achieveQueue.length > 0 ? ' achieve-ping' : ''
    subRows.push(`
      <div class="subnav-row subnav-row--career">
        <button type="button" class="nav-btn ${careerSubTab === 'track' ? 'active' : ''}" data-career-sub="track" title="Рабочие дни, очки и соревнование">Сводка</button>
        <button type="button" class="nav-btn ${careerSubTab === 'trophies' ? 'active' : ''}${trophiesPing}" data-career-sub="trophies" title="Разовые награды за особые дела">Трофеи ${done}/${total}</button>
      </div>
    `)
  } else if (menuTab === 'story') {
    if (state.phase === 'dual') {
      subRows.push(`
        <div class="subnav-row">
          <button type="button" class="nav-btn ${state.scene === 'job' ? 'active' : ''}" data-go="job" title="Подработка на чужой точке — задачи и карьера">Смена</button>
          <button type="button" class="nav-btn ${state.scene === 'lounge' ? 'active' : ''}" data-go="lounge" title="Свой лаунж — закупки, заказы и расширения">Мой лаунж</button>
        </div>
      `)
    }
    if (showJobSubnav(state, menuTab)) {
      const overviewLabel =
        state.phase === 'ownOnly' || (state.phase === 'dual' && state.scene === 'lounge')
      const shopTitle = showTobaccoCatalogInShop(state)
        ? 'Магазин — инструменты и заказ табака'
        : 'Магазин — инструменты ускоряют задачи смены'
      subRows.push(`
        <div class="subnav-row">
          <button type="button" class="nav-btn ${storySubTab === 'tasks' ? 'active' : ''}" data-story-sub="tasks" title="${overviewLabel ? 'Обзор лаунжа' : 'Задачи смены и карьера'}">${overviewLabel ? 'Обзор' : 'Задачи'}</button>
          <button type="button" class="nav-btn ${storySubTab === 'shop' ? 'active' : ''}" data-story-sub="shop" title="${shopTitle}">Магазин</button>
        </div>
      `)
    }
  }

  nav.innerHTML = subRows.join('')
  nav.querySelectorAll('[data-career-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onCareerSubTab((btn as HTMLElement).dataset.careerSub as CareerSubTab)
    })
  })
  nav.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onScene((btn as HTMLElement).dataset.go as 'job' | 'lounge')
    })
  })
  nav.querySelectorAll('[data-story-sub]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onStorySubTab((btn as HTMLElement).dataset.storySub as StorySubTab)
    })
  })

  const syncGuide = (): void => {
    const coach = guideCoach(state, ctx)
    const coachForTab =
      coach?.step === 'dual_tasks' && menuTab !== 'story' ? null : coach
    syncGuideOverlay(root, coachForTab, (dismissedKey) => {
      ackGuideCoach(state, dismissedKey)
      handlers.onGuideAck()
      flushAchievementQueue(root, state, menuTab)
    })
    flushAchievementQueue(root, state, menuTab)
  }

  const nextScrollKey = panelContentScrollKey(
    menuTab,
    storySubTab,
    careerSubTab,
    state,
  )
  const savedScrollTop = panel.scrollTop
  const keepScroll = nextScrollKey === panelScrollKey
  panelScrollKey = nextScrollKey
  const finishPanel = (): void => {
    syncGuide()
    restorePanelScroll(root, panel, keepScroll, savedScrollTop)
  }

  if (menuTab === 'own' && state.phase === 'employed' && ownReady) {
    panel.innerHTML = renderOwnLoungePanel(state)
    wireOwnLoungePanel(panel, handlers)
    finishPanel()
    return
  }

  if (menuTab === 'tobacco' && state.phase !== 'employed') {
    panel.innerHTML = renderTobaccoPanel(state)
    wireTobaccoPanel(panel, handlers)
    finishPanel()
    return
  }

  if (menuTab === 'staff' && state.phase !== 'employed') {
    panel.innerHTML = renderStaffPanel(state)
    wireStaffPanel(panel, handlers)
    finishPanel()
    return
  }

  if (menuTab === 'personal' && state.phase !== 'employed') {
    panel.innerHTML = renderPersonalPanel(state, now)
    wirePersonalPanel(panel, handlers)
    finishPanel()
    return
  }

  if (menuTab === 'network' && state.phase !== 'employed') {
    panel.innerHTML = renderNetworkPanel(state)
    wireNetworkPanel(panel, handlers, root, state)
    finishPanel()
    return
  }

  if (menuTab === 'career') {
    panel.innerHTML = renderCareerPanel(state, careerSubTab)
    wireCareerPanel(panel, handlers)
    finishPanel()
    return
  }

  if (storySubTab === 'shop' && canAccessShopPanel(state)) {
    panel.innerHTML = renderShopPanel(state)
    wireShopPanel(panel, handlers)
  } else if (state.scene === 'job') {
    panel.innerHTML = renderJobStoryPanel(state, now)
    wireJobStoryPanel(panel, handlers)
  } else {
    panel.innerHTML = renderLoungePanel(state, now)
    wireLoungePanel(panel, handlers)
  }

  finishPanel()
}

function renderJobTasksBlock(state: GameState, now: number): string {
  const payMult = jobTaskPayMult(state)
  const venueCd = jobTaskCooldownMult(state)
  return JOB_TASKS.map((t) => {
    const unlocked = isTaskUnlocked(t, state.taskDone)
    if (!unlocked) {
      return `
      <button type="button" class="row-btn task locked" data-task="${t.id}" disabled>
        ${icon('lock', 'row-icon--muted')}
        <span class="row-main">
          <span class="row-title">${t.label}</span>
          <span class="row-sub">${taskUnlockHint(t, state.taskDone)}</span>
        </span>
        <span class="row-meta">закрыто</span>
      </button>
    `
    }
    const cd = Math.round(
      taskCooldownMs(t.cooldownMs, t.id, state.shopOwned) *
        venueCd *
        loungeShopTaskCdMult(state, t.id),
    )
    const pay = taskPay(t.pay, t.id, state.shopOwned, payMult)
    const ready = now >= state.taskReadyAt[t.id]
    const left = Math.max(0, state.taskReadyAt[t.id] - now)
    const speedNote = cd < t.cooldownMs ? ` · ${(cd / 1000).toFixed(1)}с` : ''
    return `
      <button type="button" class="row-btn task ${ready ? 'task-ready' : 'busy'}" data-task="${t.id}" ${ready ? '' : 'disabled'}>
        ${taskIcon(t.id)}
        <span class="row-main">
          <span class="row-title">${t.label}</span>
          <span class="row-sub">${ready ? taskReadySub(t.hint, speedNote, cd) : `ещё ${(left / 1000).toFixed(1)}с`}</span>
        </span>
        <span class="row-meta row-meta--pay">+${pay}</span>
      </button>
    `
  }).join('')
}

function renderJobStoryPanel(state: GameState, now: number): string {
  const rank = rankDef(state.jobRank)
  const venue = getVenue(state.venueId)
  const next = nextRank(state.jobRank)
  const progressRows = promoteProgress(state.jobRank, state.taskDone)
  const progressPct = Math.round(promoteProgressRatio(state.jobRank, state.taskDone) * 100)
  const payMult = rank.payMult * venue.payMult
  const minCost = minOpenLoungeCost(state)
  const progressLine = progressRows.length
    ? progressRows.map((p) => `${p.label} ${p.have}/${p.need}`).join(' · ')
    : ''
  const careerBlock = `
    <div class="milestone career">
      <div class="milestone-head">
        <span>Карьера · сейчас «${rank.title}»</span>
        <span>${payMult !== 1 ? `×${payMult.toFixed(2)}` : 'оплата ×1'}</span>
      </div>
      ${
        next
          ? `<p class="row-sub career-rank-next">До «${next.title}»</p>
             <p class="row-sub career-rank-progress">${progressLine || 'считаем задачи…'}</p>
             <div class="bar" aria-label="Прогресс до следующего ранга ${progressPct}%"><i style="width:${progressPct}%"></i></div>`
          : `<p class="row-sub">Макс. ранг — копи на свой лаунж</p>`
      }
    </div>
  `

  const tasks = renderJobTasksBlock(state, now)

  let milestone = ''
  if (state.phase === 'employed') {
    const ready = canBrowseLoungeOffer(state)
    const progress = Math.min(1, state.cash / minCost)
    const hint = ready
      ? 'Открыта вкладка «Свой лаунж»'
      : `До вкладки «Свой лаунж»`
    milestone = `
      <div class="milestone">
        <div class="milestone-head">
          <span>${hint}</span>
          <span>${formatMoney(Math.min(state.cash, minCost))} / ${formatMoney(minCost)}</span>
        </div>
        <div class="bar"><i style="width:${progress * 100}%"></i></div>
        <button type="button" class="row-btn accent row-btn--solo" data-open ${ready ? '' : 'disabled'}>
          <span class="row-main">
            <span class="row-title">${ready ? 'Выбрать лаунж' : 'Копим на лаунж'}</span>
            <span class="row-sub">${LOUNGE_TIERS.map((t) => formatMoney(loungeTierCost(state, t.cost))).join(' · ')}</span>
          </span>
        </button>
      </div>
    `
  }

  const bareHandsNote =
    bareHandsStillPossible(state.shopOwned, state.taskDone.wash)
      ? `<p class="shop-note shop-note--tip">Трофей «Голыми руками»: ${BARE_HANDS_WASH_NEED} моек до покупки шуруповёрта — потом можно купить инструмент.</p>`
      : ''

  return `
    <div class="list">
      <p class="section-label">Задачи смены</p>
      ${bareHandsNote}
      <div class="job-tasks" data-job-tasks>${tasks}</div>
      <p class="section-label">Карьера</p>
      ${careerBlock}
      ${milestone ? `<p class="section-label">Свой лаунж</p>${milestone}` : ''}
    </div>
  `
}

function renderOwnLoungePanel(state: GameState): string {
  const tiers = LOUNGE_TIERS.map((tier) => {
    const tierCost = loungeTierCost(state, tier.cost)
    const can = state.cash >= tierCost
    const need = Math.ceil(tierCost - state.cash)
    const bonus = [
      `доход ×${tier.incomeMult}`,
      `заказ ×${tier.clickMult}`,
      tierShopBonusLabel(tier),
    ]
      .join(' · ')
    const sub = can
      ? `${tier.blurb} · ${bonus}`
      : `Ещё ${formatMoney(need)} — и можно открыть`
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : 'locked'}" data-tier="${tier.id}" ${can ? '' : 'disabled'}>
        ${tierIcon(tier.id)}
        <span class="row-main">
          <span class="row-title">${tier.name} · ${tier.vibe}</span>
          <span class="row-sub">${sub}</span>
        </span>
        <span class="row-meta">${formatMoney(tierCost)}</span>
      </button>
    `
  }).join('')

  const affordable = LOUNGE_TIERS.filter((t) => state.cash >= t.cost)
  const nextUp = LOUNGE_TIERS.find((t) => state.cash < t.cost)

  return `
    <div class="list">
      <button type="button" class="text-btn own-back" data-own-back>← Назад к смене</button>
      <div class="milestone">
        <div class="milestone-head">
          <span>Какой лаунж открыть?</span>
          <span>${formatMoney(state.cash)}</span>
        </div>
        <p class="row-sub shop-note">
          Инструменты с прошлой смены не переносятся — только то, что в тарифе.
          ${
            affordable.length
              ? ` Доступно: ${affordable.map((t) => t.name).join(', ')}.`
              : ' Пока ни на один тариф не хватает.'
          }
          ${
            nextUp
              ? ` Подкопи до ${formatMoney(nextUp.cost)} — откроется «${nextUp.name}».`
              : ' Можно брать любой тариф.'
          }
          ${
            bareHandsStillPossible(state.shopOwned, state.taskDone.wash)
              ? ' Трофей «Голыми руками» — только без шуруповёрта: «Первая тяга» или 35 моек до тарифа с инструментом в комплекте.'
              : ''
          }
        </p>
      </div>
      ${tiers}
    </div>
  `
}

function wireOwnLoungePanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelector('[data-own-back]')?.addEventListener('click', () => {
    handlers.onCancelLoungePick()
  })
  panel.querySelectorAll('[data-tier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onOpenLounge((btn as HTMLElement).dataset.tier as LoungeTierId)
    })
  })
}

function wireJobTasks(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onJobTask((btn as HTMLElement).dataset.task as TaskId)
    })
  })
}

function wireJobStoryPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  wireJobTasks(panel, handlers)
  panel.querySelector('[data-open]')?.addEventListener('click', () => handlers.onBeginLoungePick())
}

function renderCareerTrackPanel(state: GameState): string {
  const { total } = achievementProgress(state)
  const day = displayWorkDay(state.career.workDays)
  const dayPct = Math.round(workDayProgressRatio(state.career.dayProgressSec) * 100)
  const score = careerScore(state)
  const scoreParts = careerScoreBreakdown(state)
  const hall = loadHallOfFame()

  const hallRows =
    hall.length === 0
      ? `<p class="row-sub shop-note">Пока пусто — сброс карьеры сохраняет прогон в зал славы.</p>`
      : hall
          .slice(0, 8)
          .map(
            (r, i) => `
      <div class="career-hall-row ${i === 0 ? 'top' : ''}">
        <span class="career-hall-name">${r.playerName}</span>
        <span class="career-hall-meta">${r.score} очк. · день ${r.workDays} · ${r.achievements}/${total} троф.</span>
      </div>
    `,
          )
          .join('')

  let compareBlock = ''
  if (careerCompareCard) {
    compareBlock = `
      <div class="milestone career career-compare">
        <div class="milestone-head">
          <span>Сравнение с ${careerCompareCard.n}</span>
          <button type="button" class="link-btn" data-career-compare-clear>×</button>
        </div>
        <p class="row-sub shop-note">Ты: ${score} очк. · день ${day} · ${careerCompareCard.n}: ${careerCompareCard.s} очк. · день ${careerCompareCard.d}</p>
      </div>
    `
  }

  const scoreBreakdownRows =
    scoreParts.length > 0
      ? scoreParts
          .map(
            (p) =>
              `<li><span>${p.label}</span><span class="career-score-pts">+${p.points}</span></li>`,
          )
          .join('')
      : `<li class="career-score-empty"><span>Пока 0 — трофеи, зал, смена и личный бренд</span></li>`

  return `
    <div class="list career-panel">
      <div class="career-day-strip">
        <div class="career-day-head">
          <span class="career-day-label">${weekdayOf(state).name} · день ${day}</span>
          <span class="career-day-meta">${dayPct}% смены</span>
        </div>
        <div class="bar career-day-bar"><i style="width:${dayPct}%"></i></div>
        ${
          quietUiCopy()
            ? ''
            : `<p class="row-sub shop-note">1 день = ${Math.round(SECONDS_PER_WORK_DAY / 60)} мин в игре · неделя — по тапу на часы в шапке · активно ${Math.floor(state.career.totalActiveSec / 60)} мин</p>`
        }
      </div>

      <p class="section-label">Очки карьеры · ${score}</p>
      <div class="career-score-box">
        ${
          quietUiCopy()
            ? ''
            : `<p class="row-sub shop-note">Рейтинг прокачки для зала славы и сравнения с друзьями. <strong>Дни на очки не влияют</strong> — только достижения и прогресс.</p>
        <ul class="career-score-rules">
          <li><span>Трофеи</span><span>+8 / +20 / +50 / +150 по тиру</span></li>
          <li><span>Смена + лаунж / только свой</span><span>+40 / +70</span></li>
          <li><span>Тариф лаунжа</span><span>+20 / +45 / +80</span></li>
          <li><span>Филиал сети</span><span>+30 за точку</span></li>
          <li><span>Узнаваемость</span><span>до +40</span></li>
          <li><span>Грейд роликов</span><span>+5 за грейд</span></li>
          <li><span>Должность на смене</span><span>+12 / +24</span></li>
        </ul>`
        }
        <p class="career-score-now">Сейчас у тебя · ${score}</p>
        <ul class="career-score-breakdown">${scoreBreakdownRows}</ul>
      </div>

      <p class="section-label">Соревнование</p>
      <div class="career-actions">
        <button type="button" class="row-btn shop afford" data-career-share>
          ${icon('share')}
          <span class="row-main">
            <span class="row-title">Скопировать код карьеры</span>
            <span class="row-sub">Отправь другу — он вставит код в «Карьера»</span>
          </span>
        </button>
        <button type="button" class="row-btn shop" data-career-import>
          ${icon('trophy')}
          <span class="row-main">
            <span class="row-title">Сравнить с другом</span>
            <span class="row-sub">Вставить код чужой карьеры</span>
          </span>
        </button>
      </div>
      ${compareBlock}

      <p class="section-label">Зал славы</p>
      ${quietUiCopy() ? '' : `<p class="row-sub shop-note">Лучшие прогоны на этом устройстве (после сброса карьеры).</p>`}
      <div class="career-hall">${hallRows}</div>
    </div>
  `
}

function renderCareerTrophiesPanel(state: GameState): string {
  const { done, total, platinum } = achievementProgress(state)

  const sections = TROPHY_TIERS.map((tier) => {
    const list = achievementsByTier(tier)
    const { done: td, total: tt } = achievementTierProgress(state, tier)
    const rows = list.map((a) => renderTrophyRow(state, a, tier)).join('')
    return `
      <section class="trophy-tier trophy-tier--${tier}">
        <header class="trophy-tier__head">
          <p class="trophy-tier__title">${TROPHY_TIER_LABEL[tier]}</p>
          <p class="trophy-tier__count">${tier === 'platinum' ? (platinum ? 'получено' : 'ещё нет') : tier === 'secret' ? (td > 0 ? `${td}/${tt}` : '???') : `${td}/${tt}`}</p>
        </header>
        <div class="trophy-tier__list">${rows}</div>
      </section>
    `
  }).join('')

  return `
    <div class="list career-panel">
      <div class="achieve-summary achieve-summary--trophies">
        <p class="achieve-summary-title">Трофеи</p>
        <p class="achieve-summary-count">${done} из ${total}${platinum ? ' · платина' : ''} · очки зависят от тира</p>
        <div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
      </div>
      ${
        quietUiCopy()
          ? ''
          : `<p class="row-sub shop-note">Бронза — старт. Серебро — отказ и системы. Золото — дорогие развилки. Секреты молчат, пока не откроешь. Платина — собрать всё.</p>`
      }
      ${sections}
    </div>
  `
}

function renderTrophyRow(state: GameState, a: AchievementDef, tier: TrophyTier): string {
  const unlocked = isAchievementUnlocked(state, a.id)
  const secretLocked = tier === 'secret' && !unlocked
  const title = secretLocked ? '???' : a.title
  const progress = secretLocked ? null : achievementProgressLabel(a, state)
  const hint = secretLocked ? '' : a.hint
  const sub = secretLocked
    ? ''
    : quietUiCopy()
      ? progress || ''
      : progress
        ? `${hint} · ${progress}`
        : hint
  const meta = unlocked ? 'получено' : secretLocked ? '' : `+${formatMoney(a.reward)}`
  const iconName = unlocked ? 'trophy' : 'lock'
  return `
    <div class="row-btn achievement achievement--${tier} ${unlocked ? 'unlocked' : 'locked'}${secretLocked ? ' achievement--secret' : ''}">
      ${icon(iconName, unlocked ? 'row-icon--gold' : 'row-icon--muted')}
      <span class="row-main">
        <span class="row-title">${title}</span>
        ${sub ? `<span class="row-sub">${sub}</span>` : ''}
      </span>
      ${meta ? `<span class="row-meta">${meta}</span>` : '<span class="row-meta"></span>'}
    </div>
  `
}

function renderCareerResetFooter(): string {
  return `
    <div class="career-footer">
      <button type="button" class="text-btn text-btn--danger" data-reset>Сбросить карьеру</button>
      <p class="row-sub shop-note">Имя и прогресс сбросятся; трофеи останутся. Прогон попадёт в зал славы.</p>
    </div>
  `
}

function renderCareerPanel(state: GameState, sub: CareerSubTab): string {
  const body =
    sub === 'trophies' ? renderCareerTrophiesPanel(state) : renderCareerTrackPanel(state)
  return `${body}${renderCareerResetFooter()}`
}

function wireCareerPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelector('[data-career-share]')?.addEventListener('click', () => {
    handlers.onShareCareer()
  })
  panel.querySelector('[data-career-import]')?.addEventListener('click', () => {
    const code = prompt('Вставь код карьеры друга:')
    if (code?.trim()) handlers.onImportCareer(code.trim())
  })
  panel.querySelector('[data-career-compare-clear]')?.addEventListener('click', () => {
    handlers.onClearCareerCompare()
  })
  panel.querySelector('[data-reset]')?.addEventListener('click', () => {
    handlers.onReset()
  })
}

function tobaccoRowSub(state: GameState, t: ReturnType<typeof getTobacco>, onShelf = false): string {
  if (!t) return ''
  const base = tobaccoBonusLabel(t)
  if (!isAmbassador(state, t.id)) return base
  if (onShelf) return `${base} · ${ambassadorShelfBonusLabel()}`
  return `${base} · амбассадор — выставь на полку`
}

function renderAmbassadorBlock(state: GameState): string {
  const p = state.personal
  const open = isAmbassadorSectionUnlocked(state)
  const signed = ambassadorCount(state)
  const bonusLabel = ambassadorShelfBonusLabel()
  const personalBonusLabel = personalRepBonusLabel()

  if (!open) {
    const prog = Math.round(ambassadorSectionProgress(state) * 100)
    const rep = ambassadorReputationScore(p.fame, p.media)
    return `
      <p class="section-label">Амбассадор</p>
      <div class="milestone career">
        <div class="milestone-head">
          <span>Контракт с брендом</span>
          <span>${p.fame}/${AMBASSADOR_UNLOCK_FAME} узн. · ${p.media}/${AMBASSADOR_UNLOCK_MEDIA} мед. · рейт. ${rep}/${AMBASSADOR_UNLOCK_REP}</span>
        </div>
        <div class="bar"><i style="width:${prog}%"></i></div>
        ${
          quietUiCopy()
            ? ''
            : `<p class="row-sub shop-note">Узн. и мед. вместе, рейтинг (узн.+мед.×0.55), лауреат «Гайд Мастерс» или 2 филиала — откроют контракты раньше</p>`
        }
      </div>
    `
  }

  const rows = TOBACCOS.map((t) => {
    const owned = !!state.ownedTobacco[t.id]
    const hasDeal = isAmbassador(state, t.id)
    const onShelf = state.shelfActive.includes(t.id)
    const need = ambassadorNeeds(t.id)
    const cost = ambassadorContractCost(t)
    const can = canSignAmbassador(state, t.id)
    const otherBrand = currentAmbassadorId(state)
    const blockedByOther = otherBrand !== null && otherBrand !== t.id

    if (hasDeal) {
      return `
        <button type="button" class="row-btn shop afford ${onShelf ? 'ambassador-live' : ''}" data-ambassador-break="${t.id}">
          ${tobaccoIcon(t.id)}
          <span class="row-main">
            <span class="row-title">${t.brand} · ${t.name}</span>
            <span class="row-sub">${onShelf ? `${bonusLabel} · ${personalBonusLabel}` : `${personalBonusLabel} · выставь на полку — вкладка «Табак»`}</span>
          </span>
          <span class="row-meta row-meta--action">расторгнуть</span>
        </button>
      `
    }

    if (!owned) {
      return `
        <div class="row-btn shop locked">
          ${icon('lock', 'row-icon--muted')}
          <span class="row-main">
            <span class="row-title">${t.brand}</span>
            <span class="row-sub">Закажи «${t.name}» — Магазин во вкладке «Сюжет»</span>
          </span>
          <span class="row-meta">—</span>
        </div>
      `
    }

    if (blockedByOther) {
      const other = getTobacco(otherBrand)
      return `
        <div class="row-btn shop locked">
          ${tobaccoIcon(t.id)}
          <span class="row-main">
            <span class="row-title">${t.brand} · ${t.name}</span>
            <span class="row-sub">Сначала расторгни «${other?.brand ?? 'контракт'}» — один бренд за раз</span>
          </span>
          <span class="row-meta">—</span>
        </div>
      `
    }

    const fameOk = p.fame >= need.fame
    const mediaOk = p.media >= need.media
    const rep = ambassadorReputationScore(p.fame, p.media)
    const repOk = rep >= need.rep
    const reqLine =
      (fameOk && mediaOk) || repOk
        ? `${bonusLabel} · ${personalBonusLabel} · контракт ${formatMoney(cost)}`
        : `Нужно узн. ${need.fame}+ и мед. ${need.media}+ или рейт. ${need.rep}+ · сейчас ${p.fame}/${p.media} · рейт. ${rep}`

    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''}" data-ambassador-sign="${t.id}" ${can ? '' : 'disabled'}>
        ${tobaccoIcon(t.id)}
        <span class="row-main">
          <span class="row-title">${t.brand} · ${t.name}</span>
          <span class="row-sub">${reqLine}</span>
        </span>
        <span class="row-meta">${formatMoney(cost)}</span>
      </button>
    `
  }).join('')

  return `
    <p class="section-label">Амбассадор</p>
    ${sectionPurpose('Один контракт с брендом → усиление вкуса на полке · вкладка «Табак»')}
    ${
      signed > 0
        ? `<p class="row-sub shop-note">Контракт с одним брендом · ${bonusLabel} на полке · ${personalBonusLabel} к узн. и мед. · расторгнуть — сменить бренд</p>`
        : ''
    }
    ${rows}
  `
}

function renderTobaccoCatalogRows(state: GameState): string {
  const catalog = TOBACCOS.filter((t) => !state.ownedTobacco[t.id])
  if (!catalog.length) {
    return '<p class="empty-note">Весь каталог уже заказан.</p>'
  }
  return catalog
    .map((t) => {
      const can = state.cash >= t.cost
      return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''}" data-order-tobacco="${t.id}" ${can ? '' : 'disabled'}>
        ${tobaccoIcon(t.id)}
        <span class="row-main">
          <span class="row-title">${t.name}</span>
          <span class="row-sub">${
            quietUiCopy() ? tobaccoBonusLabel(t) : `${t.blurb} · ${tobaccoBonusLabel(t)}`
          }</span>
        </span>
        <span class="row-meta">${formatMoney(t.cost)}</span>
      </button>
    `
    })
    .join('')
}

function renderTobaccoPanel(state: GameState): string {
  const cap = shelfCapacity(state)
  const active = shelfActiveCount(state)
  const stock = tobaccoStockCount(state)
  const mood = shelfMood(state)

  const onShelf = state.shelfActive
    .map((id) => {
      const t = getTobacco(id)
      if (!t) return ''
      return `
        <button type="button" class="row-btn shop afford ${isAmbassador(state, id) ? 'ambassador-live' : ''}" data-shelf-off="${id}">
          ${tobaccoIcon(id)}
          <span class="row-main">
            <span class="row-title">${t.name}${isAmbassador(state, id) ? ' · амбассадор' : ''}</span>
            <span class="row-sub">${tobaccoRowSub(state, t, true)}</span>
          </span>
          <span class="row-meta row-meta--action">убрать</span>
        </button>
      `
    })
    .join('')

  const inStockOffShelf = TOBACCOS.filter(
    (t) => state.ownedTobacco[t.id] && !state.shelfActive.includes(t.id),
  )
    .map(
      (t) => `
      <button type="button" class="row-btn shop ${active < cap ? 'afford' : ''} ${isAmbassador(state, t.id) ? 'ambassador-live' : ''}" data-shelf-on="${t.id}" ${active < cap ? '' : 'disabled'}>
        ${tobaccoIcon(t.id)}
        <span class="row-main">
          <span class="row-title">${t.name}${isAmbassador(state, t.id) ? ' · амбассадор' : ''}</span>
          <span class="row-sub">${tobaccoRowSub(state, t, false)}</span>
        </span>
        <span class="row-meta row-meta--action">на полку</span>
      </button>
    `,
    )
    .join('')

  const emptyShelf =
    !onShelf && !inStockOffShelf
      ? '<p class="empty-note">Пусто — закажи вкусы в «Магазине» (Сюжет), потом выставь сюда на полку.</p>'
      : !onShelf
        ? '<p class="empty-note">На полке пусто — выставь вкус со склада ниже.</p>'
        : ''

  return `
    <div class="list">
      <div class="milestone career shelf-status">
        <div class="milestone-head">
          <span>Табачная полка</span>
          <span>${active}/${cap} на полке · ${stock} на складе${
            mood === 'empty' || mood === 'sparse'
              ? ' · мало вкусов'
              : mood === 'rich'
                ? ' · богатый выбор'
                : ''
          }</span>
        </div>
        <div class="bar"><i style="width:${cap ? (active / cap) * 100 : 0}%"></i></div>
      </div>

      ${sectionPurpose(
        isAmbassadorSectionUnlocked(state)
          ? 'Склад и полка · закупка — в «Магазине» · амбассадор усиливает свой вкус'
          : 'Склад и полка · закупка вкусов — «Сюжет» → «Магазин» · пустая полка режет поток',
      )}

      <p class="section-label">На полке сейчас</p>
      ${onShelf || emptyShelf}

      ${
        inStockOffShelf
          ? `<p class="section-label">На складе — можно выставить</p>${inStockOffShelf}`
          : stock === 0
            ? `<p class="section-label">Склад</p><p class="empty-note">Пока пусто. Открой «Сюжет» → «Магазин» → табачный магазин.</p>`
            : ''
      }
    </div>
  `
}

function renderStaffPanel(state: GameState): string {
  const payroll = staffPayrollPerSec(state)
  const net = loungeIncomePerSec(state)
  const team = hiredStaffCount(state)
  const teamMax = maxTeamHeadcount()

  const cards = STAFF_ROLES.map((role) => {
    const members = staffMembers(state, role.id)
    const max = maxStaffForRole(role.id)
    const first = getStaffGradeDef(role.id, 1)
    if (!first) return ''

    if (members.length === 0) {
      const hireCost = scaledStaffHireCost(state, first.hireCost)
      const can = state.cash >= hireCost
      return `
        <button type="button" class="staff-role-card staff-role-card--hire ${can ? 'afford' : ''}" data-hire-staff="${role.id}" ${can ? '' : 'disabled'}>
          <span class="staff-role-icon">${staffIcon(role.id)}</span>
          <span class="staff-role-main">
            <span class="staff-role-name">${role.name}</span>
            <span class="staff-role-blurb">${role.blurb}</span>
          </span>
          <span class="staff-role-meta">${formatMoney(hireCost)}</span>
        </button>
      `
    }

    const rolePayroll = members.reduce(
      (sum, g) => sum + (getStaffGradeDef(role.id, g)?.salaryPerSec ?? 0),
      0,
    )

    const roster = members
      .map((grade, index) => {
        const current = getStaffGradeDef(role.id, grade)
        if (!current) return ''
        const next = grade < 4 ? getStaffGradeDef(role.id, grade + 1) : null
        const dots = [1, 2, 3, 4]
          .map((g) => `<span class="grade-dot ${g <= grade ? 'is-on' : ''}"></span>`)
          .join('')
        const num =
          members.length > 1
            ? `<span class="staff-member-num">${index + 1}</span>`
            : ''

        const upgradeBtn = next
          ? (() => {
              const upCost = scaledStaffHireCost(state, next.hireCost)
              const canUp = state.cash >= upCost
              return `<button type="button" class="staff-act staff-act--up ${canUp ? 'afford' : ''}" data-upgrade-staff="${role.id}" data-staff-idx="${index}" ${canUp ? '' : 'disabled'} title="→ ${next.title}"><span class="staff-up-cost">${formatMoney(upCost)}</span><span class="staff-up-icon">↑</span></button>`
            })()
          : `<span class="staff-act staff-act--max" title="Макс. грейд">★</span>`

        return `
          <div class="staff-member">
            ${num}
            <span class="staff-member-title">${current.title}</span>
            <div class="grade-dots" aria-label="Грейд ${grade} из 4">${dots}</div>
            <div class="staff-member-actions">
              ${upgradeBtn}
              <button type="button" class="staff-act staff-act--fire" data-fire-staff="${role.id}" data-staff-idx="${index}" title="Уволить">×</button>
            </div>
          </div>
        `
      })
      .join('')

    const addBlock =
      members.length < max
        ? (() => {
            const addCost = scaledStaffHireCost(state, extraStaffHireCost(role.id, 1))
            const canAdd = state.cash >= addCost
            return `
          <button type="button" class="staff-role-add ${canAdd ? 'afford' : ''}" data-add-staff="${role.id}" ${canAdd ? '' : 'disabled'}>
            <span>+ Ещё ${role.name.toLowerCase()}</span>
            <span>${formatMoney(addCost)} · с 1-го грейда</span>
          </button>
        `
          })()
        : ''

    return `
      <div class="staff-role-card">
        <div class="staff-role-head">
          <span class="staff-role-icon">${staffIcon(role.id)}</span>
          <div class="staff-role-main">
            <div class="staff-role-title-row">
              <span class="staff-role-name">${role.name}</span>
              <span class="staff-role-count">${members.length}/${max}</span>
            </div>
            <span class="staff-role-blurb">${
              quietUiCopy() ? `${rolePayroll.toFixed(1)}/с` : `${role.blurb} · ${rolePayroll.toFixed(1)}/с`
            }</span>
          </div>
        </div>
        <div class="staff-roster">${roster}</div>
        ${addBlock}
      </div>
    `
  }).join('')

  return `
    <div class="list staff-panel">
      ${sectionPurpose('Команда усиливает лаунж · зарплата списывается из выручки')}
      <div class="milestone career shelf-status">
        <div class="milestone-head">
          <span>Команда · ${team}/${teamMax}</span>
          <span>Чистыми ${formatMoney(net)}/с${
            payroll > 0 ? ` · ФОТ ${Math.round(staffPayrollShare(state) * 100)}%` : ''
          }</span>
        </div>
        <div class="bar"><i style="width:${teamMax ? (team / teamMax) * 100 : 0}%"></i></div>
      </div>
      ${cards}
    </div>
  `
}

function wireStaffPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-hire-staff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onHireStaff((btn as HTMLElement).dataset.hireStaff as StaffId)
    })
  })
  panel.querySelectorAll('[data-upgrade-staff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement
      handlers.onUpgradeStaff(
        el.dataset.upgradeStaff as StaffId,
        Number(el.dataset.staffIdx ?? 0),
      )
    })
  })
  panel.querySelectorAll('[data-add-staff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onAddStaff((btn as HTMLElement).dataset.addStaff as StaffId)
    })
  })
  panel.querySelectorAll('[data-fire-staff]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement
      handlers.onFireStaff(el.dataset.fireStaff as StaffId, Number(el.dataset.staffIdx ?? 0))
    })
  })
}

function wireTobaccoPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-order-tobacco]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyTobacco((btn as HTMLElement).dataset.orderTobacco as TobaccoId)
    })
  })
  panel.querySelectorAll('[data-shelf-on]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onPutOnShelf((btn as HTMLElement).dataset.shelfOn as TobaccoId)
    })
  })
  panel.querySelectorAll('[data-shelf-off]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onRemoveFromShelf((btn as HTMLElement).dataset.shelfOff as TobaccoId)
    })
  })
}

function renderNetworkPanel(state: GameState): string {
  const ready = canBrowseEmpire(state)
  const count = branchCount(state)
  const incMult = empireIncomeMult(state)
  const teaser = empireTeaser(state)

  if (!ready) {
    return `
      <div class="list">
        <div class="milestone career">
          <div class="milestone-head">
            <span>Сеть лаунжей</span>
            <span>скоро</span>
          </div>
          <p class="row-sub shop-note">
            ${
              teaser ||
              'Пройди карьеру до конца — откроется второе заведение и дальше сеть.'
            }
          </p>
          <ul class="row-sub shop-note empire-checklist">
            <li class="${state.phase !== 'employed' ? 'done' : ''}">Открыть свой лаунж</li>
            <li class="${state.phase === 'ownOnly' ? 'done' : ''}">Уволиться со смены</li>
          </ul>
        </div>
      </div>
    `
  }

  const selected = normalizeNetworkMapSelection()
  return `
    <div class="list network-map-panel${selected ? ' has-detail' : ''}">
      <div class="network-map-panel__meta">
        <span>${networkLabel(state)}</span>
        <span>${count}/5 · ×${incMult.toFixed(2)}</span>
      </div>
      <div class="city-map" data-city-map style="--city-map-art: url('${cityMapArtUrl()}')">
        <div class="city-map__world">
          <div class="city-map__bloom" aria-hidden="true"></div>
          <div class="city-map__focus" aria-hidden="true"></div>
          ${renderCityMapSvg(state, selected)}
        </div>
        <div class="city-map__dissolve" aria-hidden="true"></div>
      </div>
      <div data-map-detail-slot>${renderNetworkMapDetail(state, selected)}</div>
    </div>
  `
}

/** Быстрое переключение точки: карточка + selected, без пересборки карты/шелла. */
export function patchNetworkMapSelection(
  root: HTMLElement,
  state: GameState,
  handlers: ShellHandlers,
): void {
  const panel = root.querySelector('.network-map-panel') as HTMLElement | null
  if (!panel?.querySelector('[data-city-map]')) {
    handlers.onMenuTab('network')
    return
  }

  const selected = normalizeNetworkMapSelection()
  panel.classList.toggle('has-detail', selected != null)
  panel.querySelectorAll<SVGGElement>('.city-map__pin').forEach((pin) => {
    pin.classList.toggle('is-selected', pin.getAttribute('data-map-pin') === selected)
  })

  const slot = panel.querySelector('[data-map-detail-slot]') as HTMLElement | null
  if (!slot) {
    handlers.onMenuTab('network')
    return
  }

  slot.innerHTML = renderNetworkMapDetail(state, selected)
  wireNetworkMapDetailSlot(slot, root, state, handlers)
}

function wireNetworkMapDetailSlot(
  slot: HTMLElement,
  root: HTMLElement,
  state: GameState,
  handlers: ShellHandlers,
): void {
  slot.querySelector('[data-map-clear]')?.addEventListener('click', (e) => {
    e.stopPropagation()
    touchOgonokInteraction()
    clearNetworkMapSelection()
    patchNetworkMapSelection(root, state, handlers)
  })
  slot.querySelectorAll('[data-branch]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      handlers.onOpenBranch((btn as HTMLElement).dataset.branch as BranchId)
    })
  })
}

function wireNetworkPanel(
  panel: HTMLElement,
  handlers: ShellHandlers,
  root: HTMLElement,
  state: GameState,
): void {
  fitCityMapPinChips(panel)
  requestAnimationFrame(() => fitCityMapPinChips(panel))

  const map = panel.querySelector('[data-city-map]') as HTMLElement | null
  if (map) wireCityMapGestures(map)

  map?.addEventListener('click', (e) => {
    const pin = (e.target as Element).closest('[data-map-pin]')
    const id = pin?.getAttribute('data-map-pin') as CityMapPinId | null
    touchOgonokInteraction()
    if (!id) {
      clearNetworkMapSelection()
      patchNetworkMapSelection(root, state, handlers)
      return
    }
    /* повторный тап по той же точке — закрыть карточку */
    if (getNetworkMapSelection() === id) {
      clearNetworkMapSelection()
    } else {
      setNetworkMapSelection(id)
    }
    patchNetworkMapSelection(root, state, handlers)
  })
  wireNetworkMapDetailSlot(
    panel.querySelector('[data-map-detail-slot]') as HTMLElement || panel,
    root,
    state,
    handlers,
  )
}

function formatCooldownLeft(readyAt: number, now: number): string {
  const left = Math.max(0, readyAt - now)
  if (left <= 0) return ''
  const sec = Math.ceil(left / 1000)
  if (sec >= 60) return ` · через ${Math.ceil(sec / 60)} мин`
  return ` · через ${sec} с`
}

function renderTelegramBlock(state: GameState, now: number): string {
  const grade = state.personal.telegramGrade
  const first = getTelegramGradeDef(1)

  if (grade <= 0 && first) {
    const can = state.cash >= first.upgradeCost
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''}" data-telegram-create ${can ? '' : 'disabled'}>
        ${icon('tab_telegram')}
        <span class="row-main">
          <span class="row-title">Создать Telegram-канал</span>
          <span class="row-sub">Посты — всплеск гостей · связка с роликами</span>
        </span>
        <span class="row-meta">${formatMoney(first.upgradeCost)}</span>
      </button>
    `
  }

  const current = getTelegramGradeDef(grade)
  const next = grade < 4 ? getTelegramGradeDef(grade + 1) : null
  if (!current) return ''

  const tk = state.personal.telegramToolkit
  const passive = telegramPassiveTraffic(grade, tk)
  const dots = gradeDotsHtml(grade)
  const tgBoostLeft = telegramBoostRemainingSec(state, now)
  const postReady = now >= state.personal.telegramPostReadyAt
  const crossPromo = now < state.personal.videoPromoReadyUntil
  const postPreview = telegramPostBoostPreview(grade, tk, crossPromo)
  const postBoost = postPreview.trafficBoost
  const canPost = postReady && state.cash >= current.postCost

  const upgradeRow = next
    ? `
      <button type="button" class="row-btn shop ${state.cash >= next.upgradeCost ? 'afford' : ''}" data-telegram-upgrade ${state.cash >= next.upgradeCost ? '' : 'disabled'}>
        ${icon('tab_telegram')}
        <span class="row-main">
          <span class="row-title">Поднять канал · грейд ${grade + 1}</span>
          <span class="row-sub row-sub--grade">${dots}<span>→ «${next.title}» · +${Math.round(next.passiveTraffic * 100)}% гостей</span></span>
        </span>
        <span class="row-meta">${formatMoney(next.upgradeCost)}</span>
      </button>
    `
    : `
      <div class="row-btn shop owned">
        ${icon('tab_telegram')}
        <span class="row-main">
          <span class="row-title">Telegram · «${current.title}» · макс.</span>
          <span class="row-sub row-sub--grade">${dots}<span>+${Math.round(passive * 100)}% гостей постоянно</span></span>
        </span>
        <span class="row-meta">★ макс.</span>
      </div>
    `

  const toolkitRows = TELEGRAM_TOOLKIT.map((def) => {
    const level = tk[def.id]
    const maxed = level >= def.maxLevel
    const cost = telegramToolkitUpgradeCost(def, level)
    const can = !maxed && state.cash >= cost
    const ui = renderTelegramToolkitRow(def.id, def.name, level, def.maxLevel, def.blurb)
    if (maxed) {
      return `
        <div class="row-btn shop owned">
          ${icon('tab_telegram')}
          <span class="row-main">
            <span class="row-title">${ui.title}</span>
            <span class="row-sub row-sub--grade">${ui.dots}<span>${ui.sub}</span></span>
          </span>
          <span class="row-meta">${ui.meta}</span>
        </div>
      `
    }
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''}" data-telegram-toolkit="${def.id}" ${can ? '' : 'disabled'}>
        ${icon('tab_telegram')}
        <span class="row-main">
          <span class="row-title">${ui.title || def.name}</span>
          <span class="row-sub row-sub--grade">${ui.dots}<span>${ui.sub}</span></span>
        </span>
        <span class="row-meta">${formatMoney(cost)}</span>
      </button>
    `
  }).join('')

  return `
    <div class="milestone career">
      <div class="milestone-head">
        <span>Telegram · «${current.title}» · грейд ${grade}</span>
        <span>+${Math.round(passive * 100)}% гостей</span>
      </div>
      ${
        tgBoostLeft > 0
          ? `<p class="row-sub promo-active-note">Пост в эфире · +${Math.round(state.personal.telegramBoostAmount * 100)}% · ${tgBoostLeft}с</p>`
          : ''
      }
    </div>
    ${upgradeRow}
    <p class="section-label section-label--staff">Инструменты канала</p>
    ${toolkitRows}
    <button type="button" class="row-btn shop ${canPost ? 'afford' : ''} ${crossPromo ? 'promo-cross-live' : ''}" data-telegram-post ${canPost ? '' : 'disabled'}>
      ${icon('tab_telegram')}
      <span class="row-main">
        <span class="row-title">${crossPromo ? 'Анонс ролика в Telegram' : 'Опубликовать пост'}</span>
        <span class="row-sub">${crossPromo ? `Связка · +${Math.round(postBoost * 100)}% гостей · бонус +55%` : `+${Math.round(postBoost * 100)}% гостей на ${Math.round(postPreview.boostMs / 60_000)} мин`}${
          postReady ? '' : formatCooldownLeft(state.personal.telegramPostReadyAt, now)
        }</span>
      </span>
      <span class="row-meta">${formatMoney(current.postCost)}</span>
    </button>
  `
}

function renderPersonalPanel(state: GameState, now: number): string {
  const p = state.personal
  const title = personalTitle(state)
  const status = personalStatusLine(state, now)
  const eventLeft = eventBoostRemainingSec(state, now)
  const tgLeft = telegramBoostRemainingSec(state, now)
  const videoLeft = videoBoostRemainingSec(state, now)
  const tgStatus = telegramStatusLine(state, now)
  const venueReach = personalVenueReach(state)
  const blogger = isBlogger(p.channelLevel)
  const synergyHint = mediaSynergyHint(state, now)
  const videoLevel = blogger ? channelVideoGrade(p.channelGear) : 0
  const tier = videoLevel >= 1 ? channelTierLabel(videoLevel) : ''
  const channelBonus = blogger ? channelTrafficBonus(p.channelGear, true) : 0
  const videoReady = now >= p.videoReadyAt
  const eventReady = now >= p.eventReadyAt
  const awardReady = now >= p.awardReadyAt
  const award = awardWinBreakdown(state)
  const shootReady = canShootVideo(p.channelGear)
  const shootCost = shootReady ? videoShootCost(videoLevel) : 0
  const videoPreview = shootReady
    ? videoActionRewards(videoLevel, venueReach, p.telegramGrade)
    : null
  const videoCdSec =
    shootReady ? Math.round(videoCooldownMs(videoLevel, p.channelGear.montage) / 1000) : 0
  const gearHint = blogger ? videoTierRequirementHint(p.channelGear) : ''
  const reachHint = blogger && shootReady ? mediaActionReachHint(venueReach) : ''
  const canShoot = videoReady && shootReady && state.cash >= shootCost
  const eventSub = `+${Math.round(EVENT_TRAFFIC_BOOST * 100)}% гостей на 2 мин · +${EVENT_FAME_GAIN} узн.${
    eventReady ? '' : formatCooldownLeft(p.eventReadyAt, now)
  }`
  const awardSub = `Шанс ${Math.round(award.chance * 100)}% · победа +${AWARD_WIN_FAME} узн. · +${AWARD_WIN_MEDIA} мед. · ${personalRepBonusLabel()} навсегда${
    awardReady ? '' : formatCooldownLeft(p.awardReadyAt, now)
  }`
  const awardWinner = isGuideMastersWinner(state)
  const awardBlock = awardWinner
    ? `
      <p class="section-label">Премия «Гайд Мастерс»</p>
      <div class="row-btn shop owned">
        ${icon('trophy', 'row-icon--gold')}
        <span class="row-main">
          <span class="row-title">Лауреат премии</span>
          <span class="row-sub">${personalRepBonusLabel()} к узн. и мед. · победа одна на всю карьеру</span>
        </span>
        <span class="row-meta row-meta--status">навсегда</span>
      </div>
    `
    : `
      <p class="section-label">Премия «Гайд Мастерс»</p>
      <div class="milestone career" data-award-breakdown>
        <div class="milestone-head">
          <span>Шанс победы</span>
          <span data-award-chance>${Math.round(award.chance * 100)}%</span>
        </div>
      </div>
      <button type="button" class="row-btn shop ${awardReady ? 'afford' : ''}" data-personal-award ${awardReady ? '' : 'disabled'}>
        ${icon('trophy', 'row-icon--gold')}
        <span class="row-main">
          <span class="row-title">Подать заявку</span>
          <span class="row-sub">${awardSub} · ${pluralRuCount(p.awardAttempts, 'попытка', 'попытки', 'попыток')}</span>
        </span>
        <span class="row-meta row-meta--status">бесплатно</span>
      </button>
    `

  const channelBlock =
    !blogger
      ? `
      <button type="button" class="row-btn shop ${state.cash >= CHANNEL_START_COST ? 'afford' : ''}" data-personal-channel-start ${state.cash >= CHANNEL_START_COST ? '' : 'disabled'}>
        ${icon('tab_personal')}
        <span class="row-main">
          <span class="row-title">Стать блогером</span>
          <span class="row-sub">Ролики — всплеск гостей · постоянный охват от оборудования</span>
        </span>
        <span class="row-meta">${formatMoney(CHANNEL_START_COST)}</span>
      </button>
    `
      : `
      <div class="milestone career">
        <div class="milestone-head">
          <span>Блогер · «Дымный дневник»${videoLevel >= 1 ? ` · грейд ${videoLevel}` : ''}${tier ? ` · ${tier}` : ''}</span>
          <span>${channelBonus > 0 ? `+${Math.round(channelBonus * 100)}% гостей` : 'без охвата'}${
            shootReady ? ` · ~${videoCdSec}с` : ''
          }</span>
        </div>
        ${
          !shootReady && gearHint
            ? `<p class="row-sub shop-note">${gearHint}</p>`
            : reachHint && venueReach < 0.75
              ? `<p class="row-sub shop-note">${reachHint}</p>`
              : ''
        }
      </div>
    `

  const gearRows = CHANNEL_GEAR.map((def) => {
    const level = p.channelGear[def.id]
    const maxed = level >= def.maxLevel
    const cost = gearUpgradeCost(def, level)
    const can = blogger && !maxed && state.cash >= cost
    const ui = renderGearGradeRow(def.id, def.name, level, def.maxLevel, def.blurb)
    if (maxed) {
      return `
        <div class="row-btn shop owned">
          ${channelGearIcon(def.id)}
          <span class="row-main">
            <span class="row-title">${ui.title}</span>
            <span class="row-sub row-sub--grade">${ui.dots}<span>${ui.sub}</span></span>
          </span>
          <span class="row-meta">${ui.meta}</span>
        </div>
      `
    }
    if (!blogger) {
      return `
        <button type="button" class="row-btn shop locked" disabled>
          ${icon('lock', 'row-icon--muted')}
          <span class="row-main">
            <span class="row-title">${def.name}</span>
            <span class="row-sub">Сначала стань блогером</span>
          </span>
          <span class="row-meta">—</span>
        </button>
      `
    }
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''}" data-personal-gear="${def.id}" ${can ? '' : 'disabled'}>
        ${channelGearIcon(def.id)}
        <span class="row-main">
          <span class="row-title">${ui.title}</span>
          <span class="row-sub row-sub--grade">${ui.dots}<span>${ui.sub}</span></span>
        </span>
        <span class="row-meta">${formatMoney(cost)}</span>
      </button>
    `
  }).join('')

  const videoBlock =
    blogger
      ? `
      <button type="button" class="row-btn shop ${canShoot ? 'afford' : ''}" data-personal-video ${canShoot ? '' : 'disabled'}>
        ${icon('video')}
        <span class="row-main">
          <span class="row-title">${shootReady ? `Снять ролик · грейд ${videoLevel}` : 'Снять ролик'}</span>
          <span class="row-sub">${
            shootReady && videoPreview
              ? `+${Math.round(videoPreview.trafficBoost * 100)}% гостей · +${videoPreview.cash} ₽${
                  videoPreview.fame > 0 ? ` · +${videoPreview.fame} узн.` : ''
                }${videoPreview.media > 0 ? ` · +${videoPreview.media} мед.` : ''}`
              : gearHint || 'Сначала всё оборудование на 1-м грейде'
          }${videoReady || !shootReady ? '' : formatCooldownLeft(p.videoReadyAt, now)}</span>
        </span>
        <span class="row-meta">${shootReady ? formatMoney(shootCost) : formatMoney(VIDEO_BASE_COST)}</span>
      </button>
      ${
        shootReady && reachHint
          ? `<p class="row-sub shop-note">${reachHint}</p>`
          : ''
      }
    `
      : ''

  return `
    <div class="list personal-panel">
      <div class="milestone career personal-stats">
        <div class="milestone-head">
          <span>${state.playerName || 'Ты'} · ${title}</span>
          <span>${status}</span>
        </div>
        <div class="personal-bars">
          <div class="personal-bar">
            <span class="personal-bar-label">Узнаваемость</span>
            <div class="bar"><i style="width:${Math.min(100, (p.fame / 75) * 100)}%"></i></div>
            <span class="personal-bar-val">${p.fame}</span>
          </div>
          <div class="personal-bar">
            <span class="personal-bar-label">Медийность</span>
            <div class="bar"><i style="width:${Math.min(100, (p.media / 75) * 100)}%"></i></div>
            <span class="personal-bar-val">${p.media}</span>
          </div>
        </div>
        <p class="row-sub shop-note">Накопительные шкалы — только растут, от действий не падают</p>
        ${
          eventLeft > 0
            ? `<p class="row-sub promo-active-note" data-boost-note>Мероприятие: +${Math.round(p.eventBoostAmount * 100)}% гостей · ещё ${eventLeft} с</p>`
            : videoLeft > 0
              ? `<p class="row-sub promo-active-note" data-boost-note>Ролик в эфире · +${Math.round(p.videoBoostAmount * 100)}% гостей · ${videoLeft}с</p>`
              : tgLeft > 0
                ? `<p class="row-sub promo-active-note" data-boost-note>${tgStatus ?? ''}</p>`
                : ''
        }
      </div>

      <p class="section-label">Блог</p>
      ${channelBlock}
      <p class="section-label">Оборудование канала</p>
      ${sectionPurpose('Поднимает грейд ролика → сильнее всплеск гостей')}
      ${gearRows}
      ${videoBlock}
      ${
        synergyHint
          ? `<p class="row-sub ${now < p.videoPromoReadyUntil && p.telegramGrade > 0 ? 'promo-active-note' : 'shop-note'}" data-synergy-note>${synergyHint}</p>`
          : ''
      }

      <p class="section-label">Telegram</p>
      ${renderTelegramBlock(state, now)}

      ${renderAmbassadorBlock(state)}

      <p class="section-label">Мероприятие в лаунже</p>
      <button type="button" class="row-btn shop ${eventReady && state.cash >= EVENT_COST ? 'afford' : ''}" data-personal-event ${eventReady && state.cash >= EVENT_COST ? '' : 'disabled'}>
        ${icon('lounge')}
        <span class="row-main">
          <span class="row-title">Вечер дегустации у себя</span>
          <span class="row-sub">${eventSub}</span>
        </span>
        <span class="row-meta">${formatMoney(EVENT_COST)}</span>
      </button>

      ${awardBlock}
    </div>
  `
}

function wirePersonalPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelector('[data-personal-channel-start]')?.addEventListener('click', () => {
    handlers.onStartChannel()
  })
  panel.querySelectorAll('[data-personal-gear]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onUpgradeChannelGear((btn as HTMLElement).dataset.personalGear as ChannelGearId)
    })
  })
  panel.querySelector('[data-personal-video]')?.addEventListener('click', () => {
    handlers.onShootVideo()
  })
  panel.querySelector('[data-personal-event]')?.addEventListener('click', () => {
    handlers.onHoldEvent()
  })
  panel.querySelector('[data-telegram-create]')?.addEventListener('click', () => {
    handlers.onCreateTelegram()
  })
  panel.querySelector('[data-telegram-upgrade]')?.addEventListener('click', () => {
    handlers.onUpgradeTelegram()
  })
  panel.querySelectorAll('[data-telegram-toolkit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onUpgradeTelegramToolkit((btn as HTMLElement).dataset.telegramToolkit as TelegramToolkitId)
    })
  })
  panel.querySelector('[data-telegram-post]')?.addEventListener('click', () => {
    handlers.onPostTelegram()
  })
  panel.querySelector('[data-personal-award]')?.addEventListener('click', () => {
    handlers.onEnterAward()
  })
  panel.querySelectorAll('[data-ambassador-sign]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onSignAmbassador((btn as HTMLElement).dataset.ambassadorSign as TobaccoId)
    })
  })
  panel.querySelectorAll('[data-ambassador-break]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBreakAmbassador((btn as HTMLElement).dataset.ambassadorBreak as TobaccoId)
    })
  })
}

export function updatePersonalCooldowns(
  root: HTMLElement,
  state: GameState,
  now = Date.now(),
): void {
  if (state.phase === 'employed') return
  const p = state.personal
  const blogger = isBlogger(p.channelLevel)
  const videoLevel = blogger ? channelVideoGrade(p.channelGear) : 0
  const shootReady = canShootVideo(p.channelGear)
  const shootCost = shootReady ? videoShootCost(videoLevel) : 0
  const venueReach = personalVenueReach(state)
  const videoBtn = root.querySelector<HTMLButtonElement>('[data-personal-video]')
  if (videoBtn && blogger) {
    const ready = now >= p.videoReadyAt
    const can = ready && shootReady && state.cash >= shootCost
    videoBtn.disabled = !can
    videoBtn.classList.toggle('afford', can)
    const title = videoBtn.querySelector('.row-title')
    if (title) {
      title.textContent = shootReady ? `Снять ролик · грейд ${videoLevel}` : 'Снять ролик'
    }
    const sub = videoBtn.querySelector('.row-sub')
    const rewards = shootReady
      ? videoActionRewards(videoLevel, venueReach, p.telegramGrade)
      : null
    const gearHint = videoTierRequirementHint(p.channelGear)
    if (sub) {
      sub.textContent = `${
        shootReady && rewards
          ? `+${Math.round(rewards.trafficBoost * 100)}% гостей · +${rewards.cash} ₽${
              rewards.fame > 0 ? ` · +${rewards.fame} узн.` : ''
            }${rewards.media > 0 ? ` · +${rewards.media} мед.` : ''}`
          : gearHint || 'Сначала всё оборудование на 1-м грейде'
      }${ready || !shootReady ? '' : formatCooldownLeft(p.videoReadyAt, now)}`
    }
    const meta = videoBtn.querySelector('.row-meta')
    if (meta && shootReady) meta.textContent = formatMoney(shootCost)
  }
  const synergyNote = root.querySelector<HTMLElement>('[data-synergy-note]')
  if (synergyNote) {
    const hint = mediaSynergyHint(state, now)
    if (hint) {
      synergyNote.textContent = hint
      synergyNote.hidden = false
      synergyNote.classList.toggle(
        'promo-active-note',
        p.telegramGrade > 0 && now < p.videoPromoReadyUntil,
      )
      synergyNote.classList.toggle(
        'shop-note',
        !(p.telegramGrade > 0 && now < p.videoPromoReadyUntil),
      )
    } else {
      synergyNote.hidden = true
    }
  }
  root.querySelectorAll<HTMLButtonElement>('[data-personal-gear]').forEach((btn) => {
    const id = btn.dataset.personalGear as ChannelGearId
    const def = CHANNEL_GEAR.find((g) => g.id === id)
    if (!def) return
    const level = p.channelGear[id]
    if (level >= def.maxLevel) return
    const cost = gearUpgradeCost(def, level)
    const can = state.cash >= cost
    btn.disabled = !can
    btn.classList.toggle('afford', can)
    const meta = btn.querySelector('.row-meta')
    if (meta) meta.textContent = formatMoney(cost)
  })
  const eventBtn = root.querySelector<HTMLButtonElement>('[data-personal-event]')
  if (eventBtn) {
    const ready = now >= p.eventReadyAt
    const can = ready && state.cash >= EVENT_COST
    eventBtn.disabled = !can
    eventBtn.classList.toggle('afford', can)
    const sub = eventBtn.querySelector('.row-sub')
    if (sub) {
      sub.textContent = `+${Math.round(EVENT_TRAFFIC_BOOST * 100)}% гостей на 2 мин · +${EVENT_FAME_GAIN} узн.${
        ready ? '' : formatCooldownLeft(p.eventReadyAt, now)
      }`
    }
  }
  const awardBtn = root.querySelector<HTMLButtonElement>('[data-personal-award]')
  if (awardBtn) {
    const ready = now >= p.awardReadyAt
    awardBtn.disabled = !ready
    awardBtn.classList.toggle('afford', ready)
    const bd = awardWinBreakdown(state)
    const chanceEl = root.querySelector('[data-award-chance]')
    if (chanceEl) chanceEl.textContent = `${Math.round(bd.chance * 100)}%`
    const sub = awardBtn.querySelector('.row-sub')
    if (sub) {
      sub.textContent = `Шанс ${Math.round(bd.chance * 100)}% · победа +${AWARD_WIN_FAME} узн. · +${AWARD_WIN_MEDIA} мед. · ${personalRepBonusLabel()} навсегда${
        ready ? '' : formatCooldownLeft(p.awardReadyAt, now)
      } · ${pluralRuCount(p.awardAttempts, 'попытка', 'попытки', 'попыток')}`
    }
  }
  const boostNote = root.querySelector<HTMLElement>('[data-boost-note]')
  const eventLeft = eventBoostRemainingSec(state, now)
  const videoLeft = videoBoostRemainingSec(state, now)
  const tgLeft = telegramBoostRemainingSec(state, now)
  const tgStatus = telegramStatusLine(state, now)
  if (boostNote && eventLeft > 0) {
    boostNote.textContent = `Мероприятие: +${Math.round(p.eventBoostAmount * 100)}% гостей · ещё ${eventLeft} с`
    boostNote.hidden = false
  } else if (boostNote && videoLeft > 0) {
    boostNote.textContent = `Ролик в эфире · +${Math.round(p.videoBoostAmount * 100)}% гостей · ${videoLeft}с`
    boostNote.hidden = false
  } else if (boostNote && tgLeft > 0 && tgStatus) {
    boostNote.textContent = tgStatus
    boostNote.hidden = false
  } else if (boostNote) {
    boostNote.hidden = true
  }
  const tgPostBtn = root.querySelector<HTMLButtonElement>('[data-telegram-post]')
  if (tgPostBtn && p.telegramGrade > 0) {
    const def = getTelegramGradeDef(p.telegramGrade)
    if (def) {
      const tk = p.telegramToolkit
      const crossPromo = now < p.videoPromoReadyUntil
      const postReady = now >= p.telegramPostReadyAt
      const canPost = postReady && state.cash >= def.postCost
      tgPostBtn.disabled = !canPost
      tgPostBtn.classList.toggle('afford', canPost)
      tgPostBtn.classList.toggle('promo-cross-live', crossPromo)
      const preview = telegramPostBoostPreview(p.telegramGrade, tk, crossPromo)
      const title = tgPostBtn.querySelector('.row-title')
      if (title) {
        title.textContent = crossPromo ? 'Анонс ролика в Telegram' : 'Опубликовать пост'
      }
      const sub = tgPostBtn.querySelector('.row-sub')
      if (sub) {
        sub.textContent = crossPromo
          ? `Связка · +${Math.round(preview.trafficBoost * 100)}% гостей · бонус +55%${
              postReady ? '' : formatCooldownLeft(p.telegramPostReadyAt, now)
            }`
          : `+${Math.round(preview.trafficBoost * 100)}% гостей на ${Math.round(preview.boostMs / 60_000)} мин${
              postReady ? '' : formatCooldownLeft(p.telegramPostReadyAt, now)
            }`
      }
      const meta = tgPostBtn.querySelector('.row-meta')
      if (meta) meta.textContent = formatMoney(def.postCost)
    }
  }
  const tgUpgradeBtn = root.querySelector<HTMLButtonElement>('[data-telegram-upgrade]')
  if (tgUpgradeBtn && p.telegramGrade > 0 && p.telegramGrade < 4) {
    const next = getTelegramGradeDef(p.telegramGrade + 1)
    if (next) {
      const can = state.cash >= next.upgradeCost
      tgUpgradeBtn.disabled = !can
      tgUpgradeBtn.classList.toggle('afford', can)
    }
  }
}

function renderShopPanel(state: GameState): string {
  const taskBaseCd: Record<string, number> = Object.fromEntries(
    JOB_TASKS.map((t) => [t.id, t.cooldownMs]),
  )

  const tobaccoBlock = showTobaccoCatalogInShop(state)
    ? `
      <p class="section-label">Табачный магазин</p>
      ${sectionPurpose('Заказ на склад · выставить на полку — вкладка «Табак»')}
      ${renderTobaccoCatalogRows(state)}
    `
    : ''

  const maxed = SHOP_ITEMS.filter((i) => shopLevel(state.shopOwned, i.id) >= shopMaxLevel(i)).length
  const shop = SHOP_ITEMS.map((item) => {
    const level = shopLevel(state.shopOwned, item.id)
    const current = getShopGrade(item, level)
    const next = nextShopGrade(item, level)
    const baseMs = taskBaseCd[item.task] ?? 1500

    if (!next) {
      const ui = renderShopGradeRow(
        item,
        level,
        current?.title,
        current ? shopEffectLabel(current, baseMs) : item.blurb,
      )
      return `
      <div class="row-btn shop owned">
        ${shopIcon(item.id)}
        <span class="row-main">
          <span class="row-title">${ui.title}</span>
          <span class="row-sub row-sub--grade">${ui.dots}<span>${ui.sub}</span></span>
        </span>
        <span class="row-meta row-meta--status">${ui.meta}</span>
      </div>
    `
    }

    const canUp = canUpgradeShopItem(item, level, state.taskDone, state.jobRank)
    const price = shopItemCost(state, next.cost)
    const afford = canUp && state.cash >= price
    const action = level === 0 ? 'Купить' : `→ ${next.title}`
    const currentUi = renderShopGradeRow(item, level, current?.title, '')
    let sub = canUp
      ? `${next.title} · ${shopEffectLabel(next, baseMs)}`
      : shopUnlockHint(item, state.taskDone)
    if (
      item.id === 'drill_brush' &&
      level === 0 &&
      canUp &&
      bareHandsStillPossible(state.shopOwned, state.taskDone.wash)
    ) {
      sub += ' · можно отложить — трофей «Голыми руками»'
    }

    if (!canUp) {
      return `
      <button type="button" class="row-btn shop locked" data-shop="${item.id}" disabled>
        ${shopIcon(item.id)}
        <span class="row-main">
          <span class="row-title">${item.name}${level ? ` · ${current?.title ?? ''}` : ''}</span>
          <span class="row-sub row-sub--grade">${level ? currentUi.dots : ''}<span>${sub}</span></span>
        </span>
        <span class="row-meta">${formatMoney(price)}</span>
      </button>
    `
    }

    return `
      <button type="button" class="row-btn shop ${afford ? 'afford' : ''}" data-shop="${item.id}" ${afford ? '' : 'disabled'}>
        ${shopIcon(item.id)}
        <span class="row-main">
          <span class="row-title">${action}: ${item.name}</span>
          <span class="row-sub row-sub--grade">${level ? currentUi.dots : ''}<span>${sub}</span></span>
        </span>
        <span class="row-meta">${formatMoney(price)}</span>
      </button>
    `
  }).join('')

  const bareHandsShopNote = bareHandsStillPossible(state.shopOwned, state.taskDone.wash)
    ? `<p class="shop-note shop-note--tip">Шуруповёрт необязателен: ${BARE_HANDS_WASH_NEED} моек «Помой кальян» без него — трофей «Голыми руками». Щипцы и кроссовки — по желанию.</p>`
    : ''
  const shopPurpose =
    state.phase === 'ownOnly'
      ? sectionPurpose('Ускоряют «Сам на смене» в зале · каждый инструмент до 4 грейдов')
      : state.phase === 'dual'
        ? sectionPurpose('Ускоряют задачи подработки · каждый инструмент до 4 грейдов')
        : sectionPurpose('Ускоряют задачи смены · каждый инструмент до 4 грейдов')

  const toolsFirst = state.phase === 'employed' || state.scene === 'job'
  const loungeGearBlock = showTobaccoCatalogInShop(state)
    ? renderLoungeShopBlock(state)
    : ''

  const toolsBlock = `
      <p class="section-label">Инструменты для работы · ${maxed}/${SHOP_ITEMS.length} макс.</p>
      ${shopPurpose}
      ${bareHandsShopNote}
      ${shop}
  `

  return `
    <div class="list">
      ${toolsFirst ? `${toolsBlock}${tobaccoBlock}${loungeGearBlock}` : `${tobaccoBlock}${loungeGearBlock}${toolsBlock}`}
    </div>
  `
}

function renderLoungeShopBlock(state: GameState): string {
  const rows = LOUNGE_SHOP_LINES.map((line) => {
    const level = loungeShopLevel(state.loungeShop, line.id)
    const current = getLoungeShopGrade(line, level)
    const next = nextLoungeShopGrade(line, level)
    const max = loungeShopMaxLevel(line)
    const dots = gradeDotsHtml(level, max)

    if (!next) {
      return `
      <div class="row-btn shop owned">
        ${loungeShopIcon(line.id)}
        <span class="row-main">
          <span class="row-title">${line.name} · ${current?.title ?? 'макс.'}</span>
          <span class="row-sub row-sub--grade">${dots}<span>${current?.why ?? line.blurb}</span></span>
        </span>
        <span class="row-meta row-meta--status">★ макс.</span>
      </div>
    `
    }

    const price = shopItemCost(state, next.cost)
    const afford = state.cash >= price
    const action = level === 0 ? 'Купить' : 'Улучшить'
    const masterNote =
      next.needMaster && !(state.staffMembers.master?.length)
        ? ' · сервис от стойки — после найма кальянщика'
        : ''
    return `
      <button type="button" class="row-btn shop ${afford ? 'afford' : ''}" data-lounge-shop="${line.id}" ${afford ? '' : 'disabled'}>
        ${loungeShopIcon(line.id)}
        <span class="row-main">
          <span class="row-title">${action}: ${next.title}</span>
          <span class="row-sub row-sub--grade">${level ? dots : ''}<span>${next.why}${masterNote}</span></span>
        </span>
        <span class="row-meta">${formatMoney(price)}</span>
      </button>
    `
  }).join('')

  return `
      <p class="section-label">Для зала · смена и команда</p>
      ${sectionPurpose(
        'Жар, мойка, форма, стойка мастера — удобство смены и мягче штрафы, не второй VIP',
      )}
      ${rows}
  `
}

function wireShopPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-shop]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyShop((btn as HTMLElement).dataset.shop as ShopItemId)
    })
  })
  panel.querySelectorAll('[data-lounge-shop]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyLoungeShop((btn as HTMLElement).dataset.loungeShop as LoungeShopId)
    })
  })
  panel.querySelectorAll('[data-order-tobacco]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyTobacco((btn as HTMLElement).dataset.orderTobacco as TobaccoId)
    })
  })
}

function renderPromotionsBlock(state: GameState, now: number): string {
  if (!isPromotionsUnlocked(state)) return ''

  const cards = PROMOTIONS.map((def) => {
    const slotUnlocked = isPromotionSlotUnlocked(state, def.id)
    const grade = promotionGrade(state, def.id)
    const current = grade > 0 ? getPromotionGradeDef(def.id, grade) : null
    const next = grade < 4 ? getPromotionGradeDef(def.id, grade + 1) : null
    const furn = furnitureLevel(state)
    const isLive =
      state.promotions.activeId === def.id && state.promotions.activeUntil > now

    if (!slotUnlocked) {
      return `
        <div class="promo-card promo-card--locked">
          ${promotionIcon(def.id)}
          <span class="promo-main">
            <span class="promo-name">${def.name}</span>
            <span class="promo-blurb">Нужен прогресс мебели ${def.needFurniture}+ ур. (сейчас ${furn})</span>
          </span>
        </div>
      `
    }

    if (grade === 0 && next) {
      const canUnlock = state.cash >= next.upgradeCost
      return `
        <button type="button" class="promo-card promo-card--unlock ${canUnlock ? 'afford' : ''}" data-upgrade-promo="${def.id}" ${canUnlock ? '' : 'disabled'}>
          ${promotionIcon(def.id)}
          <span class="promo-main">
            <span class="promo-name">${def.name}</span>
            <span class="promo-blurb">${def.blurb}</span>
          </span>
          <span class="promo-meta">${formatMoney(next.upgradeCost)}</span>
        </button>
      `
    }

    if (!current) return ''

    const dots = [1, 2, 3, 4]
      .map((g) => `<span class="grade-dot ${g <= grade ? 'is-on' : ''}"></span>`)
      .join('')

    const upgradeBtn = next
      ? `<button type="button" class="staff-act staff-act--up ${state.cash >= next.upgradeCost ? 'afford' : ''}" data-upgrade-promo="${def.id}" ${state.cash >= next.upgradeCost ? '' : 'disabled'} title="→ ${next.title}"><span class="staff-up-cost">${formatMoney(next.upgradeCost)}</span><span class="staff-up-icon">↑</span></button>`
      : `<span class="staff-act staff-act--max" title="Макс. грейд">★</span>`

    const readyAt = promotionLaunchReadyAt(state, def.id)
    const onCooldown = now < readyAt
    const canLaunch = canLaunchPromotion(state, def.id, now)
    const launchLabel = onCooldown
      ? `${Math.ceil((readyAt - now) / 1000)}с`
      : formatMoney(current.launchCost)

    return `
      <div class="promo-card promo-card--owned ${isLive ? 'promo-card--live' : ''}">
        ${promotionIcon(def.id)}
        <span class="promo-main">
          <span class="promo-name">${def.name} · ${current.title}</span>
          <span class="promo-blurb">+${Math.round(current.passiveGuest * 100)}% гостей · запуск +${Math.round(current.guestBoost * 100)}%</span>
          <div class="grade-dots" aria-label="Грейд ${grade} из 4">${dots}</div>
        </span>
        <span class="promo-actions">
          ${upgradeBtn}
          <button type="button" class="promo-launch ${canLaunch ? 'afford' : ''}" data-launch-promo="${def.id}" ${canLaunch ? '' : 'disabled'} title="${onCooldown ? 'Перезарядка' : 'Запустить акцию'}">${launchLabel}</button>
        </span>
      </div>
    `
  }).join('')

  return `
    <p class="section-label">Акции</p>
    ${sectionPurpose('Прокачай грейд → запускай — всплеск гостей на время')}
    <div class="promo-list" data-promotions>${cards}</div>
  `
}

function renderLoungePanel(state: GameState, now: number): string {
  const traffic = guestTraffic(state)
  const cap = capacityStatus(state)
  const shelfCap = shelfCapacity(state)
  const shelfN = shelfActiveCount(state)
  const mood = shelfMood(state)

  const sideJob =
    state.phase === 'dual' || state.phase === 'ownOnly'
      ? `
      <p class="section-label">${
        state.phase === 'ownOnly' ? 'Сам на смене' : 'Подработка'
      }</p>
      ${
        state.phase === 'ownOnly'
          ? `<p class="shop-note">Вышел поработать руками — мойка, угли, заказ. Инструменты в «Магазине» снова качаются.</p>`
          : ''
      }
      <div class="job-tasks" data-job-tasks>${renderJobTasksBlock(state, now)}</div>
    `
      : ''

  const shelfNote =
    mood === 'sparse' || mood === 'empty'
      ? ' · мало вкусов — гости недовольны'
      : mood === 'rich'
        ? ' · богатый выбор — чаевые выше'
        : ''

  const servicePower = Math.floor(staffServiceCapacity(state))
  const trafficBlock = `
    <div class="milestone career">
      <div class="milestone-head">
        <span>Посадка ${cap.seated}/${cap.capacity}${cap.full ? ' · полный' : ''}</span>
        <span title="Множитель потока к доходу, не заполненность зала">поток ×${traffic.toFixed(2)}</span>
      </div>
      <div class="bar"><i style="width:${Math.min(100, (cap.seated / Math.max(1, cap.capacity)) * 100)}%"></i></div>
      ${
        cap.service.mood !== 'ok'
          ? `<p class="row-sub shop-note service-note service-note--${cap.service.mood}">${cap.service.label}${
              cap.service.incomeMult < 1
                ? ` · чек −${Math.round((1 - cap.service.incomeMult) * 100)}%`
                : ''
            }${quietUiCopy() ? '' : ` · ${cap.service.hint}`}</p>`
          : quietUiCopy()
            ? `<p class="row-sub shop-note">Сервис ок · ~${servicePower}</p>`
            : `<p class="row-sub shop-note">Сервис ок · смена тянет ~${servicePower} · можно растить зал, но без команды будут жалобы</p>`
      }
      ${
        shelfNote
          ? `<p class="row-sub shop-note">Полка ${shelfN}/${shelfCap}${shelfNote}${
              quietUiCopy() ? '' : ' · вкладка «Табак»'
            }</p>`
          : ''
      }
      ${
        activePromotionLabel(state, now)
          ? `<p class="row-sub promo-active-note">${activePromotionLabel(state, now)}</p>`
          : ''
      }
    </div>
  `
  const furn = furnitureLevel(state)
  const seatsNow = seatCapacity(state)
  const expansionRows = EXPANSIONS.map((def) => {
    const owned = !!state.expansions[def.id]
    if (owned) {
      return `
        <div class="row-btn shop owned">
          ${expansionIcon(def.id)}
          <span class="row-main">
            <span class="row-title">${def.name}</span>
            <span class="row-sub">+${def.seats} мест · +${formatMoney(def.incomeBonus)}/с</span>
          </span>
          <span class="row-meta row-meta--status">есть</span>
        </div>
      `
    }
    const unlocked = furn >= def.needFurniture
    const expCost = scaledExpansionCost(state, def.cost)
    const can = unlocked && state.cash >= expCost
    const warn = unlocked ? seatingPurchaseWarns(state, seatsNow, def.seats) : null
    const sub = !unlocked
      ? `Нужен прогресс мебели ${def.needFurniture}+ ур. (сейчас ${furn})`
      : quietUiCopy()
        ? warn
          ? `+${def.seats} · ${warn}`
          : `+${def.seats} мест`
        : warn
          ? `${def.blurb} · +${def.seats} · ${warn}`
          : `${def.blurb} · +${def.seats} мест`
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''} ${unlocked ? '' : 'locked'}${warn ? ' upgrade-risk' : ''}" data-expansion="${def.id}" ${can ? '' : 'disabled'}>
        ${expansionIcon(def.id)}
        <span class="row-main">
          <span class="row-title">${def.name}</span>
          <span class="row-sub">${sub}</span>
        </span>
        <span class="row-meta">${formatMoney(expCost)}</span>
      </button>
    `
  }).join('')

  const rows = UPGRADES.map((def) => {
    const unlocked = isUpgradeUnlocked(state, def)
    const level = state.owned[def.id]
    const maxed = level >= def.maxLevel
    const cost = scaledUpgradeCost(state, upgradeCost(def, level))
    const canBuy = unlocked && !maxed && state.cash >= cost
    const addSeats = seatsFromUpgrade(def.id)
    const warn = unlocked && !maxed ? seatingPurchaseWarns(state, seatsNow, addSeats) : null
    const subText = !unlocked
      ? upgradeUnlockHint(def, state.owned)
      : quietUiCopy()
        ? warn || ''
        : maxed
          ? def.blurb
          : warn
            ? `${def.blurb} · ${warn}`
            : def.blurb
    const ui = renderUpgradeGradeRow(def.id, level, subText)
    if (maxed) {
      return `
        <div class="row-btn upgrade owned">
          ${upgradeIcon(def.id)}
          <span class="row-main">
            <span class="row-title">${def.name}</span>
            <span class="row-sub row-sub--grade">${ui.dots}<span>${
              quietUiCopy() ? `ур.${level}/${def.maxLevel}` : `${subText} · ур.${level}/${def.maxLevel}`
            }</span></span>
          </span>
          <span class="row-meta">★ макс.</span>
        </div>
      `
    }
    return `
      <button type="button" class="row-btn upgrade ${unlocked ? '' : 'locked'} ${canBuy ? 'afford' : ''}${warn ? ' upgrade-risk' : ''}" data-buy="${def.id}" ${unlocked && canBuy ? '' : 'disabled'}>
        ${upgradeIcon(def.id)}
        <span class="row-main">
          <span class="row-title">${def.name}</span>
          <span class="row-sub row-sub--grade">${ui.dots}<span>${
            quietUiCopy()
              ? `${subText ? `${subText} · ` : ''}ур.${level}/${def.maxLevel}`
              : `${subText}${level > 0 ? ` · ур.${level}/${def.maxLevel}` : ` · ур. 0/${def.maxLevel}`}`
          }</span></span>
        </span>
        <span class="row-meta">
          ${unlocked ? formatMoney(cost) : '—'}
          <small>+${formatMoney(def.incomePerLevel)}/с</small>
        </span>
      </button>
    `
  }).join('')

  let quit = ''
  const empireHint = empireTeaser(state)
  if (state.phase === 'dual') {
    const ready = canQuitJob(state)
    const quitNeed = quitIncomeThreshold(state)
    const nowIncome = formatMoney(loungeIncomePerSec(state)).replace(/\s/g, '\u00a0')
    const needLabel = String(quitNeed).replace(/\s/g, '\u00a0')
    quit = `
      <div class="milestone">
        <p class="row-sub row-sub--oneline">Уволиться от ${needLabel}/с · сейчас ${nowIncome}/с</p>
        <button type="button" class="row-btn accent row-btn--solo" data-quit ${ready ? '' : 'disabled'}>
          <span class="row-main">
            <span class="row-title">Уволиться из «${getVenue(state.venueId).name}»</span>
            ${quietUiCopy() ? '' : `<span class="row-sub">Необязательно — ачивка «Трудяга» за смену и свой лаунж</span>`}
          </span>
        </button>
      </div>
    `
  }

  return `
    <div class="list">
      ${sideJob}
      ${trafficBlock}
      ${renderPromotionsBlock(state, now)}
      ${
        empireHint
          ? `<div class="milestone"><p class="row-sub shop-note">${empireHint}</p></div>`
          : ''
      }
      <p class="section-label">Закупка лаунжа</p>
      ${sectionPurpose('Доход/с и места · прогресс открывает акции и расширения')}
      <div class="lounge-shop">${rows}</div>
      <p class="section-label">Расширения</p>
      ${expansionRows}
      ${quit}
    </div>
  `
}

function wireLoungePanel(panel: HTMLElement, handlers: ShellHandlers): void {
  wireJobTasks(panel, handlers)
  panel.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuy((btn as HTMLElement).dataset.buy as UpgradeId)
    })
  })
  panel.querySelectorAll('[data-expansion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyExpansion((btn as HTMLElement).dataset.expansion as ExpansionId)
    })
  })
  panel.querySelector('[data-quit]')?.addEventListener('click', () => handlers.onQuit())
  panel.querySelectorAll('[data-upgrade-promo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onUpgradePromotion((btn as HTMLElement).dataset.upgradePromo as PromotionId)
    })
  })
  panel.querySelectorAll('[data-launch-promo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onLaunchPromotion((btn as HTMLElement).dataset.launchPromo as PromotionId)
    })
  })
}

export function maybePresentCelebration(
  state: GameState,
  onDismiss: () => void,
): void {
  const c = state.flags.celebration
  if (!c) return
  const kind = c.kind
  state.flags.celebration = null
  if (kind === 'award') {
    showGuideMastersDiploma(state.playerName, c.subtitle, onDismiss)
    return
  }
  const finish = (): void => {
    if (kind === 'rank') {
      const coach = rankUpCoach(state)
      if (coach) {
        queueMilestoneCoach(coach, () => {
          markMilestoneHintSeen(state, 'rank_up')
          onDismiss()
        })
        return
      }
    }
    onDismiss()
  }
  showCelebration(
    c.title,
    c.subtitle,
    finish,
    kind === 'lounge' ? 'lounge' : kind === 'rank' ? 'rank' : 'general',
  )
}

export function juiceTaskReward(
  root: HTMLElement,
  amount: number,
  from?: HTMLElement | null,
): void {
  playCoinSound()
  spawnFloatCash(root, amount, from ?? null)
  pulseCashHud(root)
}

export function juiceLoungeOrder(root: HTMLElement, amount: number): void {
  const stage = root.querySelector('.stage') as HTMLElement | null
  const from = root.querySelector('[data-cta]') as HTMLElement | null
  playCoinSound()
  spawnFloatCash(root, amount, from)
  pulseCashHud(root)
  if (!stage) return
  if (!isTelegramMiniApp()) {
    spawnTapSparks(stage, from)
    stage.classList.add('stage-hit')
    window.setTimeout(() => stage.classList.remove('stage-hit'), 220)
  }
}

export function juicePurchase(root: HTMLElement): void {
  playUnlockSound()
  pulseCashHud(root)
}

export function showTabIntro(root: HTMLElement, title: string, body: string): void {
  showToast(root, `${title} — ${body}`)
  playUnlockSound()
}
