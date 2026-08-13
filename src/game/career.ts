import {
  BROKE_THRESHOLD,
  JOB_TASKS,
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
  getLoungeTier,
  type LoungeTierId,
} from '../data/loungeTiers'
import { starterShelfTobaccos } from '../data/loungeStart'
import { getTobacco, type TobaccoId } from '../data/tobacco'
import { getExpansion, type ExpansionId } from '../data/expansions'
import { getBranch, type BranchId } from '../data/branches'
import {
  addStaffCheck,
  fireStaffMemberCheck,
  hireStaffCheck,
  staffHeadcount,
  staffMembers,
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
  loungeService,
  shelfCapacity,
  shelfMood,
} from './appeal'
import { pickServiceComplaint } from './service'
import { UPGRADES, type UpgradeId } from '../data/upgrades'
import {
  isUpgradeUnlocked,
  loungeClickPower,
  loungeIncomePerSec,
  staffPayrollPerSec,
  staffPayrollShare,
  upgradeCost,
} from './economy'
import type { GameState, Scene } from './state'
import {
  loungeTierCost,
  minOpenLoungeCost,
  quitIncomeThreshold,
  resolveDifficulty,
  scaledBranchCost,
  scaledExpansionCost,
  scaledShiftShopCost,
  scaledStaffHireCost,
  scaledUpgradeCost,
} from './difficulty'
import { syncProgressFlags } from './progressFlags'
import { welcomeTipsAmount } from './welcomeTips'

export { minOpenLoungeCost, loungeTierCost, quitIncomeThreshold } from './difficulty'

/** Пассивный доход на смене — первый idle до своего зала */
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

export function canBrowseLoungeOffer(state: GameState): boolean {
  return (
    state.phase === 'employed' &&
    (state.flags.loungeOfferUnlocked || state.cash >= minOpenLoungeCost(state))
  )
}

export function syncLoungeOfferUnlock(state: GameState): void {
  if (state.phase === 'employed' && state.cash >= minOpenLoungeCost(state)) {
    state.flags.loungeOfferUnlocked = true
  }
}

export function canOpenLounge(state: GameState): boolean {
  return canBrowseLoungeOffer(state)
}

