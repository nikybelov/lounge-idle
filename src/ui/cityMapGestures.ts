/** Pinch / wheel zoom для карты сети. Pan — только когда увеличено. */

const BASE_SCALE = 1.28
const MIN_SCALE = BASE_SCALE
const MAX_SCALE = BASE_SCALE * 2.35
const ORIGIN_Y = 0.44

type MapView = {
  scale: number
  x: number
  y: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function touchDist(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}

function touchMid(a: Touch, b: Touch): { x: number; y: number } {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

function applyView(map: HTMLElement, view: MapView): void {
  const span = Math.min(map.clientWidth, map.clientHeight)
  const maxPan = ((view.scale / BASE_SCALE - 1) * span) / 1.6
  view.x = clamp(view.x, -maxPan, maxPan)
  view.y = clamp(view.y, -maxPan, maxPan)
  if (view.scale <= MIN_SCALE + 0.02) {
    view.scale = MIN_SCALE
    view.x = 0
    view.y = 0
  }
  map.style.setProperty('--map-scale', String(view.scale))
  map.style.setProperty('--map-tx', `${view.x.toFixed(1)}px`)
  map.style.setProperty('--map-ty', `${view.y.toFixed(1)}px`)
  map.classList.toggle('is-zoomed', view.scale > MIN_SCALE + 0.04)
}

/** Масштаб вокруг точки (client coords), transform-origin = 50% / 44%. */
function zoomAt(
  map: HTMLElement,
  view: MapView,
  nextScale: number,
  clientX: number,
  clientY: number,
): void {
  const rect = map.getBoundingClientRect()
  const ox = rect.left + rect.width * 0.5
  const oy = rect.top + rect.height * ORIGIN_Y
  const px = clientX - ox
  const py = clientY - oy
  const prev = view.scale
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
  if (prev <= 0 || scale === prev) {
    applyView(map, view)
    return
  }
  const k = scale / prev
  view.x = px - (px - view.x) * k
  view.y = py - (py - view.y) * k
  view.scale = scale
  applyView(map, view)
}

/** Подключить жесты к узлу `.city-map`. Повторный вызов безопасен. */
export function wireCityMapGestures(map: HTMLElement): void {
  if (map.dataset.mapGestures === '1') return
  map.dataset.mapGestures = '1'

  const view: MapView = { scale: BASE_SCALE, x: 0, y: 0 }
  applyView(map, view)

  let pinchLastDist = 0
  let pinchActive = false
  let pan: { id: number; x: number; y: number; vx: number; vy: number } | null =
    null
  let lastTapAt = 0

  const onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length >= 2) {
      pan = null
      pinchActive = true
      pinchLastDist = Math.max(1, touchDist(e.touches[0]!, e.touches[1]!))
      return
    }
    pinchActive = false
    if (e.touches.length === 1 && view.scale > MIN_SCALE + 0.04) {
      const t = e.touches[0]!
      if ((t.target as Element | null)?.closest?.('[data-map-pin]')) {
        pan = null
        return
      }
      pan = {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        vx: view.x,
        vy: view.y,
      }
    }
  }

  const onTouchMove = (e: TouchEvent): void => {
    if (e.touches.length >= 2) {
      e.preventDefault()
      const a = e.touches[0]!
      const b = e.touches[1]!
      const dist = Math.max(1, touchDist(a, b))
      const mid = touchMid(a, b)
      if (!pinchActive || pinchLastDist <= 0) {
        pinchActive = true
        pinchLastDist = dist
        return
      }
      const ratio = dist / pinchLastDist
      pinchLastDist = dist
      zoomAt(map, view, view.scale * ratio, mid.x, mid.y)
      return
    }
    if (pan && e.touches.length === 1) {
      const t = [...e.touches].find((x) => x.identifier === pan!.id)
      if (!t) return
      e.preventDefault()
      view.x = pan.vx + (t.clientX - pan.x)
      view.y = pan.vy + (t.clientY - pan.y)
      applyView(map, view)
    }
  }

  const onTouchEnd = (e: TouchEvent): void => {
    if (e.touches.length < 2) {
      pinchActive = false
      pinchLastDist = 0
    }
    if (e.touches.length === 0) {
      pan = null
      if (e.changedTouches.length === 1) {
        const t = e.changedTouches[0]!
        if ((t.target as Element | null)?.closest?.('[data-map-pin]')) return
        const now = performance.now()
        if (now - lastTapAt < 280) {
          view.scale = MIN_SCALE
          view.x = 0
          view.y = 0
          applyView(map, view)
          lastTapAt = 0
        } else {
          lastTapAt = now
        }
      }
    }
  }

  const onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    zoomAt(map, view, view.scale * factor, e.clientX, e.clientY)
  }

  map.addEventListener('touchstart', onTouchStart, { passive: true })
  map.addEventListener('touchmove', onTouchMove, { passive: false })
  map.addEventListener('touchend', onTouchEnd, { passive: true })
  map.addEventListener('touchcancel', onTouchEnd, { passive: true })
  map.addEventListener('wheel', onWheel, { passive: false })
}
