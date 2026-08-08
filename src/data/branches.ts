/** Точки сети — открываются после «конца» основной карьеры */

export type BranchId = 'metro' | 'mall' | 'park' | 'tower' | 'coast'

export interface BranchDef {
  id: BranchId
  name: string
  blurb: string
  cost: number
  /** Добавка к множителю пассивного дохода всей сети */
  incomeMult: number
  /** Добавка к множителю чаевых (клик) */
  clickMult: number
  /** Предыдущая точка в цепочке */
  needBranch?: BranchId
}

export const BRANCHES: BranchDef[] = [
  {
    id: 'metro',
    name: 'У метро · второй вход',
    blurb: 'Компактный зал у потока — первый филиал',
    cost: 150_000,
    incomeMult: 0.14,
    clickMult: 0.08,
  },
  {
    id: 'mall',
    name: 'ТЦ · третий этаж',
    blurb: 'Семейный трафик и долгие сессии',
    cost: 375_000,
    incomeMult: 0.16,
    clickMult: 0.1,
    needBranch: 'metro',
  },
  {
    id: 'park',
    name: 'Парк · летняя веранда',
    blurb: 'Сезонный хайп — выше чек в выходные',
    cost: 825_000,
    incomeMult: 0.18,
    clickMult: 0.11,
    needBranch: 'mall',
  },
  {
    id: 'tower',
    name: 'Бизнес-центр · lobby',
    blurb: 'Корпоративы и after-work',
    cost: 1_500_000,
    incomeMult: 0.22,
    clickMult: 0.12,
    needBranch: 'park',
  },
  {
    id: 'coast',
    name: 'Курорт · набережная',
    blurb: 'Флагман сети — туристы и премиум',
    cost: 3_750_000,
    incomeMult: 0.28,
    clickMult: 0.15,
    needBranch: 'tower',
  },
]

export function getBranch(id: BranchId): BranchDef | undefined {
  return BRANCHES.find((b) => b.id === id)
}
