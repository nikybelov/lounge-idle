import { JOB_TASKS, isTaskUnlocked } from '../data/tasks'
import { DIFFICULTIES } from '../data/difficulty'
import { getVenue, type VenueId } from '../data/venues'
import { rankDef } from '../data/ranks'
import { PROMOTIONS } from '../data/promotions'
import { STAFF_ROLES } from '../data/staff'
import {
  minOpenLoungeCost,
  jobReputationPerSec,
  quitIncomeThreshold,
  canQuitJob,
} from './career'
import { formatMoney, loungeIncomePerSec, staffPayrollPerSec, staffPayrollShare } from './economy'
import { pluralRuCount } from './ru'
import { shelfMood } from './appeal'
import { canBrowseEmpire } from './empire'
import {
  isPromotionSlotUnlocked,
  promotionGrade,
} from './promotions'
import { hireStaffCheck, staffHeadcount } from './staff'
import { isWeekend } from './workDays'
import { isCoachEnabled } from '../save/settings'
import { isCelebrationVisible } from '../ui/juice'
import type { GameState, GuideStep, Scene } from './state'

export type { GuideStep }

export type TabHintId = 'shop' | 'tobacco' | 'staff' | 'network' | 'personal' | 'career'

export type CoachMenuTab =
  | 'story'
  | 'own'
  | 'tobacco'
  | 'staff'
  | 'personal'
  | 'network'
  | 'career'

export type CoachStorySubTab = 'tasks' | 'shop'

export interface CoachContext {
  menuTab: CoachMenuTab
  storySubTab: CoachStorySubTab
  scene: Scene
}

export type MilestoneHintId =
  | 'guide_done'
  | 'dual_phase'
  | 'quit_ready'
  | 'shelf_empty'
  | 'shelf_sparse'
  | 'payroll_heavy'
  | 'broke_dual'
  | 'network_unlock'
  | 'first_promo'
  | 'first_hire'
  | 'rank_up'
  | 'idle_nudge'
  | 'weekdays'

let lastPlayerInteractionAt = Date.now()
const IDLE_NUDGE_MS = 120_000
/** Без тапа/покупки — пауза смены и окно Огонька. */
export const SHIFT_IDLE_MS = 10 * 60 * 1000

export function touchOgonokInteraction(): void {
  lastPlayerInteractionAt = Date.now()
}

export function isShiftIdleDue(): boolean {
  return Date.now() - lastPlayerInteractionAt >= SHIFT_IDLE_MS
}

/** Фон не считается простоем за стойкой — иначе окно всплывёт сразу после возврата. */
export function creditHiddenIdleTime(ms: number): void {
  if (ms <= 0) return
  lastPlayerInteractionAt += ms
}

const STEP_ORDER: GuideStep[] = [
  'pick_venue',
  'welcome',
  'first_task',
  'reputation',
  'halfway',
  'lounge_ready',
  'first_order',
  'done',
]

export const GUIDE_STEPS_TOTAL = STEP_ORDER.length - 1

export function applyBootGuideToState(state: GameState, venueGuideDone: boolean): void {
  if (venueGuideDone) {
    state.flags.guideAckedIndex = guideStepIndex('pick_venue')
    state.flags.guideStep = 'welcome'
  } else {
    state.flags.guideStep = 'welcome'
    state.flags.guideAckedIndex = -1
  }
}

export function bootDifficultyCoach(playerName: string): CoachDef {
  return {
    step: 'pick_venue',
    stepNum: 1,
    icon: '🔥',
    kicker: 'Огонёк · старт',
    title: `${playerName}, выбери сложность`,
    body: 'Каждое заведение — свой уровень: лёгкий, средний или сложный. От него зависят оплата на смене, цены лаунжа и сети. На весь прогон — потом изменить нельзя.',
    target: '[data-list]',
    cta: 'Понятно, выбираю',
  }
}

