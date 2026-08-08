import { BARE_HANDS_WASH_NEED, shopLevel } from '../data/shop'
import { loyalPocketsThreshold } from './difficulty'
import type { GameState } from './state'

/** Флаги для трофеев, которые нельзя проверить «в моменте» после смены фазы */
export function syncProgressFlags(state: GameState): void {
  if (state.phase === 'employed' && state.cash >= loyalPocketsThreshold(state)) {
    state.flags.loyalPockets = true
  }
  if (
    shopLevel(state.shopOwned, 'drill_brush') === 0 &&
    state.taskDone.wash >= BARE_HANDS_WASH_NEED
  ) {
    state.flags.bareHandsEarned = true
  }
}
