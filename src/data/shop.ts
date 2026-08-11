import type { JobRank } from './ranks'
import { rankIndex } from './ranks'
import type { TaskId } from './tasks'
import { isTaskUnlocked, JOB_TASKS } from './tasks'

export type ShopItemId = 'drill_brush' | 'tongs' | 'sneakers'

export interface ShopGrade {
  level: number
  title: string
  blurb: string
  cost: number
  /** Множитель кулдауна задачи на этом уровне */
  cooldownMult: number
  payBonus: number
}

export interface ShopItem {
  id: ShopItemId
  name: string
  blurb: string
  task: TaskId
  requiresTask: TaskId
  requiresRank: JobRank
  grades: ShopGrade[]
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'drill_brush',
    name: 'Шуруповёрт + ёршик',
    blurb: 'Ускоряет «Помой кальян»',
    task: 'wash',
    requiresTask: 'wash',
    requiresRank: 'assistant',
    grades: [
      {
        level: 1,
        title: 'Базовый комплект',
        blurb: 'Мойка быстрее руками',
        cost: 180,
        cooldownMult: 0.72,
        payBonus: 0,
      },
      {
        level: 2,
        title: 'Turbo-насадка',
        blurb: 'Меньше пауз между мойками',
        cost: 340,
        cooldownMult: 0.56,
        payBonus: 1,
      },
      {
        level: 3,
        title: 'Алмазная щётка',
        blurb: 'Почти без простоя',
        cost: 580,
        cooldownMult: 0.44,
        payBonus: 2,
      },
      {
        level: 4,
        title: 'Профи-кит',
        blurb: 'Максимум для мойки',
        cost: 920,
        cooldownMult: 0.34,
        payBonus: 3,
      },
    ],
  },
  {
    id: 'tongs',
    name: 'Щипцы для углей',
    blurb: 'Ускоряет «Поменяй угли»',
    task: 'coals',
    requiresTask: 'coals',
    requiresRank: 'assistant',
    grades: [
      {
        level: 1,
        title: 'Улучшенные щипцы',
        blurb: 'Угли меняются увереннее',
        cost: 220,
        cooldownMult: 0.74,
        payBonus: 0,
      },
      {
        level: 2,
        title: 'С термоизоляцией',
        blurb: 'Меньше ждать между сменами углей',
        cost: 400,
        cooldownMult: 0.58,
        payBonus: 1,
      },
      {
        level: 3,
        title: 'Угольные клещи',
        blurb: 'Темп как у опытного',
        cost: 660,
        cooldownMult: 0.45,
        payBonus: 2,
      },
      {
        level: 4,
        title: 'Мастерские щипцы',
        blurb: 'Максимум для углей',
        cost: 1050,
        cooldownMult: 0.35,
        payBonus: 3,
      },
    ],
  },
  {
    id: 'sneakers',
    name: 'Кроссовки для лаунжа',
    blurb: 'Ускоряет «Отнеси заказ»',
    task: 'order',
    requiresTask: 'order',
    requiresRank: 'assistant',
    grades: [
      {
        level: 1,
        title: 'Кроссовки',
        blurb: 'Бегаешь по лаунжу быстрее',
        cost: 320,
        cooldownMult: 0.74,
        payBonus: 0,
      },
      {
        level: 2,
        title: 'Лёгкие раннеры',
        blurb: 'Заказы летят чаще',
        cost: 520,
        cooldownMult: 0.58,
        payBonus: 1,
      },
      {
        level: 3,
        title: 'Антискользящие',
        blurb: 'Почти без пауз',
        cost: 820,
        cooldownMult: 0.46,
        payBonus: 2,
      },
      {
        level: 4,
        title: 'Pro shift',
        blurb: 'Максимум для заказов',
        cost: 1280,
        cooldownMult: 0.36,
        payBonus: 3,
      },
    ],
  },
]

export function shopMaxLevel(item: ShopItem): number {
  return item.grades.length
}

export function shopLevel(
  owned: Partial<Record<ShopItemId, number>>,
  id: ShopItemId,
): number {
  const v = owned[id]
  if (typeof v === 'boolean') return v ? 1 : 0
  return v ?? 0
}

export function getShopGrade(item: ShopItem, level: number): ShopGrade | null {
  if (level <= 0) return null
  return item.grades[level - 1] ?? null
}

export function nextShopGrade(item: ShopItem, level: number): ShopGrade | null {
  if (level >= item.grades.length) return null
  return item.grades[level] ?? null
}

export function shopEffectLabel(grade: ShopGrade, baseMs: number): string {
  const cdSec = ((baseMs * grade.cooldownMult) / 1000).toFixed(1)
  const parts = [`~${cdSec}с`]
  if (grade.payBonus > 0) parts.push(`+${grade.payBonus} к выплате`)
  return parts.join(' · ')
}

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

export function canUpgradeShopItem(
  item: ShopItem,
  level: number,
  taskDone: Record<TaskId, number>,
  rank: JobRank,
): boolean {
  if (level >= shopMaxLevel(item)) return false
  if (level === 0) return isShopItemAvailable(item, taskDone, rank)
  return true
}

export function shopRankHint(item: ShopItem): string {
  const titles: Record<JobRank, string> = {
    assistant: 'помощника',
    master: 'кальянного мастера',
    senior: 'старшего кальянного мастера',
  }
  return `Нужен ранг ${titles[item.requiresRank]}`
}

export function shopUnlockHint(item: ShopItem, taskDone: Record<TaskId, number>): string {
  const req = JOB_TASKS.find((t) => t.id === item.requiresTask)
  if (!req || !isTaskUnlocked(req, taskDone)) {
    return `Сначала «${req?.label ?? 'задачу'}»`
  }
  return shopRankHint(item)
}

export function taskCooldownMs(
  baseMs: number,
  taskId: TaskId,
  owned: Partial<Record<ShopItemId, number>>,
): number {
  let mult = 1
  for (const item of SHOP_ITEMS) {
    if (item.task !== taskId) continue
    const grade = getShopGrade(item, shopLevel(owned, item.id))
    if (grade) mult *= grade.cooldownMult
  }
  return Math.max(280, Math.round(baseMs * mult))
}

export function taskPay(
  basePay: number,
  taskId: TaskId,
  owned: Partial<Record<ShopItemId, number>>,
  payMult = 1,
): number {
  let pay = basePay
  for (const item of SHOP_ITEMS) {
    if (item.task !== taskId) continue
    const grade = getShopGrade(item, shopLevel(owned, item.id))
    if (grade) pay += grade.payBonus
  }
  return Math.max(1, Math.floor(pay * payMult))
}

export function shopItemsOwnedCount(owned: Partial<Record<ShopItemId, number>>): number {
  return SHOP_ITEMS.filter((i) => shopLevel(owned, i.id) > 0).length
}

export function shopItemsMaxedCount(owned: Partial<Record<ShopItemId, number>>): number {
  return SHOP_ITEMS.filter((i) => shopLevel(owned, i.id) >= shopMaxLevel(i)).length
}

/** Порог для трофея «Голыми руками» */
export const BARE_HANDS_WASH_NEED = 35

export function bareHandsStillPossible(
  owned: Partial<Record<ShopItemId, number>>,
  washCount: number,
): boolean {
  return shopLevel(owned, 'drill_brush') === 0 && washCount < BARE_HANDS_WASH_NEED
}
