import type { JobRank } from './ranks'
import { rankIndex } from './ranks'
import type { TaskId } from './tasks'
import { isTaskUnlocked, JOB_TASKS } from './tasks'

export type ShopItemId = 'drill_brush' | 'tongs' | 'sneakers'

export interface ShopItem {
  id: ShopItemId
  name: string
  blurb: string
  cost: number
  task: TaskId
  cooldownMult: number
  payBonus: number
  requiresTask: TaskId
  /** Минимальный ранг для покупки */
  requiresRank: JobRank
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'drill_brush',
    name: 'Шуруповёрт + ёршик',
    blurb: 'Кальяны моются быстрее',
    cost: 180,
    task: 'wash',
    cooldownMult: 0.45,
    payBonus: 0,
    requiresTask: 'wash',
    requiresRank: 'assistant',
  },
  {
    id: 'tongs',
    name: 'Улучшенные щипцы',
    blurb: 'Угли меняются быстрее',
    cost: 220,
    task: 'coals',
    cooldownMult: 0.5,
    payBonus: 0,
    requiresTask: 'coals',
    requiresRank: 'assistant',
  },
  {
    id: 'sneakers',
    name: 'Кроссовки',
    blurb: 'Заказы относишь быстрее',
    cost: 320,
    task: 'order',
    cooldownMult: 0.5,
    payBonus: 0,
    requiresTask: 'order',
    requiresRank: 'assistant',
  },
]

export function isShopItemAvailable(
  item: ShopItem,
  taskDone: Record<TaskId, number>,
  rank: JobRank,
): boolean {
  const req = JOB_TASKS.find((t) => t.id === item.requiresTask)
  if (!req) return false
  if (!isTaskUnlocked(req, taskDone)) return false
  return rankIndex(rank) >= rankIndex(item.requiresRank)
}

export function shopRankHint(item: ShopItem): string {
  const titles: Record<JobRank, string> = {
    assistant: 'помощника',
    master: 'кальянного мастера',
    senior: 'старшего мастера',
  }
  return `Нужен ранг ${titles[item.requiresRank]}`
}

export function taskCooldownMs(
  baseMs: number,
  taskId: TaskId,
  owned: Partial<Record<ShopItemId, boolean>>,
): number {
  let mult = 1
  for (const item of SHOP_ITEMS) {
    if (item.task !== taskId) continue
    if (!owned[item.id]) continue
    mult *= item.cooldownMult
  }
  return Math.max(320, Math.round(baseMs * mult))
}

export function taskPay(
  basePay: number,
  taskId: TaskId,
  owned: Partial<Record<ShopItemId, boolean>>,
  payMult = 1,
): number {
  let pay = basePay
  for (const item of SHOP_ITEMS) {
    if (item.task !== taskId) continue
    if (!owned[item.id]) continue
    pay += item.payBonus
  }
  return Math.max(1, Math.floor(pay * payMult))
}