export function bootVenueCoach(
  playerName: string,
  venueId: VenueId,
): CoachDef {
  const venue = getVenue(venueId)
  const diff = DIFFICULTIES[venue.difficulty]
  return {
    step: 'pick_venue',
    stepNum: 1,
    icon: '🏪',
    kicker: 'Огонёк · режим',
    title: `${playerName}, «${diff.label}» — ${venue.name}`,
    body: `${venue.blurb} Смотри бейдж и цифры на карточке — так и будет на всём прогоне.`,
    target: `[data-venue="${venueId}"]`,
    cta: 'Подходит',
  }
}

export function bootStartCoach(): CoachDef {
  return {
    step: 'pick_venue',
    stepNum: 1,
    icon: '🚀',
    kicker: 'Огонёк · финиш',
    title: 'Погнали на смену',
    body: 'Жми «Начать смену» — дальше покажем, как копить и открыть свой лаунж.',
    target: '[data-start]',
    cta: 'Понятно, начинаю',
  }
}

export function guideStepIndex(step: GuideStep): number {
  return STEP_ORDER.indexOf(step)
}

export function isGuideDone(state: GameState): boolean {
  return state.flags.guideStep === 'done'
}

export function shouldShowCoach(state: GameState): boolean {
  if (isGuideDone(state)) return false
  return (
    guideStepIndex(state.flags.guideStep) > state.flags.guideAckedIndex
  )
}

export function markCoalsDualHintSeen(state: GameState): void {
  state.flags.coalsDualHintSeen = true
}

export function markMilestoneHintSeen(
  state: GameState,
  id: MilestoneHintId,
): void {
  state.flags.milestoneHints[id] = true
  switch (id) {
    case 'quit_ready':
      state.flags.sawQuitReady = true
      break
    case 'broke_dual':
      state.flags.sawBrokeHint = true
      break
    case 'shelf_empty':
      state.flags.shelfEmptyWarned = true
      state.flags.shelfSparseWarned = true
      break
    case 'shelf_sparse':
      state.flags.shelfSparseWarned = true
      break
    case 'payroll_heavy':
      state.flags.payrollWarned = true
      break
    default:
      break
  }
}

export function ackGuideCoach(state: GameState, dismissedKey?: string): void {
  if (dismissedKey === 'dual_tasks') {
    markCoalsDualHintSeen(state)
    return
  }
  if (dismissedKey?.startsWith('milestone-')) {
    const id = dismissedKey.slice('milestone-'.length) as MilestoneHintId
    markMilestoneHintSeen(state, id)
    return
  }
  const idx = guideStepIndex(state.flags.guideStep)
  if (idx > state.flags.guideAckedIndex) {
    state.flags.guideAckedIndex = idx
  }
}

/** Одноразовый coach, когда открывается «Поменяй угли» рядом с «Помой кальян» */
export function coalsDualTasksCoach(state: GameState): CoachDef | null {
  if (!isCoachEnabled()) return null
  if (state.flags.coalsDualHintSeen) return null
  if (state.phase === 'ownOnly') return null
  if (state.phase === 'employed' && state.scene !== 'job') return null
  if (state.phase === 'dual' && state.scene !== 'job' && state.scene !== 'lounge') {
    return null
  }
  const coals = JOB_TASKS.find((t) => t.id === 'coals')
  if (!coals || !isTaskUnlocked(coals, state.taskDone)) return null

  return {
    step: 'dual_tasks',
    stepNum: 0,
    icon: '♨️',
    kicker: 'Новая задача',
    title: 'Две кнопки — обе в дело',
    body: 'Жми «Помой кальян» и «Поменяй угли» по очереди: пока одна на перезарядке, кликай другую — так касса растёт быстрее.',
    target: '[data-job-tasks]',
    cta: 'Понятно, чередую',
  }
}

export function advanceGuide(state: GameState, to: GuideStep): void {
  if (isGuideDone(state)) return
  const cur = guideStepIndex(state.flags.guideStep)
  const next = guideStepIndex(to)
  if (next > cur) state.flags.guideStep = to
}

