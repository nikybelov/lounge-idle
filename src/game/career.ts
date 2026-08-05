import {
  BROKE_THRESHOLD,
  JOB_TASKS,
  QUIT_INCOME_THRESHOLD,
  isTaskUnlocked,
  type TaskId,
} from '../data/tasks'
import {
  SHOP_ITEMS,
  isShopItemAvailable,
  taskCooldownMs,
  taskPay,
  type ShopItemId,
} from '../data/shop'
import { canPromote, nextRank, rankDef } from '../data/ranks'
import { getVenue } from '../data/venues'
import {
  cheapestLoungeTier,
  getLoungeTier,
  type LoungeTierId,
} from '../data/loungeTiers'
import { getTobacco, type TobaccoId } from '../data/tobacco'
import { getExpansion, type ExpansionId } from '../data/expansions'
import { ensureMenuSlots, furnitureLevel, menuSlotCount } from './appeal'
import { UPGRADES, type UpgradeId } from '../data/upgrades'
import {
  isUpgradeUnlocked,
  loungeClickPower,
  loungeIncomePerSec,
  upgradeCost,
} from './economy'
import type { GameState, Scene } from './state'

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string }

export function minOpenLoungeCost(): number {
  return cheapestLoungeTier().cost
}

/** Вкладка выбора зала доступна */
export function canBrowseLoungeOffer(state: GameState): boolean {
  return (
    state.phase === 'employed' &&
    (state.flags.loungeOfferUnlocked || state.cash >= minOpenLoungeCost())
  )
}

export function syncLoungeOfferUnlock(state: GameState): void {
  if (state.phase === 'employed' && state.cash >= minOpenLoungeCost()) {
    state.flags.loungeOfferUnlocked = true
  }
}

export function canOpenLounge(state: GameState): boolean {
  return canBrowseLoungeOffer(state)
}

export function beginLoungePick(state: GameState): ActionResult {
  if (state.phase !== 'employed') {
    return { ok: false, message: 'Угол уже твой' }
  }
  syncLoungeOfferUnlock(state)
  if (!canBrowseLoungeOffer(state)) {
    return {
      ok: false,
      message: `Нужно ещё ${Math.ceil(minOpenLoungeCost() - state.cash)}`,
    }
  }
  state.flags.pickingLounge = false
  return { ok: true }
}

export function cancelLoungePick(state: GameState): void {
  state.flags.pickingLounge = false
}

export function openLounge(state: GameState, tierId: LoungeTierId): ActionResult {
  if (state.phase !== 'employed') {
    return { ok: false, message: 'Угол уже твой' }
  }
  const tier = getLoungeTier(tierId)
  if (state.cash < tier.cost) {
    return {
      ok: false,
      message: `Нужно ещё ${Math.ceil(tier.cost - state.cash)}`,
    }
  }
  state.cash -= tier.cost
  state.phase = 'dual'
  state.scene = 'lounge'
  state.flags.pickingLounge = false
  state.flags.loungeOfferUnlocked = false
  state.loungeTier = tier.id
  state.loungeIncomeMult = tier.incomeMult
  state.loungeClickMult = tier.clickMult
  state.loungeName = `${tier.name} · ${state.playerName || 'Мой'}`

  state.owned = {
    table: 0,
    sofa: 0,
    menu: 0,
    hood: 0,
    vip: 0,
  }
  for (const [id, lvl] of Object.entries(tier.startOwned)) {
    state.owned[id as UpgradeId] = lvl ?? 0
  }
  for (const shopId of tier.startShop) {
    state.shopOwned[shopId] = true
  }

  // Стартовый вкус — чтобы зал не стартовал «пустым»
  state.ownedTobacco.dawn_apple = true
  state.menuSlots = ['dawn_apple']
  if (tier.id !== 'nook') {
    state.ownedTobacco.mint_fog = true
    state.menuSlots = ['dawn_apple', 'mint_fog']
  }
  state.menuPickSlot = null

  return {
    ok: true,
    message: `Открыт «${tier.name}»: доход ×${tier.incomeMult}, заказ ×${tier.clickMult}`,
  }
}

