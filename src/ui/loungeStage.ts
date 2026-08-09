import type { GameState } from '../game/state'

export function shouldShowLiveLoungeStage(state: GameState): boolean {
  return state.scene === 'lounge' && state.phase !== 'employed'
}

/** Лёгкое дыхание арта своего лаунжа; фон — символический SVG тарифа */
export function updateLoungeStageArt(root: HTMLElement, state: GameState): void {
  const stage = root.querySelector('.stage') as HTMLElement | null
  const art = root.querySelector('.stage-art') as HTMLElement | null
  if (!art) return

  const showLive = shouldShowLiveLoungeStage(state)
  if (stage) {
    if (showLive) stage.dataset.loungeLive = '1'
    else delete stage.dataset.loungeLive
  }

  art.dataset.live = showLive ? '1' : '0'

  // Убираем старый furniture-live SVG, если остался от прошлых сейвов/сессий
  art.querySelectorAll('.stage-svg--live').forEach((el) => el.remove())
}