/** Только продвигает шаги — без toast-текста */
export function syncGuideProgress(state: GameState): void {
  if (isGuideDone(state)) return
  const totalTasks =
    state.taskDone.wash + state.taskDone.coals + state.taskDone.order

  if (state.flags.guideStep === 'welcome' && totalTasks >= 1) {
    advanceGuide(state, 'first_task')
  }
  if (!state.flags.coalsDualHintSeen) {
    const coals = JOB_TASKS.find((t) => t.id === 'coals')
    if (
      coals &&
      isTaskUnlocked(coals, state.taskDone) &&
      state.taskDone.coals >= 1
    ) {
      markCoalsDualHintSeen(state)
    }
  }
  if (
    (state.flags.guideStep === 'welcome' ||
      state.flags.guideStep === 'first_task') &&
    totalTasks >= 3
  ) {
    advanceGuide(state, 'reputation')
  }
  if (
    state.phase === 'employed' &&
    (state.flags.guideStep === 'reputation' ||
      state.flags.guideStep === 'first_task') &&
    state.cash >= minOpenLoungeCost(state) * 0.45
  ) {
    advanceGuide(state, 'halfway')
  }
  if (
    state.phase === 'employed' &&
    state.flags.loungeOfferUnlocked &&
    state.flags.guideStep !== 'lounge_ready' &&
    state.flags.guideStep !== 'first_order' &&
    state.flags.guideStep !== 'done'
  ) {
    advanceGuide(state, 'lounge_ready')
  }
  if (
    state.phase !== 'employed' &&
    state.flags.guideStep !== 'first_order' &&
    state.flags.guideStep !== 'done'
  ) {
    advanceGuide(state, 'first_order')
  }
  if (
    state.flags.guideStep === 'first_order' &&
    state.flags.loungeOrders >= 3
  ) {
    advanceGuide(state, 'done')
    state.flags.guideAckedIndex = GUIDE_STEPS_TOTAL
  }
}

export interface CoachDef {
  step: GuideStep
  /** Ключ overlay — по умолчанию step */
  coachKey?: string
  stepNum: number
  icon: string
  kicker: string
  title: string
  body: string
  target?: string
  cta: string
}

function milestoneCoachDef(
  id: MilestoneHintId,
  def: Omit<CoachDef, 'step' | 'coachKey'>,
): CoachDef {
  return {
    step: 'done',
    coachKey: `milestone-${id}`,
    ...def,
  }
}

function payrollHeavy(state: GameState): boolean {
  if (state.phase === 'employed') return false
  const payroll = staffPayrollPerSec(state)
  if (payroll <= 0) return false
  const net = loungeIncomePerSec(state)
  const share = staffPayrollShare(state)
  return net < 0 || share >= 0.4
}

function totalStaffHeadcount(state: GameState): number {
  let count = 0
  for (const role of STAFF_ROLES) {
    count += staffHeadcount(state, role.id)
  }
  return count
}

function firstUnlockedPromotion(state: GameState) {
  for (const def of PROMOTIONS) {
    if (isPromotionSlotUnlocked(state, def.id)) return def
  }
  return null
}

function idleTabNudge(
  state: GameState,
  ctx: CoachContext,
): Omit<CoachDef, 'step' | 'coachKey' | 'stepNum'> | null {
  if (state.phase === 'employed' && ctx.menuTab !== 'story') {
    return {
      icon: '🔥',
      kicker: 'Огонёк · куда',
      title: 'Смена ждёт',
      body: 'Пока работаешь на чужой точке — вкладка «Сюжет» и задачи смены.',
      target: '[data-menu-tab="story"]',
      cta: 'К сюжету',
    }
  }
  if (
    state.phase === 'dual' &&
    ctx.menuTab === 'story' &&
    ctx.scene === 'job' &&
    canQuitJob(state)
  ) {
    return {
      icon: '🚪',
      kicker: 'Огонёк · куда',
      title: 'Зал уже тянет',
      body: 'Переключись на «Мой лаунж» — там заказы и прокачка. Или увольняйся, когда созреешь.',
      target: '[data-go="lounge"]',
      cta: 'В лаунж',
    }
  }
  if (
    state.phase !== 'employed' &&
    shelfMood(state) === 'empty' &&
    ctx.menuTab !== 'tobacco'
  ) {
    return {
      icon: '📦',
      kicker: 'Огонёк · куда',
      title: 'Полка пустует',
      body: 'Гости без вкусов не платят — загляни во вкладку «Табак» или закажи в «Магазине».',
      target: '[data-menu-tab="tobacco"]',
      cta: 'К табаку',
    }
  }
  if (payrollHeavy(state) && ctx.menuTab !== 'staff') {
    return {
      icon: '👥',
      kicker: 'Огонёк · куда',
      title: 'ФОТ давит',
      body: 'Зарплаты съедают выручку — проверь состав во вкладке «Команда».',
      target: '[data-menu-tab="staff"]',
      cta: 'К команде',
    }
  }
  return null
}