export function shopItemCost(state: GameState, baseCost: number): number {
  return Math.max(1, Math.floor(baseCost * getVenue(state.venueId).shopPriceMult))
}

export function canQuitJob(state: GameState): boolean {
  return (
    state.phase === 'dual' && loungeIncomePerSec(state) >= QUIT_INCOME_THRESHOLD
  )
}

export function quitJob(state: GameState): ActionResult {
  if (state.phase !== 'dual') {
    return { ok: false, message: 'Ты уже не на смене' }
  }
  if (!canQuitJob(state)) {
    return {
      ok: false,
      message: `Нужен свой доход от ${QUIT_INCOME_THRESHOLD}/сек`,
    }
  }
  state.phase = 'ownOnly'
  state.scene = 'lounge'
  return { ok: true, message: 'Смена закрыта. Дальше — только свой лаунж.' }
}

export function setScene(state: GameState, scene: Scene): ActionResult {
  if (scene === 'job') {
    if (state.phase === 'ownOnly') {
      return { ok: false, message: 'Ты уже уволился' }
    }
    if (state.phase === 'employed') {
      state.scene = 'job'
      return { ok: true }
    }
    state.scene = 'job'
    state.flags.returnedToJob = true
    return { ok: true }
  }
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала открой свой угол' }
  }
  state.scene = 'lounge'
  return { ok: true }
}

function newlyUnlockedTasks(
  state: GameState,
  before: Record<TaskId, number>,
): string[] {
  const unlocked: string[] = []
  for (const task of JOB_TASKS) {
    if (!task.unlockAfter) continue
    const was = isTaskUnlocked(task, before)
    const now = isTaskUnlocked(task, state.taskDone)
    if (!was && now) unlocked.push(task.label)
  }
  return unlocked
}

/** Автоповышение, если выполнены условия следующего ранга */
export function tryPromote(state: GameState): string | null {
  if (!canPromote(state.jobRank, state.taskDone)) return null
  const next = nextRank(state.jobRank)
  if (!next) return null
  state.jobRank = next.id
  return `Повышение: ${next.title}`
}

export function doJobTask(state: GameState, taskId: TaskId, now: number): ActionResult {
  if (state.scene !== 'job' || state.phase === 'ownOnly') {
    return { ok: false, message: 'Сейчас не смена' }
  }
  const task = JOB_TASKS.find((t) => t.id === taskId)
  if (!task) return { ok: false, message: 'Нет такой задачи' }
  if (!isTaskUnlocked(task, state.taskDone)) {
    return { ok: false, message: 'Пока нет доступа — сначала предыдущие задачи' }
  }
  if (now < state.taskReadyAt[taskId]) {
    return { ok: false, message: 'Ещё занят' }
  }
  const before = { ...state.taskDone }
  const mult = rankDef(state.jobRank).payMult * getVenue(state.venueId).payMult
  state.cash += taskPay(task.pay, taskId, state.shopOwned, mult)
  state.taskDone[taskId] += 1
  state.taskReadyAt[taskId] =
    now +
    Math.round(
      taskCooldownMs(task.cooldownMs, taskId, state.shopOwned) *
        getVenue(state.venueId).cooldownMult,
    )

  const parts: string[] = []
  const unlocked = newlyUnlockedTasks(state, before)
  if (unlocked.length) parts.push(`Открыто: ${unlocked.join(', ')}`)
  const promo = tryPromote(state)
  if (promo) parts.push(promo)

  if (parts.length) return { ok: true, message: parts.join('. ') }
  return { ok: true }
}

export function buyShopItem(state: GameState, id: ShopItemId): ActionResult {
  if (state.phase === 'ownOnly') {
    return { ok: false, message: 'Смена уже закрыта' }
  }
  const item = SHOP_ITEMS.find((i) => i.id === id)
  if (!item) return { ok: false, message: 'Нет такого' }
  if (state.shopOwned[id]) {
    return { ok: false, message: 'Уже куплено' }
  }
  if (!isShopItemAvailable(item, state.taskDone, state.jobRank)) {
    return { ok: false, message: 'Нужен выше ранг или задача' }
  }
  const cost = shopItemCost(state, item.cost)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= cost
  state.shopOwned[id] = true
  return { ok: true, message: `Куплено: ${item.name}` }
}

