import './styles/main.css'
import './styles/lounge-theme.css'
import {
  syncSessionTime,
  applyOffline,
  grantWelcomeTips,
  beginLoungePick,
  buyUpgrade,
  buyShopItem,
  buyTobacco,
  buyExpansion,
  cancelLoungePick,
  canBrowseLoungeOffer,
  canDoJobTasks,
  doJobTask,
  loungeOrder,
  maybeBrokeHint,
  maybeShelfFeedback,
  maybePayrollFeedback,
  maybeServiceFeedback,
  maybeServiceComplaintFloat,
  minOpenLoungeCost,
  openLounge,
  openBranch,
  putOnShelf,
  removeFromShelf,
  hireStaff,
  upgradeStaff,
  addStaff,
  fireStaff,
  quitJob,
  setScene,
  syncLoungeOfferUnlock,
  tickIncome,
  canQuitJob,
} from './game/career'
import {
  enterGuideMastersAward,
  holdVenueEvent,
  shootPersonalVideo,
  startPersonalChannel,
  upgradeChannelGear,
  createTelegramChannel,
  upgradeTelegramChannel,
  upgradeTelegramToolkit,
  postTelegram,
} from './game/personal'
import { canBrowseEmpire, syncEmpireUnlock } from './game/empire'
import { breakAmbassadorContract, signAmbassador } from './game/ambassador'
import { difficultyFromVenue } from './data/difficulty'
import { evaluateAchievements } from './data/achievements'
import { showMascotConfirm, showMascotNotice } from './ui/mascot'
import { loadLifetimeTrophies, persistLifetimeTrophies } from './save/trophies'
import { syncProgressFlags } from './game/progressFlags'
import { clampJobRankToProgress, rankDef } from './data/ranks'
import { JOB_TASKS } from './data/tasks'
import { taskPay } from './data/shop'
import { getVenue } from './data/venues'
import {
  markTabHintSeen,
  syncGuideProgress,
  storySubHintMessage,
  tabHintMessage,
  consumePersonalIntroHint,
  consumeTobaccoSetupHint,
  applyBootGuideToState,
  ackGuideCoach,
  contextualOgonokTip,
  creditHiddenIdleTime,
  isShiftIdleDue,
  touchOgonokInteraction,
} from './game/guide'
import { displayWorkDay, tickWorkDays, weekdayOf } from './game/workDays'
import { archiveCareerRun, encodeCareerShare, decodeCareerShare } from './save/leaderboard'
import { createInitialState, type GameState } from './game/state'
import {
  applySaveRaw,
  clearLocalSaveBlob,
  createDebouncedSave,
  hasLocalSaveBlob,
  isSaveStorageAvailable,
  loadState,
  resetSave,
  saveState,
} from './save/storage'
import {
  flushTelegramCloudSave,
  isTelegramCloudSaveAvailable,
  mergeTelegramCloudIntoLocal,
  readTelegramCloudSaveRaw,
  scheduleTelegramCloudSave,
} from './platform/telegramCloudSave'
import {
  flushTelegramDeviceSave,
  isTelegramDeviceSaveAvailable,
  readTelegramDeviceSaveRaw,
} from './platform/telegramDeviceSave'
import {
  isRemoteSyncConfigured,
  mergeRemoteSave,
  preferSave,
  pullRemoteSave,
  pushRemoteSave,
  scheduleRemoteSave,
  flushRemoteSave,
  waitForTelegramInitData,
  pingTelegramPulse,
} from './platform/telegramRemoteSync'
import { showSyncBanner } from './ui/syncBanner'
import {
  mountLayoutLabSwitcher,
  ensureLabLounge,
  isLayoutLabHost,
  onLayoutLabApplied,
  forceLabLounge,
  setLabStoryDockOpen,
  syncLabStoryMenu,
  usesLayoutD,
} from './ui/layoutLab'
import { applySettings, isCoachEnabled, loadSettings } from './save/settings'
import { formatMoney } from './game/economy'
import { pluralRuCount } from './game/ru'
import { runBoot } from './ui/boot'
import { presentBrowserGate, shouldShowBrowserGate } from './ui/browserGate'
import { showFatalError } from './ui/fatalError'
import { prepareTelegramMiniApp } from './platform/telegram'
import { presentTelegramAgeGate } from './platform/telegramAgeGate'
import { isTelegramMiniApp } from './platform/runtime'
import { openSettingsPanel } from './ui/settingsPanel'
import { launchPromotion, upgradePromotion } from './game/promotions'
import type { PromotionId } from './data/promotions'
import {
  mountShell,
  renderShell,
  showToast,
  showDayTurn,
  announceAchievements,
  updateHud,
  updateJobCooldowns,
  updatePersonalCooldowns,
  maybePresentCelebration,
  flushAchievementQueue,
  syncAchievementFanfareSeen,
  resetAchievementFanfareSeen,
  juiceTaskReward,
  juiceLoungeOrder,
  juicePurchase,
  type MenuTab,
  type CareerSubTab,
  type StorySubTab,
  isLoungeOnlyMenuTab,
  setCareerCompareCard,
} from './ui/shell'
import {
  dismissGuideCoach,
  hasPendingTabHint,
  isGuideCoachVisible,
  presentStandaloneCoach,
  queueTabHint,
} from './ui/guideOverlay'
import { isCelebrationVisible, primeAudio, spawnFloatComplaint } from './ui/juice'
import { initUiPolish } from './ui/atmosphere'
import { syncAmbientMusic } from './ui/ambientMusic'
import { loungeClickPower } from './game/economy'
import { isAdminEnabled } from './adminFlag'
import type { LoungeTierId } from './data/loungeTiers'
import type { BranchId } from './data/branches'
import type { StaffId } from './data/staff'
import type { TobaccoId } from './data/tobacco'
import type { ExpansionId } from './data/expansions'
import type { VenueId } from './data/venues'