/** Coach после праздника повышения */
export function rankUpCoach(state: GameState): CoachDef | null {
  if (state.flags.milestoneHints.rank_up) return null
  return milestoneCoachDef('rank_up', {
    stepNum: 0,
    icon: '↑',
    kicker: 'Огонёк · карьера',
    title: `Ранг «${rankDef(state.jobRank).title}»`,
    body: 'Загляни во вкладку «Карьера»: сводка, трофеи и сравнение с друзьями. Каждое повышение бустит оплату на смене.',
    target: '[data-menu-tab="career"]',
    cta: 'К карьере',
  })
}

/** Одноразовые подсказки Огонька после основного гайда */
export function milestoneCoach(
  state: GameState,
  ctx?: CoachContext,
): CoachDef | null {
  if (!isCoachEnabled() || !isGuideDone(state)) return null
  if (isCelebrationVisible()) return null

  const m = state.flags.milestoneHints

  if (!m.guide_done) {
    return milestoneCoachDef('guide_done', {
      stepNum: 0,
      icon: '🔥',
      kicker: 'Огонёк · рядом',
      title: 'Я никуда не делся',
      body: 'Вкладки сверху откроются по мере роста. Буду подсвечивать важное — табак, команда, личный бренд, сеть.',
      target: '.menu-shell',
      cta: 'Понятно, Огонёк',
    })
  }

  if (state.phase === 'dual' && !m.dual_phase) {
    return milestoneCoachDef('dual_phase', {
      stepNum: 0,
      icon: '🔀',
      kicker: 'Огонёк · два режима',
      title: 'Смена и свой лаунж',
      body: '«Смена» — подработка и карьера. «Мой лаунж» — заказы и прокачка. Переключайся здесь, когда нужно.',
      target: '[data-go="job"], [data-go="lounge"]',
      cta: 'Ясно',
    })
  }

  const promo = firstUnlockedPromotion(state)
  if (
    promo &&
    promotionGrade(state, promo.id) === 0 &&
    !m.first_promo
  ) {
    return milestoneCoachDef('first_promo', {
      stepNum: 0,
      icon: '📣',
      kicker: 'Огонёк · маркетинг',
      title: 'Акции разблокированы',
      body: `«${promo.name}» доступна — прокачай грейд и запускай всплеск гостей. Блок «Акции» в обзоре лаунжа.`,
      target: '[data-promotions]',
      cta: 'К акциям',
    })
  }

  if (!m.weekdays && state.career.workDays >= 4) {
    const ownLounge = state.phase !== 'employed'
    return milestoneCoachDef('weekdays', {
      stepNum: 0,
      icon: '📅',
      kicker: 'Огонёк · неделя',
      title: isWeekend(state) ? 'Выходные — люднее' : 'Дни тоже работают',
      body: ownLounge
        ? 'Пн–чт зал обычный, пт и сб приходят больше гостей. Акции в выходные жирнее: народ и так есть.'
        : 'В шапке крутится неделя. Пт и Сб в зале будет людно — когда откроешь лаунж, акции лучше жать в эти дни.',
      target: '[data-workday-wrap]',
      cta: 'Понял',
    })
  }

  if (
    state.phase !== 'employed' &&
    totalStaffHeadcount(state) === 0 &&
    hireStaffCheck(state, 'host').ok &&
    !m.first_hire
  ) {
    return milestoneCoachDef('first_hire', {
      stepNum: 0,
      icon: '👋',
      kicker: 'Огонёк · команда',
      title: 'Пора нанять хостес',
      body: 'Первый сотрудник поднимает поток гостей. Хватило на «Хостес» — жми во вкладке «Команда».',
      target: '[data-hire-staff="host"], [data-menu-tab="staff"]',
      cta: 'К команде',
    })
  }

  if (state.phase === 'dual' && canQuitJob(state) && !m.quit_ready) {
    return milestoneCoachDef('quit_ready', {
      stepNum: 0,
      icon: '🚪',
      kicker: 'Огонёк · карьера',
      title: 'Можно уволиться',
      body: `Свой лаунж уже даёт ${quitIncomeThreshold(state)}/с — порог пройден (сейчас ${formatMoney(loungeIncomePerSec(state))}/с). Увольнение откроет вкладку «Сеть».`,
      target: '[data-quit]',
      cta: 'Посмотрю',
    })
  }

  if (
    state.phase !== 'employed' &&
    shelfMood(state) === 'empty' &&
    !m.shelf_empty
  ) {
    return milestoneCoachDef('shelf_empty', {
      stepNum: 0,
      icon: '📦',
      kicker: 'Огонёк · полка',
      title: 'Полка пуста',
      body: 'Столы без вкуса не кормят — гости не приходят. Закажи табак в «Магазине» (Сюжет), потом выставь на полку во вкладке «Табак».',
      target: '[data-menu-tab="tobacco"]',
      cta: 'К полке',
    })
  }

  if (
    state.phase !== 'employed' &&
    shelfMood(state) === 'sparse' &&
    !m.shelf_sparse
  ) {
    return milestoneCoachDef('shelf_sparse', {
      stepNum: 0,
      icon: '🌿',
      kicker: 'Огонёк · полка',
      title: 'Мало вкусов',
      body: 'Пара позиций на полке — гости уходят раньше. Добавь вкусов на склад и выставь их.',
      target: '[data-menu-tab="tobacco"]',
      cta: 'Понятно',
    })
  }

  if (payrollHeavy(state) && !m.payroll_heavy) {
    const payroll = staffPayrollPerSec(state)
    const net = loungeIncomePerSec(state)
    const body =
      net < 0
        ? `ФОТ ${payroll < 10 ? payroll.toFixed(1) : formatMoney(payroll)}/с съедает выручку. Загляни во вкладку «Команда» — может, кого-то убрать.`
        : `ФОТ уже ${Math.round(staffPayrollShare(state) * 100)}% выручки — команда дорогая. «Команда» → проверь состав.`
    return milestoneCoachDef('payroll_heavy', {
      stepNum: 0,
      icon: '👥',
      kicker: 'Огонёк · ФОТ',
      title: 'Зарплаты давят',
      body,
      target: '[data-menu-tab="staff"]',
      cta: 'К команде',
    })
  }

  if (
    state.phase === 'dual' &&
    state.cash <= 120 &&
    !m.broke_dual
  ) {
    return milestoneCoachDef('broke_dual', {
      stepNum: 0,
      icon: '💸',
      kicker: 'Огонёк · касса',
      title: 'Касса пустеет',
      body: 'На старой смене тебя не уволят — можно подработать в режиме «Смена» и поднять выручку.',
      target: '[data-go="job"]',
      cta: 'На смену',
    })
  }

  if (
    canBrowseEmpire(state) &&
    state.flags.empireOfferUnlocked &&
    !m.network_unlock
  ) {
    return milestoneCoachDef('network_unlock', {
      stepNum: 0,
      icon: '🗺️',
      kicker: 'Огонёк · сеть',
      title: 'Сеть открыта',
      body: 'После увольнения или параллельно — вкладка «Сеть»: второй лаунж усилит всю империю.',
      target: '[data-menu-tab="network"]',
      cta: 'Посмотрю',
    })
  }

  if (
    ctx &&
    !m.idle_nudge &&
    Date.now() - lastPlayerInteractionAt >= IDLE_NUDGE_MS
  ) {
    const nudge = idleTabNudge(state, ctx)
    if (nudge) {
      return milestoneCoachDef('idle_nudge', { stepNum: 0, ...nudge })
    }
  }

  return null
}

