import './styles/main.css'
import './styles/lounge-theme.css'
import {
  syncSessionTime,
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
import { showMascotConfirm } from './ui/mascot'
import { loadLifetimeTrophies, persistLifetimeTrophies } from './save/trophies'
import { syncProgressFlags } from './game/progressFlags'
import { rankDef } from './data/ranks'
import { JOB_TASKS } from './data/tasks'
import { taskPay } from './data/shop'
import { getVenue } from './data/venues'
import {
  markTabHintSeen,
  syncGuideProgress,
  storySubHintMessage,
  tabHintMessage,
  consumePersonalIntroHint,
  applyBootGuideToState,
  ackGuideCoach,
  contextualOgonokTip,
  touchOgonokInteraction,
} from './game/guide'
import { tickWorkDays } from './game/workDays'
import { archiveCareerRun, encodeCareerShare, decodeCareerShare } from './save/leaderboard'
import { createInitialState, type GameState } from './game/state'
import {
  createDebouncedSave,
  loadState,
  resetSave,
  saveState,
} from './save/storage'
import { applySettings, isCoachEnabled, loadSettings } from './save/settings'
import { formatMoney } from './game/economy'
import { runBoot } from './ui/boot'
import { openSettingsPanel } from './ui/settingsPanel'
import { launchPromotion, upgradePromotion } from './game/promotions'
import type { PromotionId } from './data/promotions'
import {
  mountShell,
  renderShell,
  showToast,
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
import { dismissGuideCoach, presentStandaloneCoach, queueTabHint } from './ui/guideOverlay'
import { initUiPolish } from './ui/atmosphere'
import { syncAmbientMusic } from './ui/ambientMusic'
import { primeAudio } from './ui/juice'
import { loungeClickPower } from './game/economy'
import {
  adminForceLounge,
  adminToJob,
  adminUnlockAll,
  isAdminEnabled,
  mountAdminPanel,
} from './admin'
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
let scheduleSave = createDebouncedSave(450)
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
          `Накопи ${Math.ceil(minOpenLoungeCost(state) - state.cash)} до вкладки «Свой зал»`,
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
    if (tab !== 'story') storySubTab = 'tasks'
    if (state.phase === 'dual' && isLoungeOnlyMenuTab(tab)) {
      state.scene = 'lounge'
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
    openSettingsPanel(root, () => {
      applySettings(root)
      syncAmbientMusic()
      dismissGuideCoach(root)
      paint()
    })
  },
}

function onAchievementsUnlocked(unlocked: ReturnType<typeof evaluateAchievements>): void {
  if (!unlocked.length) return
  saveState(state)
  announceAchievements(root, state, menuTab, unlocked)
}

function afterAction(): void {
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
    showToast(root, 'Вкладка «Свой зал» открыта — можно выбрать тариф')
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
  syncGuideProgress(state)
  if (state.phase !== 'employed' && menuTab === 'own') menuTab = 'story'
  if (state.phase === 'employed' && menuTab === 'tobacco') menuTab = 'story'
  if (state.phase === 'employed' && menuTab === 'staff') menuTab = 'story'
  if (state.phase === 'employed' && menuTab === 'personal') menuTab = 'story'
  if (!canBrowseEmpire(state) && menuTab === 'network') menuTab = 'story'
  paint()
  maybePresentCelebration(state, () => {
    const personalHint = consumePersonalIntroHint(state)
    if (personalHint) {
      queueTabHint(personalHint, () => {
        markTabHintSeen(state, 'personal')
        scheduleSave(state)
      })
    }
    scheduleSave(state)
    paint()
    flushAchievementQueue(root, state, menuTab)
  })
  if (unlocked.length) onAchievementsUnlocked(unlocked)
  else flushAchievementQueue(root, state, menuTab)
  scheduleSave(state)
}

function maybeQuitToast(): void {
  if (!isCoachEnabled()) {
    if (state.phase !== 'dual' || state.flags.sawQuitReady) return
    if (!canQuitJob(state)) return
    state.flags.sawQuitReady = true
    showToast(root, 'Свой зал тянет сам — можно уволиться со смены.')
    return
  }
  // milestone quit_ready — через guideCoach
}

function paint(): void {
  if (!gameStarted) return
  renderShell(root, state, handlers, menuTab, Date.now(), careerSubTab, storySubTab)
}

function passiveAccruesNow(): boolean {
  return gameStarted && !document.hidden
}

function frame(ts: number): void {
  if (!gameStarted) {
    requestAnimationFrame(frame)
    return
  }
  const dt = Math.min(0.25, (ts - lastTs) / 1000)
  lastTs = ts
  if (passiveAccruesNow()) {
    tickIncome(state, dt)
    tickWorkDays(state, dt)
  }
  updateHud(root, state, hudCoachContext())
  if (state.phase !== 'employed' && !isCoachEnabled()) {
    const shelfHint = maybeShelfFeedback(state)
    if (shelfHint) showToast(root, shelfHint)
    const payrollHint = maybePayrollFeedback(state)
    if (payrollHint) showToast(root, payrollHint)
  }
  if (menuTab === 'story' && canDoJobTasks(state)) {
    updateJobCooldowns(root, state, Date.now())
  }
  if (menuTab === 'personal' && state.phase !== 'employed') {
    updatePersonalCooldowns(root, state, Date.now())
  }
  const unlocked = evaluateAchievements(state)
  if (unlocked.length) {
    onAchievementsUnlocked(unlocked)
    if (menuTab === 'career') paint()
  }
  scheduleSave(state)
  requestAnimationFrame(frame)
}

function beginGame(): void {
  dismissGuideCoach(root)
  gameStarted = true
  syncAchievementFanfareSeen(state)
  mountShell(root, handlers)
  applySettings(root)
  initUiPolish(root)
  primeAudio()
  syncAmbientMusic()
  if (admin) {
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
        showToast(root, `Admin: зал «${tier}»`)
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
  }
  syncLoungeOfferUnlock(state)
  syncEmpireUnlock(state)
  paint()
  lastTs = performance.now()
  if (admin) {
    showToast(root, 'Режим ADMIN · панель справа внизу')
  }
}

async function confirmAndResetCareer(): Promise<void> {
  const ok = await showMascotConfirm(root, {
    title: 'Начать заново?',
    body: 'Сбросятся имя, заведение и весь прогресс смены и зала. Собранные трофеи останутся в коллекции.',
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
    showToast(root, `Карьера в зале славы · ${archived.score} очков · день ${archived.workDays}`)
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
  state.loungeName = `Угол ${boot.playerName}`
  applyBootGuideToState(state, boot.venueGuideDone)
  saveState(state)
  beginGame()
}

async function bootApp(): Promise<void> {
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

  if (!state.onboarded || !state.venueId || !state.playerName) {
    await startFromBoot()
  } else {
    syncSessionTime(state, Date.now())
    beginGame()
  }
  requestAnimationFrame(frame)
}

window.addEventListener('beforeunload', () => {
  if (state.onboarded) saveState(state)
})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && state.onboarded) saveState(state)
  if (gameStarted) updateHud(root, state, hudCoachContext())
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

void bootApp()
