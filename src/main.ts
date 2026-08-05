import './styles/main.css'
import {
  applyOffline,
  beginLoungePick,
  beginMenuPick,
  buyUpgrade,
  buyShopItem,
  buyTobacco,
  buyExpansion,
  cancelLoungePick,
  cancelMenuPick,
  canBrowseLoungeOffer,
  doJobTask,
  loungeOrder,
  maybeBrokeHint,
  minOpenLoungeCost,
  openLounge,
  quitJob,
  setMenuSlot,
  setScene,
  syncLoungeOfferUnlock,
  tickIncome,
  canQuitJob,
} from './game/career'
import { evaluateAchievements } from './data/achievements'
import { createInitialState, type GameState } from './game/state'
import {
  createDebouncedSave,
  loadState,
  resetSave,
  saveState,
} from './save/storage'
import { formatMoney } from './game/economy'
import { runBoot } from './ui/boot'
import {
  mountShell,
  renderShell,
  showToast,
  announceAchievements,
  updateHud,
  updateJobCooldowns,
  type MenuTab,
} from './ui/shell'
import {
  adminForceLounge,
  adminToJob,
  adminUnlockAll,
  isAdminEnabled,
  mountAdminPanel,
} from './admin'
import type { LoungeTierId } from './data/loungeTiers'
import type { TobaccoId } from './data/tobacco'
import type { ExpansionId } from './data/expansions'
import type { VenueId } from './data/venues'

const rootEl = document.querySelector<HTMLElement>('#app')
if (!rootEl) throw new Error('#app missing')
const root = rootEl

let state: GameState = loadState()
let menuTab: MenuTab = 'story'
let scheduleSave = createDebouncedSave(450)
let lastTs = performance.now()
let gameStarted = false
const admin = isAdminEnabled()

const handlers = {
  onJobTask(id: Parameters<typeof doJobTask>[1]) {
    const res = doJobTask(state, id, Date.now())
    if (!res.ok) {
      if (res.message) showToast(root, res.message)
      return
    }
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onLoungeOrder() {
    const res = loungeOrder(state)
    if (!res.ok) return
    afterAction()
  },
  onBuy(id: Parameters<typeof buyUpgrade>[1]) {
    const res = buyUpgrade(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    afterAction()
    maybeQuitToast()
  },
  onBuyShop(id: Parameters<typeof buyShopItem>[1]) {
    const res = buyShopItem(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onBuyTobacco(id: TobaccoId) {
    const res = buyTobacco(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onBuyExpansion(id: ExpansionId) {
    const res = buyExpansion(state, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    if (res.message) showToast(root, res.message)
    afterAction()
  },
  onBeginMenuPick(slot: number) {
    const res = beginMenuPick(state, slot)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
    paint()
  },
  onCancelMenuPick() {
    cancelMenuPick(state)
    paint()
  },
  onSetMenuSlot(slot: number, id: TobaccoId | null) {
    const res = setMenuSlot(state, slot, id)
    if (!res.ok && res.message) showToast(root, res.message)
    if (!res.ok) return
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
    afterAction()
  },
  onMenuTab(tab: MenuTab) {
    if (tab === 'own') {
      syncLoungeOfferUnlock(state)
      if (!canBrowseLoungeOffer(state)) {
        showToast(
          root,
          `Накопи ${Math.ceil(minOpenLoungeCost() - state.cash)} до вкладки «Свой зал»`,
        )
        return
      }
    }
    if (tab === 'own' && state.phase !== 'employed') {
      menuTab = 'story'
      paint()
      return
    }
    menuTab = tab
    paint()
  },
  onReset() {
    resetSave()
    state = createInitialState()
    menuTab = 'story'
    gameStarted = false
    void startFromBoot()
  },
}

function afterAction(): void {
  const offerWasLocked = !state.flags.loungeOfferUnlocked
  syncLoungeOfferUnlock(state)
  if (
    offerWasLocked &&
    state.flags.loungeOfferUnlocked &&
    state.phase === 'employed'
  ) {
    showToast(root, 'Вкладка «Свой зал» открыта — можно выбрать тариф')
  }
  const unlocked = evaluateAchievements(state)
  const hint = maybeBrokeHint(state)
  if (hint) showToast(root, hint)
  if (state.phase !== 'employed' && menuTab === 'own') menuTab = 'story'
  paint()
  if (unlocked.length) announceAchievements(root, unlocked)
  scheduleSave(state)
}

function maybeQuitToast(): void {
  if (state.phase !== 'dual' || state.flags.sawQuitReady) return
  if (!canQuitJob(state)) return
  state.flags.sawQuitReady = true
  showToast(root, 'Свой зал тянет сам — можно уволиться со смены.')
}

function paint(): void {
  if (!gameStarted) return
  renderShell(root, state, handlers, menuTab, Date.now())
}

function frame(ts: number): void {
  if (!gameStarted) {
    requestAnimationFrame(frame)
    return
  }
  const dt = Math.min(0.25, (ts - lastTs) / 1000)
  lastTs = ts
  tickIncome(state, dt)
  updateHud(root, state)
  if (menuTab === 'story' && state.scene === 'job') {
    updateJobCooldowns(root, state, Date.now())
  }
  const unlocked = evaluateAchievements(state)
  if (unlocked.length) {
    announceAchievements(root, unlocked)
    if (menuTab === 'achievements') paint()
    scheduleSave(state)
  }
  scheduleSave(state)
  requestAnimationFrame(frame)
}

function beginGame(offlineGain = 0): void {
  gameStarted = true
  mountShell(root, handlers)
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
        showToast(root, 'Admin: сменено заведение')
        paint()
        scheduleSave(state)
      },
    })
  }
  paint()
  lastTs = performance.now()
  if (offlineGain > 0.5) {
    showToast(root, `Пока тебя не было, зал принёс +${Math.floor(offlineGain)}`)
  }
  if (admin) {
    showToast(root, 'Режим ADMIN · панель справа внизу')
  }
}

async function startFromBoot(): Promise<void> {
  if (admin) {
    state = createInitialState()
    state.onboarded = true
    state.playerName = 'Admin'
    state.venueId = 'smoke_river'
    state.loungeName = 'Угол Admin'
    adminUnlockAll(state)
    saveState(state)
    beginGame(0)
    return
  }
  const boot = await runBoot(root)
  state = createInitialState()
  state.onboarded = true
  state.playerName = boot.playerName
  state.venueId = boot.venueId
  state.loungeName = `Угол ${boot.playerName}`
  saveState(state)
  beginGame(0)
}

async function bootApp(): Promise<void> {
  if (!state.onboarded || !state.venueId || !state.playerName) {
    await startFromBoot()
  } else {
    const offlineGain = applyOffline(state, Date.now())
    beginGame(offlineGain)
  }
  requestAnimationFrame(frame)
}

window.addEventListener('beforeunload', () => {
  if (state.onboarded) saveState(state)
})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && state.onboarded) saveState(state)
})

void bootApp()