/** Контекстная подсказка по тапу на чип Огонька */
export function contextualOgonokTip(
  state: GameState,
  ctx: CoachContext,
): CoachDef | null {
  if (!isCoachEnabled() || !isGuideDone(state)) return null

  const pending = milestoneCoach(state, ctx)
  if (pending) return pending

  const idle = idleTabNudge(state, ctx)
  if (idle) {
    return {
      step: 'done',
      coachKey: 'context-tip',
      stepNum: 0,
      ...idle,
    }
  }

  if (state.phase === 'employed') {
    return {
      step: 'done',
      coachKey: 'context-tip',
      stepNum: 0,
      icon: '🎯',
      kicker: 'Огонёк · цель',
      title: 'Сейчас главное',
      body: goalLine(state) || 'Копи на свой лаунж — задачи смены и пассив.',
      target: '[data-goal], [data-job-tasks]',
      cta: 'Понятно',
    }
  }

  if (state.scene === 'lounge' && ctx.menuTab === 'story') {
    return {
      step: 'done',
      coachKey: 'context-tip',
      stepNum: 0,
      icon: '🌬️',
      kicker: 'Огонёк · лаунж',
      title: 'Сейчас главное',
      body: goalLine(state) || 'Принимай заказы на сцене и качай лаунж в списке ниже.',
      target: '[data-cta], [data-menu-tab="story"]',
      cta: 'Ясно',
    }
  }

  return {
    step: 'done',
    coachKey: 'context-tip',
    stepNum: 0,
    icon: '🔥',
    kicker: 'Огонёк · подсказка',
    title: 'Сейчас главное',
    body: goalLine(state) || 'Качай лаунж, команду и личный бренд — я подсвечу важное.',
    target: '[data-goal]',
    cta: 'Понятно',
  }
}

