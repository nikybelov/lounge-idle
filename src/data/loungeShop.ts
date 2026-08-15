/**
 * Магазин своего зала — ветки «для смены / staff zone».
 * Без голого +₽/с (это мебель/VIP). Бонусы: CD задач, tip, сервис, ФОТ, guest от команды.
 */

import type { TaskId } from './tasks'

export type LoungeShopId = 'heat' | 'wash_bay' | 'uniforms' | 'master_desk'

export interface LoungeShopGrade {
  level: number
  title: string
  /** Коротко «зачем» — в UI под названием */
  why: string
  cost: number
  /** Множитель CD задачи (1 = без изменений) */
  taskCdMult?: Partial<Record<TaskId, number>>
  /** Добавка к tip полки (0.02 = +2%) */
  tipBonus?: number
  /** Добавка к мощности сервиса */
  servicePower?: number
  /** Нужен хотя бы один кальянщик для servicePower */
  needMaster?: boolean
  /** Множитель guest-бонуса команды (0.03 = +3%) */
  staffGuestBonus?: number
  /** Снять с целевой доли ФОТ (0.005 = −0.5 п.п.) */
  fotRelief?: number
  /** Уменьшить walkaway (абс., 0.02 = −2 п.п.) */
  walkawayCut?: number
  /** Смягчить штраф сервиса к чеку (0.15 = −15% от «дыры») */
  servicePenaltySoft?: number
}

export interface LoungeShopLine {
  id: LoungeShopId
  name: string
  blurb: string
  grades: LoungeShopGrade[]
}

export const LOUNGE_SHOP_LINES: LoungeShopLine[] = [
  {
    id: 'heat',
    name: 'Жар',
    blurb: 'Ровный уголь → гости спокойнее, угли руками быстрее',
    grades: [
      {
        level: 1,
        title: 'Плитка «Злата»',
        why: 'Угли быстрее · старт жара в зале',
        cost: 280,
        taskCdMult: { coals: 0.92 },
      },
      {
        level: 2,
        title: 'Плитка «Дали»',
        why: 'Угли ещё шустрее · меньше уходов при давке',
        cost: 720,
        taskCdMult: { coals: 0.85 },
        walkawayCut: 0.02,
      },
      {
        level: 3,
        title: 'Плитка «Улькан»',
        why: 'Жар почти без брака · +чаевые с заказа',
        cost: 1_800,
        taskCdMult: { coals: 0.78 },
        tipBonus: 0.02,
        walkawayCut: 0.03,
      },
      {
        level: 4,
        title: 'Муфельная печка',
        why: 'Профи-жар: угли, чаевые, мягче штраф сервиса',
        cost: 4_200,
        taskCdMult: { coals: 0.7 },
        tipBonus: 0.04,
        walkawayCut: 0.04,
        servicePenaltySoft: 0.15,
      },
    ],
  },
  {
    id: 'wash_bay',
    name: 'Мойка',
    blurb: 'Чистая станция → мойка руками быстрее, смена тянет чуть больше',
    grades: [
      {
        level: 1,
        title: 'Раковина',
        why: '«Помой кальян» чуть быстрее',
        cost: 220,
        taskCdMult: { wash: 0.92 },
      },
      {
        level: 2,
        title: 'Мойка с краном',
        why: 'Мойка заметно быстрее',
        cost: 580,
        taskCdMult: { wash: 0.85 },
      },
      {
        level: 3,
        title: 'Двухсекционная мойка',
        why: 'Мойка + чуть больше «мощности» смены',
        cost: 1_400,
        taskCdMult: { wash: 0.78 },
        servicePower: 0.4,
      },
      {
        level: 4,
        title: 'Профмойка',
        why: 'Макс. мойка руками · смена держит зал крепче',
        cost: 3_200,
        taskCdMult: { wash: 0.7 },
        servicePower: 0.9,
      },
    ],
  },
  {
    id: 'uniforms',
    name: 'Форма',
    blurb: 'Команда выглядит дороже → гости липнут, ФОТ чуть мягче',
    grades: [
      {
        level: 1,
        title: 'Футболки с лого',
        why: 'Команда чуть заметнее для гостей',
        cost: 350,
        staffGuestBonus: 0.03,
      },
      {
        level: 2,
        title: 'Кители',
        why: 'Больше гостей от команды · ФОТ −0.5 п.п.',
        cost: 900,
        staffGuestBonus: 0.06,
        fotRelief: 0.005,
      },
      {
        level: 3,
        title: 'Комплект «зал»',
        why: 'Сильнее поток от команды · ФОТ −1 п.п.',
        cost: 2_200,
        staffGuestBonus: 0.1,
        fotRelief: 0.01,
      },
      {
        level: 4,
        title: 'Форма сети',
        why: 'Макс. вид команды · ФОТ −1.5 п.п.',
        cost: 5_000,
        staffGuestBonus: 0.14,
        fotRelief: 0.015,
      },
    ],
  },
  {
    id: 'master_desk',
    name: 'Стойка мастера',
    blurb: 'Рабочее место кальянщика · без мастера в команде сервис не растёт',
    grades: [
      {
        level: 1,
        title: 'Стол мастера',
        why: 'С мастером: +сервис · «заказ» руками чуть быстрее',
        cost: 400,
        taskCdMult: { order: 0.95 },
        servicePower: 0.8,
        needMaster: true,
      },
      {
        level: 2,
        title: 'Стойка с полкой',
        why: 'Сервис сильнее · заказ быстрее · чуть чаевых',
        cost: 1_100,
        taskCdMult: { order: 0.9 },
        tipBonus: 0.01,
        servicePower: 1.4,
        needMaster: true,
      },
      {
        level: 3,
        title: 'Станция с вытяжкой',
        why: 'Мастер тянет зал · заказ и чаевые лучше',
        cost: 2_800,
        taskCdMult: { order: 0.85 },
        tipBonus: 0.02,
        servicePower: 2.2,
        needMaster: true,
      },
      {
        level: 4,
        title: 'Профстойка',
        why: 'Топ для кальянщика · руки и сервис на максимуме ветки',
        cost: 6_500,
        taskCdMult: { order: 0.8 },
        tipBonus: 0.03,
        servicePower: 3.2,
        needMaster: true,
      },
    ],
  },
]

export function getLoungeShopLine(id: LoungeShopId): LoungeShopLine | undefined {
  return LOUNGE_SHOP_LINES.find((l) => l.id === id)
}

export function loungeShopLevel(
  owned: Partial<Record<LoungeShopId, number>> | undefined,
  id: LoungeShopId,
): number {
  const n = owned?.[id] ?? 0
  return Math.max(0, Math.min(4, Math.floor(n)))
}

export function getLoungeShopGrade(
  line: LoungeShopLine,
  level: number,
): LoungeShopGrade | undefined {
  return line.grades.find((g) => g.level === level)
}

export function nextLoungeShopGrade(
  line: LoungeShopLine,
  level: number,
): LoungeShopGrade | undefined {
  return line.grades.find((g) => g.level === level + 1)
}

export function loungeShopMaxLevel(line: LoungeShopLine): number {
  return line.grades[line.grades.length - 1]?.level ?? 0
}
