import {
  BROKE_THRESHOLD,
  JOB_TASKS,
  QUIT_INCOME_THRESHOLD,
  isTaskUnlocked,
  type TaskId,
} from '../data/tasks'
import {
  SHOP_ITEMS,
  canUpgradeShopItem,
  nextShopGrade,
  shopLevel,
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
import { getBranch, type BranchId } from '../data/branches'
import {
  addStaffCheck,
  fireStaffMemberCheck,
  hireStaffCheck,
  staffHeadcount,
  staffMembers,
  staffPayrollPerSec,
  upgradeStaffMemberCheck,
} from './staff'
import {
  extraStaffHireCost,
  getStaffRole,
  type StaffId,
} from '../data/staff'
import {
  openBranchCheck,
  syncEmpireUnlock,
} from './empire'
import {
  furnitureLevel,
  isOnShelf,
  shelfCapacity,
  shelfMood,
} from './appeal'
import { UPGRADES, type UpgradeId } from '../data/upgrades'
import {
  isUpgradeUnlocked,
  loungeClickPower,
  loungeIncomePerSec,
  upgradeCost,
} from './economy'
import type { GameState, Scene } from './state'

/** Пассив «репутация на смене» — первый idle до своего зала */
export function jobReputationPerSec(state: GameState): number {
  if (state.phase !== 'employed') return 0
  const total =
    state.taskDone.wash + state.taskDone.coals + state.taskDone.order
  if (total < 3) return 0
  return Math.min(0.55, 0.04 + total * 0.012)
}

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
  state.flags.personalIntroPending = true
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
  // Инструменты с прошлой смены не переносятся — только комплект тарифа
  state.shopOwned = {}
  for (const shopId of tier.startShop) {
    state.shopOwned[shopId] = 1
  }

  // Стартовый вкус — чтобы зал не стартовал «пустым»
  state.ownedTobacco = {}
  state.shelfActive = []
  state.staffMembers = {}

  state.flags.celebration = {
    kind: 'lounge',
    title: `«${tier.name}» открыт!`,
    subtitle: `${state.playerName || 'Ты'} — теперь свой хозяин. Подрабатывай, качай зал и развивай личный бренд во вкладке «Личное».`,
  }

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
  syncEmpireUnlock(state)
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
  state.flags.celebration = {
    kind: 'rank',
    title: next.title,
    subtitle: `«${getVenue(state.venueId).name}» повышает тебя — оплата задач ×${next.payMult.toFixed(2)}`,
  }
  return `Повышение: ${next.title}`
}

export function canDoJobTasks(state: GameState): boolean {
  if (state.phase === 'ownOnly') return false
  if (state.phase === 'employed') return state.scene === 'job'
  if (state.phase === 'dual') {
    return state.scene === 'job' || state.scene === 'lounge'
  }
  return false
}

export function doJobTask(state: GameState, taskId: TaskId, now: number): ActionResult {
  if (!canDoJobTasks(state)) {
    return {
      ok: false,
      message: state.phase === 'ownOnly' ? 'Смена уже закрыта' : 'Сейчас не смена',
    }
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
  const level = shopLevel(state.shopOwned, id)
  const next = nextShopGrade(item, level)
  if (!next) {
    return { ok: false, message: 'Максимальный уровень' }
  }
  if (!canUpgradeShopItem(item, level, state.taskDone, state.jobRank)) {
    return { ok: false, message: 'Сначала открой задачу или подними ранг' }
  }
  const cost = shopItemCost(state, next.cost)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= cost
  state.shopOwned[id] = next.level
  const verb = level === 0 ? 'Куплено' : 'Улучшено'
  return { ok: true, message: `${verb}: ${item.name} · ур.${next.level}` }
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
  if (state.phase === 'employed') {
    const rep = jobReputationPerSec(state) * dtSec
    if (rep > 0) state.cash += rep
    return
  }
  const income = loungeIncomePerSec(state) * dtSec
  if (income !== 0) state.cash += income
}

/** Офлайн-дохода нет — только отметка возвращения в сессию */
export function syncSessionTime(state: GameState, now: number): void {
  state.lastActive = now
}

/** @deprecated офлайн-пассив отключён — используй syncSessionTime */
export function applyOffline(state: GameState, now: number): number {
  syncSessionTime(state, now)
  return 0
}

export function maybeBrokeHint(state: GameState): string | null {
  if (state.phase !== 'dual') return null
  if (state.cash > BROKE_THRESHOLD) return null
  if (state.flags.sawBrokeHint) return null
  state.flags.sawBrokeHint = true
  return 'Касса пустеет — на старой смене тебя не увольняли. Можно вернуться.'
}

export function orderTobacco(state: GameState, id: TobaccoId): ActionResult {
  return buyTobacco(state, id)
}

export function buyTobacco(state: GameState, id: TobaccoId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  const def = getTobacco(id)
  if (!def) return { ok: false, message: 'Нет такого вкуса' }
  if (state.ownedTobacco[id]) {
    return { ok: false, message: 'Уже на складе' }
  }
  if (state.cash < def.cost) {
    return { ok: false, message: `Не хватает · нужно ${Math.ceil(def.cost - state.cash)}` }
  }
  state.cash -= def.cost
  state.ownedTobacco[id] = true
  return {
    ok: true,
    message: `Заказано: ${def.name}. Поставь на полку во вкладке «Табак».`,
  }
}

export function putOnShelf(state: GameState, id: TobaccoId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  if (!state.ownedTobacco[id]) {
    return { ok: false, message: 'Сначала закажи на склад' }
  }
  if (isOnShelf(state, id)) {
    return { ok: false, message: 'Уже на полке' }
  }
  const cap = shelfCapacity(state)
  if (state.shelfActive.length >= cap) {
    return {
      ok: false,
      message: `Полка полная (${cap}). Убери вкус или купи стеллаж.`,
    }
  }
  state.shelfActive.push(id)
  return { ok: true, message: `${getTobacco(id)?.name} — на полке` }
}

export function removeFromShelf(state: GameState, id: TobaccoId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой зал' }
  }
  const idx = state.shelfActive.indexOf(id)
  if (idx < 0) {
    return { ok: false, message: 'Этого вкуса нет на полке' }
  }
  state.shelfActive.splice(idx, 1)
  return { ok: true, message: `${getTobacco(id)?.name} — убран с полки` }
}