export function ogonyokChipVisible(state: GameState): boolean {
  return isCoachEnabled() && isGuideDone(state)
}

export function ogonyokChipPulse(
  state: GameState,
  ctx?: CoachContext,
): boolean {
  if (!ogonyokChipVisible(state)) return false
  return milestoneCoach(state, ctx) !== null
}

/** Пульс вкладки, пока ждёт milestone-подсказку */
export function milestoneTabPing(
  state: GameState,
  ctx?: CoachContext,
): string | null {
  const coach = milestoneCoach(state, ctx)
  if (!coach?.target) return null
  if (coach.target.includes('tobacco')) return 'tobacco'
  if (coach.target.includes('staff') || coach.target.includes('hire-staff')) {
    return 'staff'
  }
  if (coach.target.includes('network')) return 'network'
  if (coach.target.includes('career')) return 'career'
  if (coach.target.includes('data-promotions')) return 'story'
  return null
}

function mainGuideCoach(state: GameState): CoachDef | null {
  if (!shouldShowCoach(state)) return null

  const step = state.flags.guideStep
  const stepNum = guideStepIndex(step) + 1
  const rep = jobReputationPerSec(state)

  switch (step) {
    case 'welcome':
      return {
        step,
        stepNum,
        icon: '🔥',
        kicker: `Шаг ${stepNum} · смена`,
        title: 'Добро пожаловать на смену',
        body: 'Жми «Помой кальян» — каждая задача копит на твой будущий лаунж.',
        target: '[data-task="wash"]',
        cta: 'Понятно, мою',
      }
    case 'first_task':
      return {
        step,
        stepNum,
        icon: '💰',
        kicker: `Шаг ${stepNum} · копим`,
        title: 'Копим на свой лаунж',
        body: 'Жми задачи смены — касса растёт. Смотри оранжевую полоску «Цель» под шапкой.',
        target: '[data-goal]',
        cta: 'Ясно',
      }
    case 'reputation':
      return {
        step,
        stepNum,
        icon: '✨',
        kicker: `Шаг ${stepNum} · первый idle`,
        title: 'Пассив капает сам',
        body: rep > 0
          ? `Блок «Пассив» справа — +${rep < 1 ? rep.toFixed(2) : formatMoney(rep)}/с в кассу без кликов.`
          : 'Ещё пара задач — и справа появится пассив на смене.',
        target: rep > 0 ? '[data-reputation-wrap]' : '[data-task="wash"]',
        cta: 'Круто',
      }
    case 'halfway':
      return {
        step,
        stepNum,
        icon: '🎯',
        kicker: `Шаг ${stepNum} · полпути`,
        title: 'Уже близко к своему лаунжу',
        body: `Накоплено ${formatMoney(state.cash)} из ${formatMoney(minOpenLoungeCost(state))}. Не останавливайся — скоро откроешь двери.`,
        target: '[data-goal]',
        cta: 'Дальше',
      }
    case 'lounge_ready':
      return {
        step,
        stepNum,
        icon: '🚪',
        kicker: `Шаг ${stepNum} · главная цель`,
        title: 'Пора открывать свой лаунж',
        body: 'Откроется вкладка «Свой лаунж» — выбери тариф (Первая тяга / Сладкий пар / Дымный мир) и подтверди.',
        target: '[data-menu-tab="own"], [data-open]',
        cta: 'Открываю!',
      }
    case 'first_order':
      return {
        step,
        stepNum,
        icon: '🌬️',
        kicker: `Шаг ${stepNum} · твой лаунж`,
        title: 'Зал ожил — принимай гостей',
        body: 'Жми «Принять заказ» на сцене лаунжа — во вкладке «Сюжет».',
        target: '[data-cta]',
        cta: 'Принимаю',
      }
    default:
      return null
  }
}

