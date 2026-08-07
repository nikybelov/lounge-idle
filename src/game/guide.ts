import { JOB_TASKS, isTaskUnlocked, QUIT_INCOME_THRESHOLD } from '../data/tasks'
import { minOpenLoungeCost, jobReputationPerSec } from './career'
import { formatMoney, loungeIncomePerSec } from './economy'
import type { GameState, GuideStep } from './state'

export type { GuideStep }

export type TabHintId = 'shop' | 'tobacco' | 'staff' | 'network' | 'personal' | 'career'

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

export function bootVenueCoach(
  playerName: string,
  venueId: string,
): CoachDef {
  return {
    step: 'pick_venue',
    stepNum: 1,
    icon: '🏪',
    kicker: 'Шаг 1 · выбор',
    title: `${playerName}, куда устроиться?`,
    body: 'Смена — стартовый капитал на свой лаунж. Сравни оплату, темп и цены шопа — сменить потом нельзя.',
    target: `[data-venue="${venueId}"]`,
    cta: 'Понятно',
  }
}

export function bootStartCoach(): CoachDef {
  return {
    step: 'pick_venue',
    stepNum: 1,
    icon: '🚀',
    kicker: 'Шаг 1 · старт',
    title: 'Погнали на смену',
    body: 'Жми «Начать смену» — дальше покажем, как копить и открыть свой зал.',
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

export function ackGuideCoach(state: GameState, dismissedStep?: GuideStep): void {
  if (dismissedStep === 'dual_tasks') {
    markCoalsDualHintSeen(state)
    return
  }
  const idx = guideStepIndex(state.flags.guideStep)
  if (idx > state.flags.guideAckedIndex) {
    state.flags.guideAckedIndex = idx
  }
}

/** Одноразовый coach, когда открывается «Поменяй угли» рядом с «Помой кальян» */
export function coalsDualTasksCoach(state: GameState): CoachDef | null {
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
    state.cash >= minOpenLoungeCost() * 0.45
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
  stepNum: number
  icon: string
  kicker: string
  title: string
  body: string
  target?: string
  cta: string
}

export function guideCoach(state: GameState): CoachDef | null {
  const dualTasks = coalsDualTasksCoach(state)
  if (dualTasks) return dualTasks

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
        title: 'Копим на свой зал',
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
        title: 'Репутация капает сама',
        body: rep > 0
          ? `Блок «Репутация» справа — +${rep < 1 ? rep.toFixed(2) : formatMoney(rep)}/с без кликов.`
          : 'Ещё пара задач — и справа появится пассив «Репутация».',
        target: rep > 0 ? '[data-reputation-wrap]' : '[data-task="wash"]',
        cta: 'Круто',
      }
    case 'halfway':
      return {
        step,
        stepNum,
        icon: '🎯',
        kicker: `Шаг ${stepNum} · полпути`,
        title: 'Уже близко к своему залу',
        body: `Накоплено ${formatMoney(state.cash)} из ${formatMoney(minOpenLoungeCost())}. Не останавливайся — скоро откроешь двери.`,
        target: '[data-goal]',
        cta: 'Дальше',
      }
    case 'lounge_ready':
      return {
        step,
        stepNum,
        icon: '🚪',
        kicker: `Шаг ${stepNum} · главная цель`,
        title: 'Пора открывать свой зал',
        body: 'Вкладка «Свой зал» или кнопка ниже — выбери тариф и нажми на вау-момент.',
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
        body: 'Жми «Принять заказ». Кнопка всегда внизу, даже если ты в другой вкладке.',
        target: '[data-cta], [data-fab-order]',
        cta: 'Принимаю',
      }
    default:
      return null
  }
}

export function goalLine(state: GameState): string {
  if (isGuideDone(state)) {
    if (state.phase === 'employed') {
      return `Цель: ${formatMoney(minOpenLoungeCost())} на свой зал`
    }
    if (state.phase === 'dual') {
      const inc = loungeIncomePerSec(state)
      if (inc >= QUIT_INCOME_THRESHOLD) {
        return 'Цель: зал на 6/с — можно уволиться или остаться трудягой'
      }
      return `Цель: прокачай зал до 6/с (сейчас ${formatMoney(inc)}/с)`
    }
    return 'Цель: полка, команда, сеть — расти дальше'
  }
  switch (state.flags.guideStep) {
    case 'pick_venue':
      return 'Цель: выбрать заведение и начать смену'
    case 'welcome':
    case 'first_task':
      return 'Цель: копить на свой лаунж'
    case 'reputation':
      return 'Цель: репутация + задачи → свой зал'
    case 'halfway':
      return `Цель: ${formatMoney(minOpenLoungeCost())} · уже близко`
    case 'lounge_ready':
      return 'Цель: открыть свой зал — вкладка «Свой зал»'
    case 'first_order':
      return `Цель: ${3 - state.flags.loungeOrders} заказов в своём зале`
    default:
      return ''
  }
}

const TAB_HINTS: Record<
  TabHintId,
  { icon: string; title: string; body: string; cta: string }
> = {
  shop: {
    icon: '🧰',
    title: 'Инструменты смены',
    body: 'Покупай и улучшай — до 4 уровней, задачи быстрее и платят больше. Шуруповёрт для мойки необязателен: 35 моек без него — трофей «Голыми руками» в «Трофеях». Тариф зала с ёршиком в комплекте это закрывает.',
    cta: 'Понятно',
  },
  tobacco: {
    icon: '📦',
    title: 'Табачная полка',
    body: 'Купи вкус на склад → выставь на полку. Богатый выбор = больше чаевых.',
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

/** Одноразовая подсказка после открытия своего зала */
export function consumePersonalIntroHint(state: GameState): TabHintDef | null {
  if (!state.flags.personalIntroPending) return null
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

/** Подсказка при первом заходе в «Инструменты» на смене */
export function storySubHintMessage(
  state: GameState,
  sub: 'tasks' | 'shop',
): TabHintDef | null {
  if (sub !== 'shop' || state.flags.tabHints.shop) return null
  if (state.phase !== 'employed' && state.phase !== 'dual') return null
  return { id: 'shop', ...TAB_HINTS.shop }
}

export function markTabHintSeen(state: GameState, id: TabHintId): void {
  state.flags.tabHints[id] = true
}
