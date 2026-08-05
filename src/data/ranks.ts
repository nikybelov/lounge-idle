import type { TaskId } from './tasks'

export type JobRank = 'assistant' | 'master' | 'senior'

export interface JobRankDef {
  id: JobRank
  title: string
  /** Множитель зарплаты задач */
  payMult: number
  /** Условия для перехода НА этот ранг с предыдущего */
  requires?: Partial<Record<TaskId, number>>
}

export const JOB_RANKS: JobRankDef[] = [
  {
    id: 'assistant',
    title: 'Помощник',
    payMult: 1,
  },
  {
    id: 'master',
    title: 'Кальянный мастер',
    payMult: 1.65,
    requires: { wash: 30, coals: 20, order: 12 },
  },
  {
    id: 'senior',
    title: 'Старший кальянный мастер',
    payMult: 2.4,
    requires: { wash: 70, coals: 50, order: 40 },
  },
]

export function rankIndex(rank: JobRank): number {
  return JOB_RANKS.findIndex((r) => r.id === rank)
}

export function rankDef(rank: JobRank): JobRankDef {
  return JOB_RANKS.find((r) => r.id === rank) ?? JOB_RANKS[0]
}

export function nextRank(rank: JobRank): JobRankDef | null {
  const i = rankIndex(rank)
  return JOB_RANKS[i + 1] ?? null
}

export function canPromote(rank: JobRank, taskDone: Record<TaskId, number>): boolean {
  const next = nextRank(rank)
  if (!next?.requires) return false
  return Object.entries(next.requires).every(
    ([id, need]) => taskDone[id as TaskId] >= (need ?? 0),
  )
}

export function promoteProgress(
  rank: JobRank,
  taskDone: Record<TaskId, number>,
): { label: string; have: number; need: number }[] {
  const next = nextRank(rank)
  if (!next?.requires) return []
  return Object.entries(next.requires).map(([id, need]) => {
    const labels: Record<TaskId, string> = {
      wash: 'мойки',
      coals: 'угли',
      order: 'заказы',
    }
    return {
      label: labels[id as TaskId],
      have: Math.min(taskDone[id as TaskId], need ?? 0),
      need: need ?? 0,
    }
  })
}