export function maybeShelfFeedback(state: GameState): string | null {
  if (state.phase === 'employed') return null
  const mood = shelfMood(state)

  if (mood === 'empty') {
    if (state.flags.shelfEmptyWarned) return null
    state.flags.shelfEmptyWarned = true
    state.flags.shelfSparseWarned = true
    return 'Табачная полка пуста — гости разворачиваются и не платят.'
  }
  state.flags.shelfEmptyWarned = false

  if (mood === 'sparse') {
    if (state.flags.shelfSparseWarned) return null
    state.flags.shelfSparseWarned = true
    state.flags.shelfRichToast = false
    return 'На полке всего пара вкусов — гости возмущаются и уходят раньше.'
  }
  state.flags.shelfSparseWarned = false

  if (mood === 'rich') {
    if (state.flags.shelfRichToast) return null
    state.flags.shelfRichToast = true
    return 'Богатая полка — гости довольны, чаевые и поток выше.'
  }
  state.flags.shelfRichToast = false
  return null
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

export function openBranch(state: GameState, id: BranchId): ActionResult {
  const check = openBranchCheck(state, id)
  if (!check.ok) return check
  const def = getBranch(id)!
  state.cash -= def.cost
  state.branches[id] = true
  return {
    ok: true,
    message: `Открыт филиал «${def.name}» — сеть ×${(1 + def.incomeMult).toFixed(2)} к доходу`,
  }
}

export function hireStaff(state: GameState, id: StaffId): ActionResult {
  const check = hireStaffCheck(state, id)
  if (!check.ok) return check
  const role = getStaffRole(id)!
  const grade = role.grades[0]
  state.cash -= grade.hireCost
  state.staffMembers[id] = [1]
  state.flags.payrollWarned = false
  return {
    ok: true,
    message: `Нанят: ${role.name} · ${grade.title}. Зарплата ${grade.salaryPerSec.toFixed(grade.salaryPerSec < 1 ? 2 : 1)}/с`,
  }
}

export function upgradeStaff(state: GameState, id: StaffId, index: number): ActionResult {
  const check = upgradeStaffMemberCheck(state, id, index)
  if (!check.ok) return check
  const role = getStaffRole(id)!
  const members = [...staffMembers(state, id)]
  const nextGrade = members[index] + 1
  const grade = role.grades[nextGrade - 1]
  state.cash -= grade.hireCost
  members[index] = nextGrade
  state.staffMembers[id] = members
  state.flags.payrollWarned = false
  const label = members.length > 1 ? ` · №${index + 1}` : ''
  return {
    ok: true,
    message: `Повышен: ${role.name}${label} → ${grade.title}`,
  }
}

export function addStaff(state: GameState, id: StaffId): ActionResult {
  const check = addStaffCheck(state, id)
  if (!check.ok) return check
  const role = getStaffRole(id)!
  const def = role.grades[0]
  const cost = extraStaffHireCost(id, 1)
  state.cash -= cost
  state.staffMembers[id] = [...staffMembers(state, id), 1]
  state.flags.payrollWarned = false
  return {
    ok: true,
    message: `+1 ${role.name.toLowerCase()} · ${def.title} (с 1-го грейда). В команде ${staffHeadcount(state, id)}`,
  }
}

export function fireStaff(state: GameState, id: StaffId, index: number): ActionResult {
  const check = fireStaffMemberCheck(state, id, index)
  if (!check.ok) return check
  const role = getStaffRole(id)!
  const members = [...staffMembers(state, id)]
  members.splice(index, 1)
  if (members.length) {
    state.staffMembers[id] = members
  } else {
    delete state.staffMembers[id]
  }
  const label = members.length > 0 ? ` · осталось ${members.length}` : ''
  return {
    ok: true,
    message:
      members.length > 0
        ? `${role.name} №${index + 1} уволен${label}`
        : `${role.name} уволен — ФОТ снижен`,
  }
}

export function maybePayrollFeedback(state: GameState): string | null {
  if (state.phase === 'employed') return null
  const payroll = staffPayrollPerSec(state)
  if (payroll <= 0) {
    state.flags.payrollWarned = false
    return null
  }
  const net = loungeIncomePerSec(state)
  if (net >= 0) {
    state.flags.payrollWarned = false
    return null
  }
  if (state.flags.payrollWarned) return null
  state.flags.payrollWarned = true
  return `ФОТ (${payroll.toFixed(1)}/с) съедает выручку — уволи кого-то во вкладке «Команда».`
}