export function loungeOrder(state: GameState): ActionResult {
  if (state.scene !== 'lounge' || state.phase === 'employed') {
    return { ok: false, message: 'Ты не в своём зале' }
  }
  state.cash += loungeClickPower(state)
  state.flags.loungeOrders += 1
  return { ok: true }
}

export function buyUpgrade(state: GameState, id: UpgradeId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой угол' }
  }
  const def = UPGRADES.find((u) => u.id === id)
  if (!def) return { ok: false, message: 'Нет такого' }
  if (!isUpgradeUnlocked(state, def)) {
    return { ok: false, message: 'Ещё рано' }
  }
  const level = state.owned[id]
  const cost = upgradeCost(def, level)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= cost
  state.owned[id] += 1
  return { ok: true }
}

export function tickIncome(state: GameState, dtSec: number): void {
  if (state.phase === 'employed') return
  const income = loungeIncomePerSec(state) * dtSec
  if (income > 0) state.cash += income
}

export function applyOffline(state: GameState, now: number, capHours = 8): number {
  const elapsedMs = Math.max(0, now - state.lastActive)
  const capped = Math.min(elapsedMs, capHours * 3600_000)
  const dt = capped / 1000
  const before = state.cash
  tickIncome(state, dt)
  state.lastActive = now
  return state.cash - before
}

export function maybeBrokeHint(state: GameState): string | null {
  if (state.phase !== 'dual') return null
  if (state.cash > BROKE_THRESHOLD) return null
  if (state.flags.sawBrokeHint) return null
  state.flags.sawBrokeHint = true
  return 'Касса пустеет — на старой смене тебя не увольняли. Можно вернуться.'
}

export function buyTobacco(state: GameState, id: TobaccoId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  const def = getTobacco(id)
  if (!def) return { ok: false, message: 'Нет такого вкуса' }
  if (state.ownedTobacco[id]) {
    return { ok: false, message: 'Уже куплено' }
  }
  if (state.owned.menu < def.needMenuLevel) {
    return {
      ok: false,
      message: `Нужно «Меню вкусов» ур.${def.needMenuLevel}`,
    }
  }
  if (state.cash < def.cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= def.cost
  state.ownedTobacco[id] = true
  return { ok: true, message: `В склад: ${def.name}` }
}

export function beginMenuPick(state: GameState, slot: number): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  ensureMenuSlots(state)
  if (slot < 0 || slot >= menuSlotCount(state)) {
    return { ok: false, message: 'Нет такого слота' }
  }
  state.menuPickSlot = slot
  return { ok: true }
}

export function cancelMenuPick(state: GameState): void {
  state.menuPickSlot = null
}

export function setMenuSlot(
  state: GameState,
  slot: number,
  tobaccoId: TobaccoId | null,
): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  ensureMenuSlots(state)
  const n = menuSlotCount(state)
  if (slot < 0 || slot >= n) {
    return { ok: false, message: 'Нет такого слота' }
  }
  if (tobaccoId) {
    if (!state.ownedTobacco[tobaccoId]) {
      return { ok: false, message: 'Сначала купи вкус' }
    }
    for (let i = 0; i < n; i++) {
      if (i !== slot && state.menuSlots[i] === tobaccoId) {
        state.menuSlots[i] = null
      }
    }
  }
  state.menuSlots[slot] = tobaccoId
  state.menuPickSlot = null
  return { ok: true }
}

export function buyExpansion(state: GameState, id: ExpansionId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  const def = getExpansion(id)
  if (!def) return { ok: false, message: 'Нет такого' }
  if (state.expansions[id]) {
    return { ok: false, message: 'Уже открыто' }
  }
  if (furnitureLevel(state) < def.needFurniture) {
    return {
      ok: false,
      message: `Нужно больше мебели (ур. ${def.needFurniture})`,
    }
  }
  if (state.cash < def.cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= def.cost
  state.expansions[id] = true
  return {
    ok: true,
    message: `Зона «${def.name}»: +${def.seats} мест`,
  }
}
