/** Персонал — грейды 1–4. ФОТ масштабируется с выручкой (см. economy.staffPayrollPerSec). */

export type StaffId = 'host' | 'waiter' | 'master' | 'bar' | 'manager'

export interface StaffGradeDef {
  grade: number
  title: string
  /** Разовый найм или повышение до этого грейда */
  hireCost: number
  /** Зарплата, списывается каждую секунду из выручки */
  salaryPerSec: number
  guestBonus: number
  incomeBonus: number
  clickBonus: number
  /** Только у управляющего — скидка на ФОТ всей команды */
  managerDiscount?: number
}

export interface StaffRoleDef {
  id: StaffId
  name: string
  blurb: string
  grades: StaffGradeDef[]
}

/** Макс. людей на роли (управляющий — один) */
export function maxStaffForRole(id: StaffId): number {
  return id === 'manager' ? 1 : 4
}

export const STAFF_ROLES: StaffRoleDef[] = [
  {
    id: 'host',
    name: 'Хостес',
    blurb: 'Встречает гостей — выше поток',
    grades: [
      { grade: 1, title: 'Подменная', hireCost: 750, salaryPerSec: 0.32, guestBonus: 0.07, incomeBonus: 0.05, clickBonus: 0 },
      { grade: 2, title: 'В лаунже', hireCost: 3200, salaryPerSec: 1.0, guestBonus: 0.14, incomeBonus: 0.12, clickBonus: 0.5 },
      { grade: 3, title: 'Старшая', hireCost: 11_000, salaryPerSec: 2.4, guestBonus: 0.24, incomeBonus: 0.28, clickBonus: 1.2 },
      { grade: 4, title: 'Лицо бренда', hireCost: 38_000, salaryPerSec: 5.4, guestBonus: 0.38, incomeBonus: 0.5, clickBonus: 2.5 },
    ],
  },
  {
    id: 'waiter',
    name: 'Официант',
    blurb: 'Столы и заказы — выше чаевые с «Принять заказ»',
    grades: [
      { grade: 1, title: 'Подменный', hireCost: 900, salaryPerSec: 0.38, guestBonus: 0.05, incomeBonus: 0.12, clickBonus: 1.5 },
      { grade: 2, title: 'Официант', hireCost: 3900, salaryPerSec: 1.1, guestBonus: 0.09, incomeBonus: 0.4, clickBonus: 4 },
      { grade: 3, title: 'Старший', hireCost: 13_500, salaryPerSec: 2.7, guestBonus: 0.13, incomeBonus: 0.9, clickBonus: 10 },
      { grade: 4, title: 'Метрдотель', hireCost: 44_000, salaryPerSec: 6.0, guestBonus: 0.17, incomeBonus: 1.8, clickBonus: 22 },
    ],
  },
  {
    id: 'master',
    name: 'Кальянщик',
    blurb: 'Сервис и чаевые — сердце лаунжа',
    grades: [
      { grade: 1, title: 'Стажёр', hireCost: 1100, salaryPerSec: 0.48, guestBonus: 0.03, incomeBonus: 0.25, clickBonus: 1.2 },
      { grade: 2, title: 'Мастер', hireCost: 4800, salaryPerSec: 1.45, guestBonus: 0.06, incomeBonus: 0.6, clickBonus: 3.5 },
      { grade: 3, title: 'Старший', hireCost: 16_000, salaryPerSec: 3.5, guestBonus: 0.1, incomeBonus: 1.3, clickBonus: 9 },
      { grade: 4, title: 'Шеф-кальянный', hireCost: 52_000, salaryPerSec: 7.8, guestBonus: 0.14, incomeBonus: 2.8, clickBonus: 20 },
    ],
  },
  {
    id: 'bar',
    name: 'Бармен',
    blurb: 'Напитки и доп. чек — пассив растёт',
    grades: [
      { grade: 1, title: 'Помощник', hireCost: 1400, salaryPerSec: 0.42, guestBonus: 0.02, incomeBonus: 0.28, clickBonus: 0.4 },
      { grade: 2, title: 'Бармен', hireCost: 5800, salaryPerSec: 1.25, guestBonus: 0.04, incomeBonus: 0.7, clickBonus: 1 },
      { grade: 3, title: 'Миксолог', hireCost: 19_000, salaryPerSec: 3.1, guestBonus: 0.07, incomeBonus: 1.5, clickBonus: 2.5 },
      { grade: 4, title: 'Шеф-бар', hireCost: 58_000, salaryPerSec: 7.0, guestBonus: 0.1, incomeBonus: 3.3, clickBonus: 5 },
    ],
  },
  {
    id: 'manager',
    name: 'Управляющий',
    blurb: 'Держит смену — скидка на ФОТ всей команды',
    grades: [
      { grade: 1, title: 'Сменный', hireCost: 2400, salaryPerSec: 0.85, guestBonus: 0.05, incomeBonus: 0.2, clickBonus: 0, managerDiscount: 0.05 },
      { grade: 2, title: 'Управляющий', hireCost: 9500, salaryPerSec: 2.2, guestBonus: 0.09, incomeBonus: 0.5, clickBonus: 0, managerDiscount: 0.1 },
      { grade: 3, title: 'Операционный', hireCost: 32_000, salaryPerSec: 5.0, guestBonus: 0.14, incomeBonus: 1.1, clickBonus: 0, managerDiscount: 0.15 },
      { grade: 4, title: 'Генеральный', hireCost: 85_000, salaryPerSec: 11.0, guestBonus: 0.2, incomeBonus: 2.4, clickBonus: 0, managerDiscount: 0.22 },
    ],
  },
]

export function getStaffRole(id: StaffId): StaffRoleDef | undefined {
  return STAFF_ROLES.find((r) => r.id === id)
}

export function getStaffGradeDef(id: StaffId, grade: number): StaffGradeDef | undefined {
  const role = getStaffRole(id)
  if (!role || grade < 1) return undefined
  return role.grades[grade - 1]
}

export function staffBonusLabel(g: StaffGradeDef): string {
  const parts: string[] = []
  if (g.guestBonus > 0) parts.push(`+${g.guestBonus.toFixed(2)} гости`)
  if (g.incomeBonus > 0) parts.push(`+${g.incomeBonus.toFixed(2)}/с`)
  if (g.clickBonus > 0) parts.push(`+${g.clickBonus} чаевые`)
  if (g.managerDiscount) parts.push(`ФОТ −${Math.round(g.managerDiscount * 100)}%`)
  return parts.join(' · ') || 'без бонусов'
}

/** Стоимость ещё одного сотрудника на текущем грейде */
export function extraStaffHireCost(id: StaffId, grade: number): number {
  const def = getStaffGradeDef(id, grade)
  const base = getStaffGradeDef(id, 1)
  if (!def || !base) return 0
  return Math.max(350, Math.floor(base.hireCost * 0.58 + def.salaryPerSec * 90))
}

export function maxTeamHeadcount(): number {
  return STAFF_ROLES.reduce((sum, r) => sum + maxStaffForRole(r.id), 0)
}
