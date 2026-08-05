export type TaskId = 'wash' | 'coals' | 'order'

export interface JobTask {
  id: TaskId
  label: string
  hint: string
  pay: number
  cooldownMs: number
  /** Сколько раз сделать предыдущую задачу, чтобы открыть эту */
  unlockAfter?: { task: TaskId; count: number }
}

export const EMPLOYER_NAME = 'Дым у реки'

export const JOB_TASKS: JobTask[] = [
  {
    id: 'wash',
    label: 'Помой кальян',
    hint: 'С этого начинается смена',
    pay: 3,
    cooldownMs: 1500,
  },
  {
    id: 'coals',
    label: 'Поменяй угли',
    hint: 'Жар без суеты',
    pay: 5,
    cooldownMs: 1900,
    unlockAfter: { task: 'wash', count: 15 },
  },
  {
    id: 'order',
    label: 'Отнеси заказ',
    hint: 'Стол ждёт',
    pay: 7,
    cooldownMs: 2300,
    unlockAfter: { task: 'coals', count: 15 },
  },
]

/**
 * Минимальная планка «накопил на угол» (самый дешёвый тариф зала).
 * Реальная цена зависит от выбранного тарифа при открытии.
 */
export const OPEN_LOUNGE_COST = 9000

/** Свой /sec должен быть не ниже этого, чтобы уволиться */
export const QUIT_INCOME_THRESHOLD = 6

/** Ниже этого cash — мягкий сигнал вернуться на смену */
export const BROKE_THRESHOLD = 12

export function isTaskUnlocked(
  task: JobTask,
  taskDone: Record<TaskId, number>,
): boolean {
  if (!task.unlockAfter) return true
  return taskDone[task.unlockAfter.task] >= task.unlockAfter.count
}

export function taskUnlockHint(
  task: JobTask,
  taskDone: Record<TaskId, number>,
): string | null {
  if (!task.unlockAfter || isTaskUnlocked(task, taskDone)) return null
  const need = task.unlockAfter.count
  const have = taskDone[task.unlockAfter.task]
  const left = Math.max(0, need - have)
  const prev = JOB_TASKS.find((t) => t.id === task.unlockAfter!.task)
  return `Сделай «${prev?.label ?? 'предыдущее'}» ещё ${left} раз`
}
