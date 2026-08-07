import {
  STAFF_ROLES,
  extraStaffHireCost,
  getStaffGradeDef,
  getStaffRole,
  maxStaffForRole,
  maxTeamHeadcount,
  type StaffGradeDef,
  type StaffId,
} from '../data/staff'
import type { GameState } from './state'

export { maxTeamHeadcount }

export function staffMembers(state: GameState, id: StaffId): number[] {
  return state.staffMembers[id] ?? []
}

export function staffHeadcount(state: GameState, id: StaffId): number {
  return staffMembers(state, id).length
}

/** Всего людей в команде */
export function hiredStaffCount(state: GameState): number {
  return STAFF_ROLES.reduce((sum, r) => sum + staffHeadcount(state, r.id), 0)
}

/** Сколько ролей занято хотя бы одним человеком */
export function staffRolesFilled(state: GameState): number {
  return STAFF_ROLES.filter((r) => staffHeadcount(state, r.id) > 0).length
}

function eachMember(
  state: GameState,
): { roleId: StaffId; index: number; grade: number; def: StaffGradeDef }[] {
  const out: { roleId: StaffId; index: number; grade: number; def: StaffGradeDef }[] = []
  for (const role of STAFF_ROLES) {
    staffMembers(state, role.id).forEach((grade, index) => {
      const def = getStaffGradeDef(role.id, grade)
      if (def) out.push({ roleId: role.id, index, grade, def })
    })
  }
  return out
}

export function managerPayrollDiscount(state: GameState): number {
  const grade = staffMembers(state, 'manager')[0]
  if (!grade) return 0
  return getStaffGradeDef('manager', grade)?.managerDiscount ?? 0
}

export function staffPayrollPerSec(state: GameState): number {
  let sum = 0
  for (const { def } of eachMember(state)) {
    sum += def.salaryPerSec
  }
  const discount = managerPayrollDiscount(state)
  if (discount > 0) sum *= 1 - discount
  return sum
}

export function staffBonuses(state: GameState): {
  guest: number
  income: number
  click: number
} {
  let guest = 0
  let income = 0
  let click = 0
  for (const { def } of eachMember(state)) {
    guest += def.guestBonus
    income += def.incomeBonus
    click += def.clickBonus
  }
  return { guest, income, click }
}

export function staffGuestBonus(state: GameState): number {
  return staffBonuses(state).guest
}

export function canManageStaff(state: GameState): boolean {
  return state.phase !== 'employed'
}

export function staffPayrollLabel(state: GameState): string {
  const payroll = staffPayrollPerSec(state)
  if (payroll <= 0) return 'ФОТ: только ты'
  const discount = managerPayrollDiscount(state)
  const discountNote =
    discount > 0 ? ` · скидка ${Math.round(discount * 100)}%` : ''
  const shown = payroll < 10 ? payroll.toFixed(1) : Math.floor(payroll).toString()
  return `ФОТ ${shown}/с${discountNote}`
}

export function hireStaffCheck(
  state: GameState,
  id: StaffId,
): { ok: true } | { ok: false; message: string } {
  if (!canManageStaff(state)) {
    return { ok: false, message: 'Сначала открой свой зал' }
  }
  const role = getStaffRole(id)
  if (!role) return { ok: false, message: 'Нет такой роли' }
  if (staffHeadcount(state, id) > 0) {
    return { ok: false, message: 'Уже нанят — повышай или добавляй ещё' }
  }
  const grade = getStaffGradeDef(id, 1)
  if (!grade) return { ok: false, message: 'Нет такой роли' }
  if (state.cash < grade.hireCost) {
    return {
      ok: false,
      message: `Не хватает · нужно ещё ${Math.ceil(grade.hireCost - state.cash)}`,
    }
  }
  return { ok: true }
}

export function upgradeStaffMemberCheck(
  state: GameState,
  id: StaffId,
  index: number,
): { ok: true } | { ok: false; message: string } {
  if (!canManageStaff(state)) {
    return { ok: false, message: 'Сначала открой свой зал' }
  }
  const members = staffMembers(state, id)
  if (index < 0 || index >= members.length) {
    return { ok: false, message: 'Нет такого сотрудника' }
  }
  const current = members[index]
  if (current >= 4) return { ok: false, message: 'Максимальный грейд' }
  const next = getStaffGradeDef(id, current + 1)
  if (!next) return { ok: false, message: 'Максимальный грейд' }
  if (state.cash < next.hireCost) {
    return {
      ok: false,
      message: `Не хватает · нужно ещё ${Math.ceil(next.hireCost - state.cash)}`,
    }
  }
  return { ok: true }
}

export function addStaffCheck(
  state: GameState,
  id: StaffId,
): { ok: true } | { ok: false; message: string } {
  if (!canManageStaff(state)) {
    return { ok: false, message: 'Сначала открой свой зал' }
  }
  const count = staffHeadcount(state, id)
  if (count <= 0) {
    return { ok: false, message: 'Сначала найми первого' }
  }
  const max = maxStaffForRole(id)
  if (count >= max) {
    return { ok: false, message: `Максимум ${max} на этой роли` }
  }
  const cost = extraStaffHireCost(id, 1)
  if (state.cash < cost) {
    return {
      ok: false,
      message: `Не хватает · нужно ещё ${Math.ceil(cost - state.cash)}`,
    }
  }
  return { ok: true }
}

export function fireStaffMemberCheck(
  state: GameState,
  id: StaffId,
  index: number,
): { ok: true } | { ok: false; message: string } {
  if (!canManageStaff(state)) {
    return { ok: false, message: 'Сначала открой свой зал' }
  }
  const members = staffMembers(state, id)
  if (index < 0 || index >= members.length) {
    return { ok: false, message: 'Никого не нанято' }
  }
  return { ok: true }
}