export function beginLoungePick(state: GameState): ActionResult {
  if (state.phase !== 'employed') {
    return { ok: false, message: 'Лаунж уже твой' }
  }
  syncLoungeOfferUnlock(state)
  if (!canBrowseLoungeOffer(state)) {
    return {
      ok: false,
      message: `Нужно ещё ${Math.ceil(minOpenLoungeCost(state) - state.cash)}`,
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
    return { ok: false, message: 'Лаунж уже твой' }
  }
  const tier = getLoungeTier(tierId)
  const cost = loungeTierCost(state, tier.cost)
  if (state.cash < cost) {
    return {
      ok: false,
      message: `Нужно ещё ${Math.ceil(cost - state.cash)}`,
    }
  }
  state.cash -= cost
  state.phase = 'dual'
  state.flags.hadDualPhase = true
  state.scene = 'lounge'
  state.flags.pickingLounge = false
  state.flags.loungeOfferUnlocked = false
  state.flags.tobaccoSetupPending = true
  state.flags.personalIntroPending = true
  state.flags.shelfEmptyWarned = false
  state.flags.shelfSparseWarned = false
  state.flags.milestoneHints.shelf_empty = false
  state.flags.tabHints.tobacco = false
  state.loungeTier = tier.id
  state.loungeIncomeMult = tier.incomeMult
  state.loungeClickMult = tier.clickMult
  state.loungeName = tier.name

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

  const starters = starterShelfTobaccos(resolveDifficulty(state), tier.id)
  state.ownedTobacco = {}
  state.shelfActive = []
  for (const id of starters) {
    state.ownedTobacco[id] = true
    state.shelfActive.push(id)
  }
  state.staffMembers = {}

  const starterNames = starters
    .map((id) => getTobacco(id)?.name)
    .filter(Boolean)
    .join(', ')
  const shelfLine =
    starters.length === 0
      ? 'Без табака на полке гости не приходят. Зайди в «Табак»: купи вкус и нажми «на полку».'
      : starters.length === 1
        ? `На полке уже «${starterNames}» — можно зарабатывать. В «Табак» добавь ещё вкусов.`
        : `На полке уже ${starters.length}: ${starterNames}. В «Табак» можно расширить меню.`

  state.flags.celebration = {
    kind: 'lounge',
    title: `«${tier.name}» открыт!`,
    subtitle: `${state.playerName || 'Ты'} — хозяин. ${shelfLine}`,
  }

  return {
    ok: true,
    message: `Открыт «${tier.name}»: доход ×${tier.incomeMult}, заказ ×${tier.clickMult}`,
  }
}

export function shopItemCost(state: GameState, baseCost: number): number {
  return scaledShiftShopCost(state, baseCost)
}

export function canQuitJob(state: GameState): boolean {
  return (
    state.phase === 'dual' && loungeIncomePerSec(state) >= quitIncomeThreshold(state)
  )
}

export function quitJob(state: GameState): ActionResult {
  if (state.phase !== 'dual') {
    return { ok: false, message: 'Ты уже не на смене' }
  }
  if (!canQuitJob(state)) {
    return {
      ok: false,
      message: `Нужен свой доход от ${quitIncomeThreshold(state)}/сек`,
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
    return { ok: false, message: 'Сначала открой свой лаунж' }
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

  syncProgressFlags(state)

  if (state.phase !== 'employed') {
    state.flags.tasksAfterLounge = (state.flags.tasksAfterLounge ?? 0) + 1
  }

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
    return { ok: false, message: 'Ты не в своём лаунже' }
  }
  if (state.shelfActive.length === 0) {
    return {
      ok: false,
      message: 'Полка пуста — выставь табак во вкладке «Табак», иначе нечего курить',
    }
  }
  state.cash += loungeClickPower(state)
  state.flags.loungeOrders += 1
  return { ok: true }
}

export function buyUpgrade(state: GameState, id: UpgradeId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой лаунж' }
  }
  const def = UPGRADES.find((u) => u.id === id)
  if (!def) return { ok: false, message: 'Нет такого' }
  if (!isUpgradeUnlocked(state, def)) {
    return { ok: false, message: 'Ещё рано' }
  }
  const level = state.owned[id]
  if (level >= def.maxLevel) {
    return { ok: false, message: `${def.name} — максимум (ур. ${def.maxLevel})` }
  }
  const cost = scaledUpgradeCost(state, upgradeCost(def, level))
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

/** Офлайн-пассива нет — только отметка возвращения в сессию */
export function syncSessionTime(state: GameState, now: number): void {
  state.lastActive = now
}

/** Чаевые за закрытое приложение, не за простой с открытым окном. */
export function grantWelcomeTips(state: GameState, awayMs: number, now = Date.now()): number {
  const rate =
    state.phase === 'employed' ? jobReputationPerSec(state) : loungeIncomePerSec(state)
  const amount = welcomeTipsAmount(awayMs, rate, state.phase === 'employed')
  if (amount > 0) state.cash += amount
  syncSessionTime(state, now)
  return amount
}

/** Чаевые по lastActive (холодный старт). Фон считает hiddenSince в main. */
export function applyOffline(state: GameState, now: number): number {
  return grantWelcomeTips(state, now - state.lastActive, now)
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
    return { ok: false, message: 'Сначала свой лаунж' }
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
  state.flags.tobaccoBought = true
  return {
    ok: true,
    message: `Заказано: ${def.name}. Поставь на полку во вкладке «Табак».`,
  }
}

export function putOnShelf(state: GameState, id: TobaccoId): ActionResult {
  if (state.phase === 'employed') {
    return { ok: false, message: 'Сначала свой лаунж' }
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
    return { ok: false, message: 'Сначала свой лаунж' }
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
    return 'Табачная полка пуста — столы стоят, но курить нечего. Гости не приходят и не платят.'
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
    return { ok: false, message: 'Сначала свой лаунж' }
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
  const cost = scaledExpansionCost(state, def.cost)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает' }
  }
  state.cash -= cost
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
  const cost = scaledBranchCost(state, def.cost)
  state.cash -= cost
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
  const cost = scaledStaffHireCost(state, grade.hireCost)
  state.cash -= cost
  state.staffMembers[id] = [1]
  state.flags.payrollWarned = false
  if (!state.flags.everHired) {
    state.flags.everHired = true
    state.flags.firstHireRole = id
  }
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
  const cost = scaledStaffHireCost(state, grade.hireCost)
  state.cash -= cost
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
  const cost = scaledStaffHireCost(state, extraStaffHireCost(id, 1))
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
  const share = staffPayrollShare(state)
  const heavy = net < 0 || share >= 0.4
  if (!heavy) {
    state.flags.payrollWarned = false
    return null
  }
  if (state.flags.payrollWarned) return null
  state.flags.payrollWarned = true
  if (net < 0) {
    return `ФОТ (${payroll.toFixed(1)}/с) съедает выручку — уволь кого-то во вкладке «Команда».`
  }
  return `ФОТ ${Math.round(share * 100)}% выручки — команда дорогая, подумай об оптимизации.`
}

/** Одноразовый тост при перегрузе сервиса */
export function maybeServiceFeedback(state: GameState): string | null {
  if (state.phase === 'employed') return null
  const svc = loungeService(state)
  if (svc.mood === 'ok') {
    state.flags.serviceWarned = false
    return null
  }
  state.flags.everServiceStrain = true
  if (state.flags.serviceWarned) return null
  state.flags.serviceWarned = true
  const cut = Math.round((1 - svc.incomeMult) * 100)
  return `${svc.label}: посадка ${svc.seatedRaw}, команда тянет ~${svc.capacity}. Чек −${cut}% · ${svc.hint}`
}

let lastServiceFloatAt = 0

/** Периодическая жалоба гостей для float на сцене */
export function maybeServiceComplaintFloat(
  state: GameState,
  now = Date.now(),
): string | null {
  if (state.phase === 'employed') return null
  if (state.scene !== 'lounge') return null
  const svc = loungeService(state)
  if (svc.mood === 'ok') return null
  const gap =
    svc.mood === 'chaos' ? 7_000 : svc.mood === 'poor' ? 9_000 : 12_000
  if (now - lastServiceFloatAt < gap) return null
  lastServiceFloatAt = now
  return pickServiceComplaint(svc.mood)
}
