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

export function isJobRank(value: unknown): value is JobRank {
  return value === 'assistant' || value === 'master' || value === 'senior'
}

/** Старые/битые сейвы → стартовый ранг */
export function normalizeJobRank(value: unknown): JobRank {
  return isJobRank(value) ? value : 'assistant'
}

/** Ранг не выше того, что реально открыт задачами (чинит админ/битые сейвы) */
export function clampJobRankToProgress(
  rank: JobRank,
  taskDone: Partial<Record<TaskId, number>> | undefined,
): JobRank {
  const done = taskDone ?? {}
  let allowed: JobRank = 'assistant'
  for (const def of JOB_RANKS) {
    if (!def.requires) {
      allowed = def.id
      continue
    }
    const ok = Object.entries(def.requires).every(
      ([id, need]) => (done[id as TaskId] ?? 0) >= (need ?? 0),
    )
    if (!ok) break
    allowed = def.id
  }
  const want = normalizeJobRank(rank)
  return rankIndex(want) <= rankIndex(allowed) ? want : allowed
}

export function rankIndex(rank: JobRank): number {
  const i = JOB_RANKS.findIndex((r) => r.id === normalizeJobRank(rank))
  return i >= 0 ? i : 0
}

export function rankDef(rank: JobRank): JobRankDef {
  return JOB_RANKS.find((r) => r.id === normalizeJobRank(rank)) ?? JOB_RANKS[0]
}

export function nextRank(rank: JobRank): JobRankDef | null {
  const i = rankIndex(rank)
  if (i < 0 || i >= JOB_RANKS.length - 1) return null
  return JOB_RANKS[i + 1] ?? null
}

export function canPromote(rank: JobRank, taskDone: Record<TaskId, number>): boolean {
  const next = nextRank(rank)
  if (!next?.requires) return false
  return Object.entries(next.requires).every(
    ([id, need]) => (taskDone[id as TaskId] ?? 0) >= (need ?? 0),
  )
}

export function promoteProgress(
  rank: JobRank,
  taskDone: Record<TaskId, number>,
): { label: string; have: number; need: number }[] {
  const next = nextRank(rank)
  if (!next?.requires) return []
  const labels: Record<TaskId, string> = {
    wash: 'мойки',
    coals: 'угли',
    order: 'заказы',
  }
  return (Object.keys(next.requires) as TaskId[]).map((id) => {
    const need = next.requires![id] ?? 0
    const have = Math.min(Math.max(0, taskDone[id] ?? 0), need)
    return {
      label: labels[id],
      have,
      need,
    }
  })
}

export function promoteProgressRatio(
  rank: JobRank,
  taskDone: Record<TaskId, number>,
): number {
  const rows = promoteProgress(rank, taskDone)
  if (!rows.length) return 0
  const sum = rows.reduce((s, p) => s + (p.need > 0 ? p.have / p.need : 0), 0)
  return Math.min(1, sum / rows.length)
}
