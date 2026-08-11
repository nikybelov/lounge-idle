/** Сервис зала: посадка vs команда — перегруз бьёт по чеку и гостям. */

import type { StaffId } from '../data/staff'
import { getStaffGradeDef } from '../data/staff'
import type { UpgradeId } from '../data/upgrades'
import type { GameState } from './state'
import { hiredStaffCount, staffMembers } from './staff'

/**
 * Веса ролей подогнаны так, что полная команда (все роли ×4, грейд 4 + управляющий)
 * тянет максимальный зал без штрафа:
 * стол12+диван10+VIP8+все зоны ≈ 122 места → мощность смены ~129.
 * Раздутый зал без найма / слабая смена — жалобы и −чек (задуманный риск).
 */
const ROLE_SERVICE_WEIGHT: Record<StaffId, number> = {
  host: 4.4,
  waiter: 7.2,
  master: 8.0,
  bar: 4.0,
  manager: 3.4,
}

/** Хозяин один тянет только крошечный зал */
const OWNER_SERVICE_BASE = 3.5

/** До этих мест без команды почти не штрафуем */
export const GRACE_SEATS = 6

export type ServiceMood = 'ok' | 'strained' | 'poor' | 'chaos'

export interface ServiceStatus {
  load: number
  capacity: number
  seatedRaw: number
  mood: ServiceMood
  incomeMult: number
  clickMult: number
  walkaway: number
  label: string
  hint: string
}

function gradeFactor(grade: number): number {
  return 0.72 + Math.max(1, grade) * 0.14
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t))
}

function moodFromLoad(load: number): ServiceMood {
  if (load <= 1.12) return 'ok'
  if (load <= 1.55) return 'strained'
  if (load <= 2.15) return 'poor'
  return 'chaos'
}

/** Мощность смены: хозяин + команда */
export function staffServiceCapacity(state: GameState): number {
  let power = OWNER_SERVICE_BASE
  for (const roleId of Object.keys(ROLE_SERVICE_WEIGHT) as StaffId[]) {
    const weight = ROLE_SERVICE_WEIGHT[roleId]
    for (const grade of staffMembers(state, roleId)) {
      const def = getStaffGradeDef(roleId, grade)
      if (!def) continue
      power += weight * gradeFactor(grade)
    }
  }
  return Math.max(OWNER_SERVICE_BASE, power)
}

/** Сколько мест даёт уровень мебели посадки */
export function seatsFromUpgrade(id: UpgradeId): number {
  if (id === 'table') return 2
  if (id === 'sofa') return 3
  if (id === 'vip') return 4
  return 0
}

/** Предупреждение: покупка раздует зал сильнее, чем тянет команда (не блок) */
export function seatingPurchaseWarns(
  state: GameState,
  currentSeats: number,
  addSeats: number,
): string | null {
  if (addSeats <= 0) return null
  const power = staffServiceCapacity(state)
  const after = currentSeats + addSeats
  if (after <= power * 1.12) return null
  if (after <= power * 1.55) {
    return `Можно · но команда тянет ~${Math.floor(power)} — будут жалобы`
  }
  return `Риск · зал ${after} мест, смена ~${Math.floor(power)} — сервис просядет`
}

/** Нагрузка и штрафы. Маленький зал без команды — льготный режим. */
export function serviceStatus(
  state: GameState,
  seatedRaw: number,
  seats: number,
): ServiceStatus {
  if (state.phase === 'employed') {
    return {
      load: 0,
      capacity: OWNER_SERVICE_BASE,
      seatedRaw: 0,
      mood: 'ok',
      incomeMult: 1,
      clickMult: 1,
      walkaway: 0,
      label: 'смена',
      hint: '',
    }
  }

  const capacity = staffServiceCapacity(state)
  const grace = seats <= GRACE_SEATS && hiredStaffCount(state) === 0
  const load = grace
    ? Math.min(1.05, seatedRaw / capacity)
    : seatedRaw / Math.max(0.5, capacity)
  const mood = moodFromLoad(load)

  let incomeMult = 1
  let clickMult = 1
  let walkaway = 0
  let label = 'Сервис в порядке'
  let hint = ''

  if (mood === 'strained') {
    const t = (load - 1.12) / 0.43
    incomeMult = lerp(1, 0.84, t)
    clickMult = lerp(1, 0.9, t)
    walkaway = lerp(0, 0.08, t)
    label = 'Не успеваешь'
    hint = 'Гости ждут — найми официанта или кальянщика'
  } else if (mood === 'poor') {
    const t = (load - 1.55) / 0.6
    incomeMult = lerp(0.84, 0.66, t)
    clickMult = lerp(0.9, 0.75, t)
    walkaway = lerp(0.08, 0.22, t)
    label = 'Плохой сервис'
    hint = 'Посадка больше команды — часть гостей уходит'
  } else if (mood === 'chaos') {
    const t = Math.min(1, (load - 2.15) / 1.2)
    incomeMult = lerp(0.66, 0.5, t)
    clickMult = lerp(0.75, 0.6, t)
    walkaway = lerp(0.22, 0.38, t)
    label = 'Хаос в зале'
    hint = 'Срочно усили команду — иначе чек тает'
  }

  return {
    load: Math.round(load * 100) / 100,
    capacity: Math.round(capacity * 10) / 10,
    seatedRaw: Math.round(seatedRaw * 10) / 10,
    mood,
    incomeMult,
    clickMult,
    walkaway,
    label,
    hint,
  }
}

const COMPLAINTS = [
  'Не успеваете',
  'Плохой сервис',
  'Гости ждут заказ',
  'Кальян остыл',
  'Очередь на вход',
  'Где официант?',
  'Долго ждать',
] as const

export function pickServiceComplaint(mood: ServiceMood): string {
  if (mood === 'ok') return ''
  if (mood === 'chaos') {
    const heavy = ['Хаос в зале', 'Гости уходят', 'Сервис не тянет', ...COMPLAINTS]
    return heavy[Math.floor(Math.random() * heavy.length)]!
  }
  return COMPLAINTS[Math.floor(Math.random() * COMPLAINTS.length)]!
}