export function guideCoach(
  state: GameState,
  ctx?: CoachContext,
): CoachDef | null {
  if (!isCoachEnabled()) return null
  const dualTasks = coalsDualTasksCoach(state)
  if (dualTasks) return dualTasks

  const main = mainGuideCoach(state)
  if (main) return main

  return milestoneCoach(state, ctx)
}

export function goalLine(state: GameState): string {
  if (isGuideDone(state)) {
    if (state.phase === 'employed') {
      return `Цель: ${formatMoney(minOpenLoungeCost(state))} на свой лаунж`
    }
    if (state.phase === 'dual') {
      const inc = loungeIncomePerSec(state)
      const quitNeed = quitIncomeThreshold(state)
      if (inc >= quitNeed) {
        return `Цель: ${quitNeed}/с — можно уволиться или остаться трудягой`
      }
      return `Цель: прокачай лаунж до ${quitNeed}/с (сейчас ${formatMoney(inc)}/с)`
    }
    return 'Цель: полка, команда, сеть — расти дальше'
  }
  switch (state.flags.guideStep) {
    case 'pick_venue':
      return 'Цель: выбрать сложность и заведение'
    case 'welcome':
    case 'first_task':
      return 'Цель: копить на свой лаунж'
    case 'reputation':
      return 'Цель: пассив + задачи → свой лаунж'
    case 'halfway':
      return `Цель: ${formatMoney(minOpenLoungeCost(state))} · уже близко`
    case 'lounge_ready':
      return 'Цель: открыть свой лаунж — вкладка «Свой лаунж»'
    case 'first_order':
      return `Цель: ${pluralRuCount(3 - state.flags.loungeOrders, 'заказ', 'заказа', 'заказов')} в своём лаунже`
    default:
      return ''
  }
}

const TAB_HINTS: Record<
  TabHintId,
  { icon: string; title: string; body: string; cta: string }
> = {
  shop: {
    icon: '🛒',
    title: 'Магазин',
    body: 'Инструменты ускоряют мойку, угли и заказ. В своём зале ещё блок «Для зала»: жар → печка, мойка, форма, стойка мастера — удобнее смена и мягче штрафы, не второй VIP. Табак: купи → выставь во вкладке «Табак».',
    cta: 'Понятно',
  },
  tobacco: {
    icon: '📦',
    title: 'Табачная полка',
    body: 'Здесь склад и полка. Закупка — в «Магазине» (Сюжет). Без вкуса на полке гости не приходят и пассив = 0.',
    cta: 'Ясно',
  },
  staff: {
    icon: '👥',
    title: 'Команда',
    body: 'Пять ролей — хостес, официант, кальянщик, бармен, управляющий. У каждого человека свой грейд: новый нанимается с 1-го, повышение — только для него.',
    cta: 'Ок',
  },
  network: {
    icon: '🗺️',
    title: 'Сеть лаунжей',
    body: 'После увольнения со смены — открывай филиалы. Каждый усиливает всю сеть, с любого стартового тарифа.',
    cta: 'Понятно',
  },
  personal: {
    icon: '✨',
    title: 'Развивай себя как профи',
    body: 'Стань блогером, прокачай оборудование канала и снимай ролики. Мероприятия и «Гайд Мастерс» усиливают узнаваемость и поток гостей.',
    cta: 'Посмотрю',
  },
  career: {
    icon: '📊',
    title: 'Карьера',
    body: 'Сводка — рабочие дни, очки и сравнение с друзьями. Трофеи — разовые награды. На очки влияют трофеи и прогресс, не количество дней.',
    cta: 'Понятно',
  },
}

