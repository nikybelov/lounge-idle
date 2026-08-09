import {
  getPromotionDef,
  getPromotionGradeDef,
  PROMOTIONS,
  type PromotionId,
} from '../data/promotions'
import { furnitureLevel } from './appeal'
import type { GameState } from './state'
import type { ActionResult } from './career'

export function isPromotionsUnlocked(state: GameState): boolean {
  return state.phase !== 'employed'
}

export function promotionGrade(state: GameState, id: PromotionId): number {
  return state.promotions.grades[id] ?? 0
}

export function isPromotionSlotUnlocked(state: GameState, id: PromotionId): boolean {
  const def = getPromotionDef(id)
  if (!def) return false
  return furnitureLevel(state) >= def.needFurniture
}

export function promotionPassiveBonus(state: GameState): number {
  if (!isPromotionsUnlocked(state)) return 0
  let sum = 0
  for (const def of PROMOTIONS) {
    const grade = promotionGrade(state, def.id)
    if (grade <= 0) continue
    const g = getPromotionGradeDef(def.id, grade)
    if (g) sum += g.passiveGuest
  }
  return sum
}

export function promotionTrafficBonus(state: GameState, now = Date.now()): number {
  if (!isPromotionsUnlocked(state)) return 0
  let bonus = promotionPassiveBonus(state)
  const p = state.promotions
  if (p.activeId && p.activeUntil > now) {
    bonus += p.activeBoost
  }
  return bonus
}

export function activePromotionRemainingSec(state: GameState, now = Date.now()): number {
  const p = state.promotions
  if (!p.activeId || p.activeUntil <= now) return 0
  return Math.ceil((p.activeUntil - now) / 1000)
}

export function activePromotionLabel(state: GameState, now = Date.now()): string | null {
  const p = state.promotions
  if (!p.activeId || p.activeUntil <= now) return null
  const def = getPromotionDef(p.activeId)
  if (!def) return null
  const sec = activePromotionRemainingSec(state, now)
  return `${def.name} · +${Math.round(p.activeBoost * 100)}% · ${sec}с`
}

export function promotionLaunchReadyAt(state: GameState, id: PromotionId): number {
  return state.promotions.readyAt[id] ?? 0
}

export function canUpgradePromotion(state: GameState, id: PromotionId): boolean {
  if (!isPromotionsUnlocked(state) || !isPromotionSlotUnlocked(state, id)) return false
  const grade = promotionGrade(state, id)
  if (grade >= 4) return false
  const next = getPromotionGradeDef(id, grade + 1)
  if (!next) return false
  return state.cash >= next.upgradeCost
}

export function canLaunchPromotion(
  state: GameState,
  id: PromotionId,
  now = Date.now(),
): boolean {
  if (!isPromotionsUnlocked(state) || !isPromotionSlotUnlocked(state, id)) return false
  const grade = promotionGrade(state, id)
  if (grade <= 0) return false
  if (state.promotions.activeId && state.promotions.activeUntil > now) return false
  if (now < promotionLaunchReadyAt(state, id)) return false
  const g = getPromotionGradeDef(id, grade)
  if (!g) return false
  return state.cash >= g.launchCost
}

function gate(state: GameState): ActionResult | null {
  if (!isPromotionsUnlocked(state)) {
    return { ok: false, message: 'Акции — после открытия своего зала' }
  }
  return null
}

export function upgradePromotion(state: GameState, id: PromotionId): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const def = getPromotionDef(id)
  if (!def) return { ok: false, message: 'Неизвестная акция' }
  if (!isPromotionSlotUnlocked(state, id)) {
    return {
      ok: false,
      message: `Нужна мебель суммарно ур.${def.needFurniture} (сейчас ${furnitureLevel(state)})`,
    }
  }
  const grade = promotionGrade(state, id)
  if (grade >= 4) return { ok: false, message: 'Максимальный грейд' }
  const next = getPromotionGradeDef(id, grade + 1)
  if (!next) return { ok: false, message: 'Нет следующего грейда' }
  if (state.cash < next.upgradeCost) {
    return { ok: false, message: 'Не хватает на прокачку акции' }
  }
  state.cash -= next.upgradeCost
  state.promotions.grades[id] = grade + 1
  const verb = grade === 0 ? 'Запущена' : 'Прокачана'
  return {
    ok: true,
    message: `${verb} «${def.name}» → ${next.title} · +${Math.round(next.passiveGuest * 100)}% гостей постоянно`,
  }
}

export function launchPromotion(
  state: GameState,
  id: PromotionId,
  now = Date.now(),
): ActionResult {
  const blocked = gate(state)
  if (blocked) return blocked
  const def = getPromotionDef(id)
  if (!def) return { ok: false, message: 'Неизвестная акция' }
  if (!isPromotionSlotUnlocked(state, id)) {
    return {
      ok: false,
      message: `Нужна мебель суммарно ур.${def.needFurniture}`,
    }
  }
  const grade = promotionGrade(state, id)
  if (grade <= 0) {
    return { ok: false, message: 'Сначала открой акцию — прокачай до 1-го грейда' }
  }
  if (state.promotions.activeId && state.promotions.activeUntil > now) {
    const active = getPromotionDef(state.promotions.activeId)
    return {
      ok: false,
      message: `Уже идёт «${active?.name ?? 'акция'}» — дождись окончания`,
    }
  }
  if (now < promotionLaunchReadyAt(state, id)) {
    return { ok: false, message: 'Акция на перезарядке' }
  }
  const g = getPromotionGradeDef(id, grade)
  if (!g) return { ok: false, message: 'Нет данных грейда' }
  if (state.cash < g.launchCost) {
    return { ok: false, message: 'Не хватает на запуск акции' }
  }
  state.cash -= g.launchCost
  state.promotions.activeId = id
  state.promotions.activeBoost = g.guestBoost
  state.promotions.activeUntil = now + g.durationMs
  state.promotions.readyAt[id] = now + g.cooldownMs
  state.flags.promoLaunched = { ...state.flags.promoLaunched, [id]: true }
  const min = Math.round(g.durationMs / 60_000)
  return {
    ok: true,
    message: `«${def.name}» на ${min} мин · +${Math.round(g.guestBoost * 100)}% гостей`,
  }
}
