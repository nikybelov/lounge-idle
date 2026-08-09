import {
  AMBASSADOR_UNLOCK_FAME,
  AMBASSADOR_UNLOCK_MEDIA,
  AMBASSADOR_UNLOCK_REP,
  ambassadorContractCost,
  ambassadorNeeds,
  ambassadorReputationScore,
  type AmbassadorNeeds,
} from '../data/ambassador'
import { hasPersonalRepBoost, scaledPersonalFameGain } from '../data/personal'
import { getTobacco, TOBACCOS, type TobaccoId } from '../data/tobacco'
import type { ActionResult } from './career'
import { branchCount } from './empire'
import { isPersonalUnlocked } from './personal'
import type { GameState } from './state'

function meetsAmbassadorNeeds(state: GameState, need: AmbassadorNeeds): boolean {
  const { fame, media } = state.personal
  if (fame >= need.fame && media >= need.media) return true
  return ambassadorReputationScore(fame, media) >= need.rep
}

export function isAmbassador(state: GameState, id: TobaccoId): boolean {
  return state.personal.ambassadorOf[id] === true
}

export function ambassadorCount(state: GameState): number {
  return Object.values(state.personal.ambassadorOf).filter(Boolean).length
}

export function currentAmbassadorId(state: GameState): TobaccoId | null {
  for (const t of TOBACCOS) {
    if (state.personal.ambassadorOf[t.id]) return t.id
  }
  return null
}

/** В сохранении может быть несколько флагов — оставляем один контракт (старший tier) */
export function normalizeAmbassadorOf(
  raw: Partial<Record<TobaccoId, boolean>> | undefined,
): Partial<Record<TobaccoId, boolean>> {
  if (!raw) return {}
  const signed = TOBACCOS.filter((t) => raw[t.id]).map((t) => t.id)
  if (signed.length <= 1) return { ...raw }
  return { [signed[signed.length - 1]!]: true }
}

export function isAmbassadorSectionUnlocked(state: GameState): boolean {
  if (!isPersonalUnlocked(state)) return false
  const { fame, media, awardWins } = state.personal
  if (awardWins >= 1) return true
  if (branchCount(state) >= 2) return true
  if (fame >= AMBASSADOR_UNLOCK_FAME && media >= AMBASSADOR_UNLOCK_MEDIA) return true
  return ambassadorReputationScore(fame, media) >= AMBASSADOR_UNLOCK_REP
}

export function ambassadorSectionProgress(state: GameState): number {
  const { fame, media } = state.personal
  const fameR = fame / AMBASSADOR_UNLOCK_FAME
  const mediaR = media / AMBASSADOR_UNLOCK_MEDIA
  const repR = ambassadorReputationScore(fame, media) / AMBASSADOR_UNLOCK_REP
  return Math.min(1, Math.max(fameR, mediaR, repR))
}

export function canSignAmbassador(state: GameState, id: TobaccoId): boolean {
  if (!isAmbassadorSectionUnlocked(state)) return false
  if (isAmbassador(state, id)) return false
  const current = currentAmbassadorId(state)
  if (current !== null && current !== id) return false
  if (!state.ownedTobacco[id]) return false
  const def = getTobacco(id)
  if (!def) return false
  const need = ambassadorNeeds(id)
  if (!meetsAmbassadorNeeds(state, need)) return false
  return state.cash >= ambassadorContractCost(def)
}

export function signAmbassador(state: GameState, id: TobaccoId): ActionResult {
  if (!isPersonalUnlocked(state)) {
    return { ok: false, message: 'Амбассадорство — после открытия своего лаунжа' }
  }
  if (!isAmbassadorSectionUnlocked(state)) {
    return {
      ok: false,
      message: `Нужно узн. ${AMBASSADOR_UNLOCK_FAME}+ и мед. ${AMBASSADOR_UNLOCK_MEDIA}+, рейтинг ${AMBASSADOR_UNLOCK_REP}+, лауреат «Гайд Мастерс» или 2+ филиала`,
    }
  }
  if (isAmbassador(state, id)) {
    return { ok: false, message: 'Контракт с этим брендом уже есть' }
  }
  const current = currentAmbassadorId(state)
  if (current !== null && current !== id) {
    const other = getTobacco(current)
    return {
      ok: false,
      message: other
        ? `Амбассадор только одного бренда · сейчас «${other.brand}»`
        : 'Амбассадор только одного бренда',
    }
  }
  if (!state.ownedTobacco[id]) {
    return { ok: false, message: 'Сначала закажи этот вкус — вкладка «Табак»' }
  }
  const def = getTobacco(id)
  if (!def) return { ok: false, message: 'Неизвестный вкус' }
  const need = ambassadorNeeds(id)
  if (!meetsAmbassadorNeeds(state, need)) {
    const rep = ambassadorReputationScore(state.personal.fame, state.personal.media)
    return {
      ok: false,
      message: `Нужно узн. ${need.fame}+ и мед. ${need.media}+ или рейт. ${need.rep}+ · сейчас ${state.personal.fame}/${state.personal.media} · рейт. ${rep}`,
    }
  }
  const cost = ambassadorContractCost(def)
  if (state.cash < cost) {
    return { ok: false, message: 'Не хватает на контракт амбассадора' }
  }
  state.cash -= cost
  state.personal.ambassadorOf[id] = true
  state.personal.fame += scaledPersonalFameGain(
    hasPersonalRepBoost(state),
    1,
    state.personal.fame,
  )
  return {
    ok: true,
    message: `Амбассадор «${def.brand}» · ${def.name} — бонус на полке, пока вкус выставлен`,
  }
}

export function breakAmbassadorContract(state: GameState, id: TobaccoId): ActionResult {
  if (!isPersonalUnlocked(state)) {
    return { ok: false, message: 'Амбассадорство — после открытия своего лаунжа' }
  }
  if (!isAmbassador(state, id)) {
    return { ok: false, message: 'Контракта с этим брендом нет' }
  }
  const def = getTobacco(id)
  delete state.personal.ambassadorOf[id]
  return {
    ok: true,
    message: def
      ? `Контракт с «${def.brand}» расторгнут — можно выбрать другой бренд`
      : 'Контракт расторгнут — можно выбрать другой бренд',
  }
}