export interface TabHintDef {
  id: TabHintId
  icon: string
  title: string
  body: string
  cta: string
  target?: string
}

export function personalTabHintDef(): TabHintDef {
  return {
    id: 'personal',
    target: '[data-menu-tab="personal"]',
    ...TAB_HINTS.personal,
  }
}

/** Сразу после открытия лаунжа — обязательный намёк на «Табак» */
export function consumeTobaccoSetupHint(state: GameState): TabHintDef | null {
  if (!state.flags.tobaccoSetupPending) return null
  state.flags.tobaccoSetupPending = false
  if (state.phase === 'employed') return null

  const empty = state.shelfActive.length === 0
  const n = state.shelfActive.length
  return {
    id: 'tobacco',
    target: '[data-menu-tab="tobacco"]',
    icon: '📦',
    title: empty ? 'Сначала табак на полку' : 'Загляни в «Табак»',
    body: empty
      ? 'Столы без вкуса не кормят: пассив = 0, заказы не принимаются. Зайди в «Табак», купи вкус и нажми «на полку» — иначе гости не придут.'
      : `Стартовые вкусы уже на полке (${n}) — можно зарабатывать. В «Табак» закажи ещё и расширь меню, иначе рост упрётся в пустую полку.`,
    cta: 'К табаку',
  }
}

/** Одноразовая подсказка после открытия своего зала */
export function consumePersonalIntroHint(state: GameState): TabHintDef | null {
  if (!state.flags.personalIntroPending) return null
  // Сначала табак — личное развитие потом
  if (state.flags.tobaccoSetupPending) return null
  state.flags.personalIntroPending = false
  if (state.phase === 'employed' || state.flags.tabHints.personal) return null
  return personalTabHintDef()
}

export function tabHintMessage(
  state: GameState,
  tab: string,
): TabHintDef | null {
  if (
    tab === 'tobacco' &&
    state.phase !== 'employed' &&
    !state.flags.tabHints.tobacco
  ) {
    return { id: 'tobacco', ...TAB_HINTS.tobacco }
  }
  if (
    tab === 'staff' &&
    state.phase !== 'employed' &&
    !state.flags.tabHints.staff
  ) {
    return { id: 'staff', ...TAB_HINTS.staff }
  }
  if (
    tab === 'network' &&
    state.phase !== 'employed' &&
    !state.flags.tabHints.network
  ) {
    return { id: 'network', ...TAB_HINTS.network }
  }
  if (
    tab === 'personal' &&
    state.phase !== 'employed' &&
    !state.flags.tabHints.personal
  ) {
    return personalTabHintDef()
  }
  if (tab === 'career' && !state.flags.tabHints.career) {
    return { id: 'career', target: '[data-menu-tab="career"]', ...TAB_HINTS.career }
  }
  return null
}

/** Подсказка при первом заходе в «Магазин» */
export function storySubHintMessage(
  state: GameState,
  sub: 'tasks' | 'shop',
): TabHintDef | null {
  if (sub !== 'shop' || state.flags.tabHints.shop) return null
  if (state.phase === 'employed' || state.phase === 'dual' || state.phase === 'ownOnly') {
    return { id: 'shop', ...TAB_HINTS.shop }
  }
  return null
}

export function markTabHintSeen(state: GameState, id: TabHintId): void {
  state.flags.tabHints[id] = true
}
