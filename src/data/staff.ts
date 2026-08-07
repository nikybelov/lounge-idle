/** Персонал своего лаунжа — грейды 1–4, разная зарплата и бонусы.
 *  Зарплаты калиброваны под ФОТ ~30–35% валовой выручки (эталон прибыльного full-service, NRA 2024). */

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
      { grade: 1, title: 'Подменная', hireCost: 750, salaryPerSec: 0.46, guestBonus: 0.07, incomeBonus: 0, clickBonus: 0 },
      { grade: 2, title: 'В зале', hireCost: 3200, salaryPerSec: 1.16, guestBonus: 0.14, incomeBonus: 0.05, clickBonus: 0.5 },
      { grade: 3, title: 'Старшая', hireCost: 11_000, salaryPerSec: 2.63, guestBonus: 0.24, incomeBonus: 0.12, clickBonus: 1.2 },
      { grade: 4, title: 'Лицо бренда', hireCost: 38_000, salaryPerSec: 5.9, guestBonus: 0.38, incomeBonus: 0.25, clickBonus: 2.5 },
    ],
  },
  {
    id: 'waiter',
    name: 'Официант',
    blurb: 'Столы и заказы — выше чаевые с «Принять заказ»',
    grades: [
      { grade: 1, title: 'Подменный', hireCost: 900, salaryPerSec: 0.53, guestBonus: 0.05, incomeBonus: 0.06, clickBonus: 1.5 },
      { grade: 2, title: 'Официант', hireCost: 3900, salaryPerSec: 1.26, guestBonus: 0.09, incomeBonus: 0.32, clickBonus: 4 },
      { grade: 3, title: 'Старший', hireCost: 13_500, salaryPerSec: 2.94, guestBonus: 0.13, incomeBonus: 0.78, clickBonus: 10 },
      { grade: 4, title: 'Метрдотель', hireCost: 44_000, salaryPerSec: 6.5, guestBonus: 0.17, incomeBonus: 1.65, clickBonus: 22 },
    ],
  },
  {
    id: 'master',
    name: 'Кальянщик',
    blurb: 'Сервис и чаевые — сердце зала',
    grades: [
      { grade: 1, title: 'Стажёр', hireCost: 1100, salaryPerSec: 0.67, guestBonus: 0.03, incomeBonus: 0.18, clickBonus: 1.2 },
      { grade: 2, title: 'Мастер', hireCost: 4800, salaryPerSec: 1.64, guestBonus: 0.06, incomeBonus: 0.5, clickBonus: 3.5 },
      { grade: 3, title: 'Старший', hireCost: 16_000, salaryPerSec: 3.9, guestBonus: 0.1, incomeBonus: 1.15, clickBonus: 9 },
      { grade: 4, title: 'Шеф-кальянный', hireCost: 52_000, salaryPerSec: 8.6, guestBonus: 0.14, incomeBonus: 2.6, clickBonus: 20 },
    ],
  },
  {
    id: 'bar',
    name: 'Бармен',
    blurb: 'Напитки и доп. чек — пассив растёт',
    grades: [
      { grade: 1, title: 'Помощник', hireCost: 1400, salaryPerSec: 0.59, guestBonus: 0.02, incomeBonus: 0.22, clickBonus: 0.4 },
      { grade: 2, title: 'Бармен', hireCost: 5800, salaryPerSec: 1.43, guestBonus: 0.04, incomeBonus: 0.58, clickBonus: 1 },
      { grade: 3, title: 'Миксолог', hireCost: 19_000, salaryPerSec: 3.4, guestBonus: 0.07, incomeBonus: 1.35, clickBonus: 2.5 },
      { grade: 4, title: 'Шеф-бар', hireCost: 58_000, salaryPerSec: 7.6, guestBonus: 0.1, incomeBonus: 3.1, clickBonus: 5 },
    ],
  },
  {
    id: 'manager',
    name: 'Управляющий',
    blurb: 'Держит смену — скидка на ФОТ всей команды',
    grades: [
      { grade: 1, title: 'Сменный', hireCost: 2400, salaryPerSec: 1.0, guestBonus: 0.05, incomeBonus: 0.15, clickBonus: 0, managerDiscount: 0.05 },
      { grade: 2, title: 'Управляющий', hireCost: 9500, salaryPerSec: 2.4, guestBonus: 0.09, incomeBonus: 0.42, clickBonus: 0, managerDiscount: 0.1 },
      { grade: 3, title: 'Операционный', hireCost: 32_000, salaryPerSec: 5.5, guestBonus: 0.14, incomeBonus: 0.95, clickBonus: 0, managerDiscount: 0.15 },
      { grade: 4, title: 'Генеральный', hireCost: 85_000, salaryPerSec: 12.2, guestBonus: 0.2, incomeBonus: 2.2, clickBonus: 0, managerDiscount: 0.22 },
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
