import type { MascotPose } from './mascot'

export type MascotStageId =
  | 'stand-right'
  | 'stand-left'
  | 'sit-top'
  | 'peek-top'
  | 'hide-behind'
  | 'wave-side'

export type MascotLayer = 'behind' | 'front'

export interface MascotChoreoContext {
  stepKey: string
  cardRect: DOMRect
  keepClearOf?: DOMRect | null
}

export interface MascotStageLayout {
  id: MascotStageId
  pose: MascotPose
  layer: MascotLayer
  left: number
  top: number
  className: string
}

const SIZE = 68
const HEIGHT = 78
const VIEW_PAD = 12

const ALL_STAGES: MascotStageId[] = [
  'stand-right',
  'stand-left',
  'sit-top',
  'peek-top',
  'hide-behind',
  'wave-side',
]

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function overlapsRect(
  a: { left: number; top: number; right: number; bottom: number },
  b: DOMRect,
  margin = 4,
): boolean {
  return !(
    a.right + margin < b.left ||
    a.left - margin > b.right ||
    a.bottom + margin < b.top ||
    a.top - margin > b.bottom
  )
}

function poseForStage(id: MascotStageId, stepKey: string): MascotPose {
  if (id === 'sit-top') return 'sit'
  if (id === 'wave-side' || id === 'stand-right' || id === 'stand-left') return 'wave'
  if (id === 'hide-behind') return 'idle'
  if (stepKey.includes('reputation') || stepKey.includes('halfway')) return 'happy'
  if (id === 'peek-top') return 'point'
  return 'point'
}

function rawLayout(id: MascotStageId, card: DOMRect): Omit<MascotStageLayout, 'left' | 'top'> & {
  left: number
  top: number
} {
  const c = card
  switch (id) {
    case 'stand-right':
      return {
        id,
        pose: 'wave',
        layer: 'front',
        left: c.right + 6,
        top: c.top + c.height * 0.5 - HEIGHT * 0.55,
        className: 'guide-mascot--stand guide-mascot--stand-right',
      }
    case 'stand-left':
      return {
        id,
        pose: 'wave',
        layer: 'front',
        left: c.left - SIZE - 8,
        top: c.top + c.height * 0.5 - HEIGHT * 0.55,
        className: 'guide-mascot--stand guide-mascot--stand-left',
      }
    case 'sit-top':
      return {
        id,
        pose: 'sit',
        layer: 'front',
        left: c.left + c.width * 0.5 - SIZE * 0.5,
        top: c.top - HEIGHT + 26,
        className: 'guide-mascot--sit',
      }
    case 'peek-top':
      return {
        id,
        pose: 'point',
        layer: 'behind',
        left: c.right - SIZE + 4,
        top: c.top - 62,
        className: 'guide-mascot--peek guide-mascot--peek-top',
      }
    case 'hide-behind':
      return {
        id,
        pose: 'idle',
        layer: 'behind',
        left: c.left + c.width * 0.22,
        top: c.top - 22,
        className: 'guide-mascot--hide-peek',
      }
    case 'wave-side':
      return {
        id,
        pose: 'wave',
        layer: 'front',
        left: c.right - SIZE - 4,
        top: c.bottom - HEIGHT + 6,
        className: 'guide-mascot--wave-side',
      }
  }
}

function fitsViewport(left: number, top: number): boolean {
  return (
    left >= VIEW_PAD &&
    top >= VIEW_PAD &&
    left + SIZE <= window.innerWidth - VIEW_PAD &&
    top + HEIGHT <= window.innerHeight - VIEW_PAD
  )
}

function fitsClearZone(
  left: number,
  top: number,
  keepClearOf: DOMRect,
): boolean {
  const box = { left, top, right: left + SIZE, bottom: top + HEIGHT }
  return !overlapsRect(box, keepClearOf)
}

export function layoutMascotStage(
  id: MascotStageId,
  ctx: MascotChoreoContext,
): MascotStageLayout | null {
  const raw = rawLayout(id, ctx.cardRect)
  const pose = poseForStage(id, ctx.stepKey)
  let { left, top } = raw

  left = clamp(left, VIEW_PAD, window.innerWidth - SIZE - VIEW_PAD)
  top = clamp(top, VIEW_PAD, window.innerHeight - HEIGHT - VIEW_PAD)

  if (!fitsViewport(left, top)) return null
  if (ctx.keepClearOf && !fitsClearZone(left, top, ctx.keepClearOf)) return null

  return {
    id,
    pose,
    layer: raw.layer,
    left,
    top,
    className: `${raw.className} guide-mascot--layer-${raw.layer}`,
  }
}

export function pickMascotStage(
  ctx: MascotChoreoContext,
  exclude?: MascotStageId,
): MascotStageLayout {
  const pool = ALL_STAGES.filter((id) => id !== exclude)
  const shuffled = [...pool].sort(() => Math.random() - 0.5)

  for (const id of shuffled) {
    const layout = layoutMascotStage(id, ctx)
    if (layout) return layout
  }

  for (const id of ALL_STAGES) {
    const layout = layoutMascotStage(id, ctx)
    if (layout) return layout
  }

  return {
    id: 'stand-right',
    pose: poseForStage('stand-right', ctx.stepKey),
    layer: 'front',
    left: clamp(
      ctx.cardRect.right + 6,
      VIEW_PAD,
      window.innerWidth - SIZE - VIEW_PAD,
    ),
    top: clamp(
      ctx.cardRect.top + 8,
      VIEW_PAD,
      window.innerHeight - HEIGHT - VIEW_PAD,
    ),
    className: 'guide-mascot--stand guide-mascot--stand-right guide-mascot--layer-front',
  }
}

import { prefersReducedMotion } from '../save/settings'

export function reducedMotionPreferred(): boolean {
  return prefersReducedMotion()
}