const rootEl = document.querySelector<HTMLElement>('#app')
if (!rootEl) throw new Error('#app missing')
const root = rootEl

loadSettings()

let state: GameState = loadState()
let menuTab: MenuTab = 'story'
let careerSubTab: CareerSubTab = 'track'
let storySubTab: StorySubTab = 'tasks'
let scheduleSaveBase = createDebouncedSave(450)
const scheduleSave = Object.assign(
  (s: GameState) => {
    scheduleSaveBase(s)
    scheduleRemoteSave(s)
  },
  {
    flush: (s: GameState, opts?: { keepalive?: boolean; bumpSync?: boolean }) => {
      const ok = scheduleSaveBase.flush(s, {
        bumpSync: opts?.bumpSync,
      })
      if (isRemoteSyncConfigured()) {
        void flushRemoteSave(s, { keepalive: opts?.keepalive })
      }
      return ok
    },
  },
)
let lastTs = performance.now()
let gameStarted = false
const admin = isAdminEnabled()

function hudCoachContext() {
  return { menuTab, storySubTab, scene: state.scene }
}

const handlers = {
  onJobTask(id: Parameters<typeof doJobTask>[1]) {
    primeAudio()
    const task = JOB_TASKS.find((t) => t.id === id)
    const mult =
      rankDef(state.jobRank).payMult * getVenue(state.venueId).payMult
    const payPreview = task
      ? taskPay(task.pay, id, state.shopOwned, mult)
      : 0
    const res = doJobTask(state, id, Date.now())
    if (!res.ok) {
      if (res.message) showToast(root, res.message)
      return
    }
    if (payPreview > 0) {
      juiceTaskReward(
        root,
        payPreview,
        root.querySelector(`[data-task="${id}"]`) as HTMLElement | null,
      )
    }
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onLoungeOrder() {
    primeAudio()
    const amount = loungeClickPower(state)
    const res = loungeOrder(state)
    if (!res.ok) return
    juiceLoungeOrder(root, amount)
    afterAction()
  },
  onBuy(id: Parameters<typeof buyUpgrade>[1]) {
    const res = buyUpgrade(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    juicePurchase(root)
    afterAction()
    maybeQuitToast()
  },
  onBuyShop(id: Parameters<typeof buyShopItem>[1]) {
    const res = buyShopItem(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
    // afterAction уже пишет каналы; доп. flush не нужен
  },
  onBuyTobacco(id: TobaccoId) {
    const res = buyTobacco(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onPutOnShelf(id: TobaccoId) {
    const res = putOnShelf(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onRemoveFromShelf(id: TobaccoId) {
    const res = removeFromShelf(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onHireStaff(id: StaffId) {
    const res = hireStaff(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onUpgradeStaff(id: StaffId, index: number) {
    const res = upgradeStaff(state, id, index)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onAddStaff(id: StaffId) {
    const res = addStaff(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onFireStaff(id: StaffId, index: number) {
    const res = fireStaff(state, id, index)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onOpenBranch(id: BranchId) {
    const res = openBranch(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onBuyExpansion(id: ExpansionId) {
    const res = buyExpansion(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onBeginLoungePick() {
    const res = beginLoungePick(state)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    menuTab = 'own'
    paint()
  },
  onCancelLoungePick() {
    cancelLoungePick(state)
    menuTab = 'story'
    paint()
  },
  onOpenLounge(tier: LoungeTierId) {
    const res = openLounge(state, tier)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    menuTab = 'story'
    afterAction()
  },
  onQuit() {
    const res = quitJob(state)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onScene(scene: 'job' | 'lounge') {
    const res = setScene(state, scene)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (scene === 'lounge') storySubTab = 'tasks'
    afterAction()
  },
  onStartChannel() {
    const res = startPersonalChannel(state)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onUpgradeChannelGear(id: Parameters<typeof upgradeChannelGear>[1]) {
    const res = upgradeChannelGear(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onShootVideo() {
    primeAudio()
    const res = shootPersonalVideo(state, Date.now())
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juiceTaskReward(root, 0, root.querySelector('[data-personal-video]') as HTMLElement | null)
    afterAction()
  },
  onHoldEvent() {
    const res = holdVenueEvent(state, Date.now())
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onUpgradePromotion(id: PromotionId) {
    const res = upgradePromotion(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onLaunchPromotion(id: PromotionId) {
    const res = launchPromotion(state, id, Date.now())
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onCreateTelegram() {
    const res = createTelegramChannel(state)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onUpgradeTelegram() {
    const res = upgradeTelegramChannel(state)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onUpgradeTelegramToolkit(id: Parameters<typeof upgradeTelegramToolkit>[1]) {
    const res = upgradeTelegramToolkit(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onPostTelegram() {
    const res = postTelegram(state, Date.now())
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onSignAmbassador(id: TobaccoId) {
    const res = signAmbassador(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    juicePurchase(root)
    afterAction()
  },
  onBreakAmbassador(id: TobaccoId) {
    const res = breakAmbassadorContract(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onEnterAward() {
    const res = enterGuideMastersAward(state, Date.now())
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onMenuTab(tab: MenuTab) {
    touchOgonokInteraction()
    if (tab === 'own') {
      syncLoungeOfferUnlock(state)
      if (!canBrowseLoungeOffer(state)) {
        showToast(
          root,
          `Накопи ${Math.ceil(minOpenLoungeCost(state) - state.cash)} до вкладки «Свой лаунж»`,
        )
        return
      }
    }
    if (tab === 'own' && state.phase !== 'employed') {
      menuTab = 'story'
      paint()
      return
    }
    if (tab === 'network') {
      syncEmpireUnlock(state)
      if (!canBrowseEmpire(state)) {
        showToast(
          root,
          'Сеть откроется после увольнения со смены',
        )
        return
      }
    }
    menuTab = tab
    if (usesLayoutD()) {
      if (tab === 'story') setLabStoryDockOpen(true)
      else if (tab === 'career' || tab === 'own') setLabStoryDockOpen(false)
    }
    if (tab !== 'story') storySubTab = 'tasks'
    if (state.phase === 'dual' && isLoungeOnlyMenuTab(tab)) {
      state.scene = 'lounge'
    }
    if (tab === 'personal') {
      state.flags.personalIntroPending = false
    }
    const tabHint = tabHintMessage(state, tab)
    if (tabHint) {
      queueTabHint(tabHint, () => {
        markTabHintSeen(state, tabHint.id)
        scheduleSave(state)
      })
    }
    paint()
  },
  onCareerSubTab(sub: CareerSubTab) {
    touchOgonokInteraction()
    careerSubTab = sub
    paint()
  },
  onStorySubTab(sub: StorySubTab) {
    touchOgonokInteraction()
    storySubTab = sub
    const hint = storySubHintMessage(state, sub)
    if (hint) {
      queueTabHint(hint, () => {
        markTabHintSeen(state, hint.id)
        scheduleSave(state)
      })
    }
    paint()
  },
  onGuideAck() {
    saveState(state)
  },
  onOgonokTip() {
    touchOgonokInteraction()
    const ctx = hudCoachContext()
    const tip = contextualOgonokTip(state, ctx)
    if (!tip) return
    presentStandaloneCoach(
      root,
      tip,
      () => {
        ackGuideCoach(state, tip.coachKey ?? tip.step)
        saveState(state)
        paint()
        flushAchievementQueue(root, state, menuTab)
      },
      tip.coachKey ?? 'context-tip',
    )
  },
  onReset() {
    void confirmAndResetCareer()
  },
  onShareCareer() {
    const code = encodeCareerShare(state)
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(code).then(() => {
        showToast(root, 'Код карьеры скопирован — отправь другу')
      }).catch(() => {
        prompt('Код карьеры (скопируй вручную):', code)
      })
    } else {
      prompt('Код карьеры (скопируй вручную):', code)
    }
  },
  onImportCareer(code: string) {
    const card = decodeCareerShare(code)
    if (!card) {
      showToast(root, 'Не разобрали код — проверь, что скопировали целиком')
      return
    }
    setCareerCompareCard(card)
    showToast(root, `Сравнение с ${card.n} · день ${card.d}`)
    paint()
  },
  onClearCareerCompare() {
    setCareerCompareCard(null)
    paint()
  },
  onOpenSettings() {
    openSettingsPanel(
      root,
      () => {
        applySettings(root)
        syncAmbientMusic()
        dismissGuideCoach(root)
        paint()
      },
      {
        getState: () => state,
        onToast: (msg) => showToast(root, msg),
        onImportSave: (raw) => {
          state = applySaveRaw(raw)
          saveState(state)
          void flushTelegramCloudSave(state)
          void pushRemoteSave(state)
          showSyncBanner(`Вставлен сейв · ${Math.floor(state.cash)}₽`)
          showToast(root, `Прогресс вставлен · касса ${Math.floor(state.cash)}₽`)
          if (gameStarted) paint()
          else beginGame()
        },
      },
    )
  },
  onStoryMenuBack() {
    setLabStoryDockOpen(false)
    menuTab = 'story'
    paint()
  },
}

function onAchievementsUnlocked(unlocked: ReturnType<typeof evaluateAchievements>): void {
  if (!unlocked.length) return
  saveState(state)
  announceAchievements(root, state, menuTab, unlocked)
}

function paint(): void {
  if (!gameStarted) return
  try {
    syncLabStoryMenu(root, menuTab)
    renderShell(root, state, handlers, menuTab, Date.now(), careerSubTab, storySubTab)
  } catch (err) {
    console.error(err)
    showFatalError(err, 'отрисовке')
  }
}

function afterAction(): void {
  try {
    touchOgonokInteraction()
    syncProgressFlags(state)
    const offerWasLocked = !state.flags.loungeOfferUnlocked
    syncLoungeOfferUnlock(state)
    const empireWasLocked = !state.flags.empireOfferUnlocked
    syncEmpireUnlock(state)
    if (
      offerWasLocked &&
      state.flags.loungeOfferUnlocked &&
      state.phase === 'employed'
    ) {
      menuTab = 'own'
      showToast(root, 'Хватает на лаунж — выбери тариф во вкладке «Свой лаунж»')
      scheduleSave.flush(state)
    }
    if (
      empireWasLocked &&
      state.flags.empireOfferUnlocked &&
      state.phase === 'ownOnly' &&
      !isCoachEnabled()
    ) {
      showToast(root, 'Вкладка «Сеть» открыта — можно открыть второе заведение')
    }
    const unlocked = evaluateAchievements(state)
    if (!isCoachEnabled()) {
      const hint = maybeBrokeHint(state)
      if (hint) showToast(root, hint)
      const shelfHint = maybeShelfFeedback(state)
      if (shelfHint) showToast(root, shelfHint)
      const payrollHint = maybePayrollFeedback(state)
      if (payrollHint) showToast(root, payrollHint)
    }
    const serviceHint = maybeServiceFeedback(state)
    if (serviceHint) showToast(root, serviceHint)
    syncGuideProgress(state)
    if (state.phase !== 'employed' && menuTab === 'own') menuTab = 'story'
    if (state.phase === 'employed' && menuTab === 'tobacco') menuTab = 'story'
    if (state.phase === 'employed' && menuTab === 'staff') menuTab = 'story'
    if (state.phase === 'employed' && menuTab === 'personal') menuTab = 'story'
    if (!canBrowseEmpire(state) && menuTab === 'network') menuTab = 'story'
    paint()
    const hadCelebration = Boolean(state.flags.celebration)
    maybePresentCelebration(state, () => {
      flushPendingTabIntros()
      scheduleSave(state)
      paint()
      flushAchievementQueue(root, state, menuTab)
    })
    // Без celebration onDismiss не вызывается — иначе personalIntroPending
    // зависает и «Личное» моргает на каждом paint.
    if (!hadCelebration) flushPendingTabIntros()
    if (unlocked.length) onAchievementsUnlocked(unlocked)
    else flushAchievementQueue(root, state, menuTab)
    // В Telegram localStorage ненадёжен — сразу пишем server/cloud/device
    if (isTelegramMiniApp()) {
      scheduleSaveBase.flush(state, { bumpSync: true })
      void persistTelegramChannels(state, { cloud: 'schedule' })
    } else {
      scheduleSave(state)
    }
  } catch (err) {
    console.error(err)
    showFatalError(err, 'действии')
  }
}

/** Одноразовые intro после открытия лаунжа: сначала табак, потом личное */
function flushPendingTabIntros(): void {
  if (hasPendingTabHint() || isGuideCoachVisible() || isCelebrationVisible()) return

  const tobaccoHint = consumeTobaccoSetupHint(state)
  if (tobaccoHint) {
    queueTabHint(tobaccoHint, () => {
      markTabHintSeen(state, 'tobacco')
      scheduleSave(state)
      paint()
      flushPendingTabIntros()
    })
    scheduleSave(state)
    paint()
    return
  }

  const personalHint = consumePersonalIntroHint(state)
  if (personalHint) {
    queueTabHint(personalHint, () => {
      markTabHintSeen(state, 'personal')
      scheduleSave(state)
      paint()
    })
    scheduleSave(state)
    paint()
  }
}

function maybeQuitToast(): void {
  if (!isCoachEnabled()) {
    if (state.phase !== 'dual' || state.flags.sawQuitReady) return
    if (!canQuitJob(state)) return
    state.flags.sawQuitReady = true
    showToast(root, 'Свой лаунж тянет сам — можно уволиться со смены.')
    return
  }
  // milestone quit_ready — через guideCoach
}

let shiftIdleOpen = false
let hiddenSince = 0
let pendingWelcomeTips = 0
let queuedBootTips = 0

function persistWelcomeTips(): void {
  if (isTelegramMiniApp()) {
    scheduleSaveBase.flush(state, { bumpSync: true })
    void persistTelegramChannels(state, { cloud: 'schedule' })
  } else {
    scheduleSave(state)
  }
}

function showWelcomeTipsNotice(amount: number): void {
  void showMascotNotice(root, {
    title: 'Пока тебя не было',
    body: `Гости оставили ${formatMoney(amount)} на чай. Не зарплата — просто не ушли с пустыми руками.`,
    cta: 'Забрать чаевые',
    pose: 'happy',
  }).then(() => {
    touchOgonokInteraction()
  })
}

function offerWelcomeTips(amount: number): void {
  if (amount <= 0) return
  persistWelcomeTips()
  if (!gameStarted) {
    queuedBootTips = amount
    return
  }
  paint()
  if (shiftIdleOpen) {
    pendingWelcomeTips = amount
    return
  }
  showWelcomeTipsNotice(amount)
}

function flushQueuedBootTips(): void {
  if (queuedBootTips <= 0) return
  const amount = queuedBootTips
  queuedBootTips = 0
  offerWelcomeTips(amount)
}

function showShiftIdleNotice(): void {
  if (shiftIdleOpen) return
  shiftIdleOpen = true
  syncSessionTime(state, Date.now())
  scheduleSaveBase.flush(state, { bumpSync: false })
  void showMascotNotice(root, {
    title: 'Эй, ты ещё на смене?',
    body: 'Без тебя зал затих. Пока спишь на стойке — выручка не капает. Вернись, гости ждут.',
    cta: 'Вернуться на смену',
    pose: 'wave',
  }).then(() => {
    shiftIdleOpen = false
    touchOgonokInteraction()
    if (pendingWelcomeTips > 0) {
      const queued = pendingWelcomeTips
      pendingWelcomeTips = 0
      showWelcomeTipsNotice(queued)
    }
  })
}

function passiveAccruesNow(): boolean {
  return gameStarted && !document.hidden && !shiftIdleOpen
}

let lastHudTs = 0
let lastAchieveTs = 0

function frame(ts: number): void {
  try {
    if (!gameStarted) {
      requestAnimationFrame(frame)
      return
    }
    const dt = Math.min(0.25, (ts - lastTs) / 1000)
    lastTs = ts
    if (passiveAccruesNow()) {
      tickIncome(state, dt)
      if (tickWorkDays(state, dt)) {
        const day = weekdayOf(state)
        const title = day.name[0]!.toUpperCase() + day.name.slice(1)
        const n = displayWorkDay(state.career.workDays)
        if (day.id === 'fri') {
          showDayTurn(root, { title, sub: 'сегодня людно', weekend: true })
        } else if (day.id === 'sat') {
          showDayTurn(root, { title, sub: 'зал гуще обычного', weekend: true })
        } else {
          showDayTurn(root, { title, sub: `день ${n}` })
        }
      }
    }
    if (gameStarted && !document.hidden && !shiftIdleOpen && isShiftIdleDue()) {
      showShiftIdleNotice()
    }
    const hudDue = ts - lastHudTs >= 125
    if (hudDue) {
      lastHudTs = ts
      if (isLayoutLabHost() && ensureLabLounge(state)) {
        saveState(state, { bumpSync: false })
        menuTab = 'story'
        paint()
      }
      updateHud(root, state, hudCoachContext())
      if (menuTab === 'story' && canDoJobTasks(state)) {
        updateJobCooldowns(root, state, Date.now())
      }
      if (menuTab === 'personal' && state.phase !== 'employed') {
        updatePersonalCooldowns(root, state, Date.now())
      }
    }
    if (state.phase !== 'employed' && !isCoachEnabled()) {
      const shelfHint = maybeShelfFeedback(state)
      if (shelfHint) showToast(root, shelfHint)
      const payrollHint = maybePayrollFeedback(state)
      if (payrollHint) showToast(root, payrollHint)
    }
    if (state.phase !== 'employed') {
      const serviceHint = maybeServiceFeedback(state)
      if (serviceHint) showToast(root, serviceHint)
    }
    if (state.phase !== 'employed' && state.scene === 'lounge') {
      const complaint = maybeServiceComplaintFloat(state, Date.now())
      if (complaint) {
        const from = root.querySelector('[data-cta]') as HTMLElement | null
        spawnFloatComplaint(root, complaint, from)
      }
    }
    if (ts - lastAchieveTs >= 400) {
      lastAchieveTs = ts
      const unlocked = evaluateAchievements(state)
      if (unlocked.length) {
        onAchievementsUnlocked(unlocked)
        if (menuTab === 'career') paint()
      }
    }
    scheduleSave(state)
  } catch (err) {
    console.error(err)
    showFatalError(err, 'игре')
    return
  }
  requestAnimationFrame(frame)
}

function beginGame(): void {
  dismissGuideCoach(root)
  gameStarted = true
  if (ensureLabLounge(state)) {
    saveState(state, { bumpSync: false })
  }
  touchOgonokInteraction()
  state.jobRank = clampJobRankToProgress(state.jobRank, state.taskDone)
  syncAchievementFanfareSeen(state)
  mountShell(root, handlers)
  onLayoutLabApplied(() => {
    forceLabLounge(state)
    dismissGuideCoach(root)
    menuTab = 'story'
    saveState(state, { bumpSync: false })
    paint()
  })
  mountLayoutLabSwitcher(root)
  applySettings(root)
  initUiPolish(root)
  primeAudio()
  syncAmbientMusic()
  if (!isSaveStorageAvailable()) {
    showToast(
      root,
      'Safari не сохраняет прогресс (частный режим?). Играй в обычном Safari.',
    )
  }
  if (isTelegramMiniApp() && state.onboarded) {
    if (!isRemoteSyncConfigured()) {
      void flushTelegramCloudSave(state).then((ok) => {
        if (ok === false && isTelegramCloudSaveAvailable()) {
          showToast(root, 'Облако Telegram на этом устройстве не пишет — нужен сервер синка')
        }
      })
    }
    // HTTP-синк: mergeRemoteSave уже запушил при необходимости — лишний push тут затирал Mac
  }
  scheduleSave.flush(state)
  if (admin) {
    void import('./admin').then(
      ({ mountAdminPanel, adminUnlockAll, adminForceLounge, adminToJob }) => {
        mountAdminPanel(document.body, {
          onCash(amount) {
            state.cash += amount
            showToast(root, `Admin +${formatMoney(amount)}`)
            paint()
            scheduleSave(state)
          },
          onUnlockAll() {
            adminUnlockAll(state)
            showToast(root, 'Admin: всё открыто')
            paint()
            scheduleSave(state)
          },
          onOpenLounge(tier: LoungeTierId) {
            adminForceLounge(state, tier)
            menuTab = 'story'
            showToast(root, `Admin: лаунж «${tier}»`)
            paint()
            scheduleSave(state)
          },
          onToJob() {
            adminToJob(state)
            menuTab = 'story'
            showToast(root, 'Admin: сцена смены')
            paint()
            scheduleSave(state)
          },
          onSetVenue(id: VenueId) {
            state.venueId = id
            state.difficulty = difficultyFromVenue(id)
            showToast(root, 'Admin: сменено заведение')
            paint()
            scheduleSave(state)
          },
        })
      },
    )
  }
  syncLoungeOfferUnlock(state)
  syncEmpireUnlock(state)
  paint()
  lastTs = performance.now()
  if (admin) {
    showToast(root, 'Режим ADMIN · панель справа внизу')
  }
  flushQueuedBootTips()
}

async function confirmAndResetCareer(): Promise<void> {
  const ok = await showMascotConfirm(root, {
    title: 'Начать заново?',
    body: 'Сбросятся имя, заведение и весь прогресс смены и лаунжа. Собранные трофеи останутся в коллекции.',
    confirmCta: 'Да, сбросить',
    cancelCta: 'Нет, остаюсь',
    pose: 'point',
  })
  if (!ok) return

  dismissGuideCoach(root)
  resetAchievementFanfareSeen()
  persistLifetimeTrophies(state)
  const keptTrophies = loadLifetimeTrophies()
  const archived = archiveCareerRun(state)
  resetSave()
  menuTab = 'story'
  gameStarted = false
  sessionStorage.setItem('lounge-idle-admin', '0')
  const url = new URL(location.href)
  url.searchParams.delete('boot')
  url.searchParams.delete('preview')
  url.searchParams.set('admin', '0')
  history.replaceState(null, '', url.pathname + url.search + url.hash)
  if (archived) {
    showToast(root, `Карьера в зале славы · ${pluralRuCount(archived.score, 'очко', 'очка', 'очков')} · день ${archived.workDays}`)
  }
  await startFromBoot(keptTrophies)
}

async function startFromBoot(preservedTrophies?: GameState['achievements']): Promise<void> {
  const boot = await runBoot(root)
  dismissGuideCoach(root)
  state = createInitialState()
  state.achievements = { ...(preservedTrophies ?? loadLifetimeTrophies()) }
  state.onboarded = true
  state.playerName = boot.playerName
  state.venueId = boot.venueId
  state.difficulty = difficultyFromVenue(boot.venueId)
  state.loungeName = 'Мой лаунж'
  applyBootGuideToState(state, boot.venueGuideDone)
  if (!saveState(state)) {
    showToast(
      root,
      'Не удалось сохранить старт — выключи частный режим Safari и обнови страницу',
    )
  }
  beginGame()
}

function applyBootStateToUi(): void {
  if (!gameStarted) return
  renderShell(root, state, handlers, menuTab, Date.now(), careerSubTab, storySubTab)
  updateHud(root, state, hudCoachContext())
}

async function resolveTelegramBootSave(): Promise<void> {
  state = loadState()
  const hadLocal = hasLocalSaveBlob()
  await waitForTelegramInitData(hadLocal && state.onboarded ? 1200 : 2500)

  const [remote, cloudRaw, deviceRaw] = await Promise.all([
    mergeRemoteSave(hadLocal, state, applySaveRaw),
    readTelegramCloudSaveRaw().catch(() => null),
    readTelegramDeviceSaveRaw().catch(() => null),
  ])

  let best = remote?.state ?? state
  if (cloudRaw) {
    try {
      best = preferSave(best, applySaveRaw(cloudRaw))
    } catch {
      /* ignore */
    }
  }
  if (deviceRaw) {
    try {
      best = preferSave(best, applySaveRaw(deviceRaw))
    } catch {
      /* ignore */
    }
  }

  if (!best.onboarded) {
    const cloud = await mergeTelegramCloudIntoLocal(
      hasLocalSaveBlob(),
      best,
      applySaveRaw,
    )
    best = cloud.state
  }
  if (!best.onboarded && isRemoteSyncConfigured()) {
    const pulled = await pullRemoteSave()
    if (pulled.ok && pulled.save?.onboarded) {
      best = applySaveRaw(JSON.stringify(pulled.save))
    }
  }

  state = best
  if (state.onboarded) {
    const tips = applyOffline(state, Date.now())
    saveState(state, { bumpSync: tips > 0 })
    void persistTelegramChannels(state, { keepalive: false, cloud: 'schedule' })
    applyBootStateToUi()
    offerWelcomeTips(tips)
  }
}

/** Пишем во все каналы, от которых зависит iPhone после закрытия. */
async function persistTelegramChannels(
  s: GameState,
  opts?: { keepalive?: boolean; cloud?: 'flush' | 'schedule' },
): Promise<void> {
  const tasks: Promise<unknown>[] = []
  if (isRemoteSyncConfigured()) {
    if (opts?.cloud === 'schedule') {
      scheduleRemoteSave(s)
    } else {
      tasks.push(flushRemoteSave(s, { keepalive: opts?.keepalive }))
    }
  }
  if (isTelegramCloudSaveAvailable()) {
    if (opts?.cloud === 'schedule') {
      scheduleTelegramCloudSave(s)
    } else {
      tasks.push(flushTelegramCloudSave(s))
    }
  }
  if (isTelegramDeviceSaveAvailable()) {
    tasks.push(flushTelegramDeviceSave(s))
  }
  await Promise.all(tasks)
}

async function bootApp(): Promise<void> {
  prepareTelegramMiniApp()

  if (isTelegramMiniApp()) {
    try {
      await navigator.storage?.persist?.()
    } catch {
      /* ignore */
    }
    await presentTelegramAgeGate(root)
    const bootParams = new URLSearchParams(location.search)
    if (bootParams.get('cloud') === 'pull') {
      clearLocalSaveBlob()
      bootParams.delete('cloud')
      const clean = bootParams.toString()
      history.replaceState(
        null,
        '',
        location.pathname + (clean ? `?${clean}` : '') + location.hash,
      )
    }
    state = loadState()
    const canPlayNow = Boolean(state.onboarded && state.venueId && state.playerName)
    if (canPlayNow) {
      void resolveTelegramBootSave()
    } else {
      await resolveTelegramBootSave()
    }
    pingTelegramPulse()
  }

  if (shouldShowBrowserGate()) {
    await presentBrowserGate(root)
    root.innerHTML = ''
  }

  const params = new URLSearchParams(location.search)
  if (params.get('boot') === 'name' || params.get('preview') === 'name') {
    params.delete('boot')
    params.delete('preview')
    const clean = params.toString()
    history.replaceState(null, '', location.pathname + (clean ? `?${clean}` : '') + location.hash)
  }

  if (params.get('reset') === '1') {
    sessionStorage.setItem('lounge-idle-admin', '0')
    params.delete('reset')
    params.set('admin', '0')
    const clean = params.toString()
    history.replaceState(null, '', location.pathname + (clean ? `?${clean}` : '') + location.hash)
    persistLifetimeTrophies(state)
    resetSave()
    gameStarted = false
    await startFromBoot(loadLifetimeTrophies())
    requestAnimationFrame(frame)
    return
  }

  if (isLayoutLabHost()) {
    if (ensureLabLounge(state)) saveState(state, { bumpSync: false })
    beginGame()
    requestAnimationFrame(frame)
    return
  }

  if (!state.onboarded || !state.venueId || !state.playerName) {
    await startFromBoot()
  } else {
    const webTips = isTelegramMiniApp() ? 0 : applyOffline(state, Date.now())
    beginGame()
    offerWelcomeTips(webTips)
  }
  requestAnimationFrame(frame)
}

function persistNow(): void {
  if (!state.onboarded) return
  scheduleSaveBase.flush(state, { bumpSync: false })
  void persistTelegramChannels(state, { keepalive: true })
}

window.addEventListener('beforeunload', persistNow)
window.addEventListener('pagehide', persistNow)
window.addEventListener('freeze', persistNow)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenSince = Date.now()
    persistNow()
    return
  }
  const awayMs = hiddenSince > 0 ? Date.now() - hiddenSince : 0
  if (hiddenSince > 0 && !shiftIdleOpen) {
    creditHiddenIdleTime(awayMs)
  }
  hiddenSince = 0
  if (gameStarted) updateHud(root, state, hudCoachContext())

  const afterReturn = (playedElsewhere: boolean): void => {
    if (playedElsewhere || !gameStarted || !state.onboarded) return
    offerWelcomeTips(grantWelcomeTips(state, awayMs))
  }

  // После фона: подтянуть прогресс с другого устройства (Mac ↔ телефон)
  if (
    document.visibilityState === 'visible' &&
    gameStarted &&
    state.onboarded &&
    isRemoteSyncConfigured()
  ) {
    void mergeRemoteSave(true, state, applySaveRaw).then((remote) => {
      if (remote?.source === 'remote') {
        state = remote.state
        scheduleSave.flush(state)
        renderShell(root, state, handlers, menuTab, Date.now(), careerSubTab, storySubTab)
        updateHud(root, state, hudCoachContext())
        afterReturn(true)
        return
      }
      afterReturn(false)
    })
    return
  }
  afterReturn(false)
})

/** Блокирует double-tap zoom и pinch на iOS/Android в игровом режиме. */
function preventMobileZoomGestures(): void {
  document.addEventListener(
    'dblclick',
    (e) => {
      e.preventDefault()
    },
    { passive: false },
  )
  for (const type of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
    document.addEventListener(type, (e) => e.preventDefault())
  }
}

preventMobileZoomGestures()

void bootApp().catch((err) => {
  console.error(err)
  showFatalError(err, 'запуске')
})
