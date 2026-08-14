type Smoke = { x: number; y: number; vx: number; vy: number; r: number; a: number }

let stageCanvas: HTMLCanvasElement | null = null
let stageHost: HTMLElement | null = null
let rafId = 0
let running = false
let inView = true
let particles: Smoke[] = []
let w = 0
let h = 0
let ctx: CanvasRenderingContext2D | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let lastSceneKey = ''

import { prefersReducedMotion } from '../save/settings'
import { isTelegramMiniApp } from '../platform/runtime'

function reducedMotion(): boolean {
  return prefersReducedMotion()
}

function particleCount(stage: HTMLElement): number {
  const tg = isTelegramMiniApp()
  if (stage.dataset.scene === 'lounge') return tg ? 10 : 18
  if (stage.dataset.scene === 'job') return tg ? 4 : 6
  return tg ? 6 : 10
}

function seedParticles(stage: HTMLElement): void {
  particles = []
  const n = particleCount(stage)
  for (let i = 0; i < n; i++) {
    particles.push({
      x: w * (0.52 + Math.random() * 0.38),
      y: h * (0.5 + Math.random() * 0.42),
      vx: -10 - Math.random() * 22,
      vy: -14 - Math.random() * 24,
      r: 1.2 + Math.random() * 2.8,
      a: 0.06 + Math.random() * 0.14,
    })
  }
}

function atmosphereHost(stage: HTMLElement): HTMLElement {
  const shell = stage.closest('.app-shell') as HTMLElement | null
  if (shell?.dataset.ui === 'd') return shell
  return stage
}

function resizeCanvas(stage: HTMLElement): void {
  if (!stageCanvas || !ctx) return
  const rect = atmosphereHost(stage).getBoundingClientRect()
  w = Math.max(1, Math.floor(rect.width))
  h = Math.max(1, Math.floor(rect.height))
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  stageCanvas.width = w * dpr
  stageCanvas.height = h * dpr
  stageCanvas.style.width = `${w}px`
  stageCanvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

let ditherCanvas: HTMLCanvasElement | null = null
let ditherKey = ''

function drawDither(): void {
  if (!ctx) return
  const key = `${w}x${h}`
  if (!ditherCanvas || ditherKey !== key) {
    ditherCanvas = document.createElement('canvas')
    ditherCanvas.width = w
    ditherCanvas.height = h
    const dctx = ditherCanvas.getContext('2d')
    if (!dctx) return
    const cx = w * 0.68
    const cy = h * 0.38
    const g = dctx.createRadialGradient(cx, cy, 0, w * 0.5, h * 0.55, Math.max(w, h) * 0.75)
    g.addColorStop(0, 'rgba(224,122,58,0.07)')
    g.addColorStop(0.45, 'rgba(80,55,40,0.04)')
    g.addColorStop(1, 'transparent')
    dctx.fillStyle = g
    dctx.fillRect(0, 0, w, h)
    const step = 5
    for (let y = 0; y < h; y += step) {
      for (let x = (y / step) % 2; x < w; x += step) {
        const dx = (x - cx) / w
        const dy = (y - cy) / h
        const falloff = Math.max(0, 1 - Math.hypot(dx, dy) * 1.35)
        if (falloff < 0.08) continue
        dctx.fillStyle = `rgba(180,170,160,${0.025 * falloff})`
        dctx.fillRect(x, y, 1, 1)
      }
    }
    ditherKey = key
  }
  ctx.drawImage(ditherCanvas, 0, 0)
}

function setAnimationActive(active: boolean): void {
  if (!stageHost) return
  stageHost.dataset.animationActive = active ? '1' : '0'
}

function shouldAnimate(): boolean {
  return running && inView && !document.hidden && !reducedMotion()
}

function stopLoop(): void {
  cancelAnimationFrame(rafId)
  rafId = 0
  setAnimationActive(false)
}

function ensureLoop(): void {
  if (!shouldAnimate()) {
    stopLoop()
    return
  }
  setAnimationActive(true)
  if (!rafId) rafId = requestAnimationFrame(tick)
}

function tick(): void {
  rafId = 0
  if (!shouldAnimate() || !ctx || !stageHost) {
    stopLoop()
    return
  }

  ctx.clearRect(0, 0, w, h)
  drawDither()

  const dt = 0.016
  for (const p of particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.y < -12 || p.x < -16) {
      p.x = w * (0.52 + Math.random() * 0.38)
      p.y = h * (0.62 + Math.random() * 0.3)
    }
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(210,198,188,${p.a})`
    ctx.fill()
  }

  rafId = requestAnimationFrame(tick)
}

function ensureCanvas(stage: HTMLElement): HTMLCanvasElement {
  let canvas = stage.querySelector('canvas.stage-fx') as HTMLCanvasElement | null
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.className = 'stage-fx'
    canvas.setAttribute('aria-hidden', 'true')
    stage.querySelector('.stage-bg')?.insertAdjacentElement('afterend', canvas)
  }
  return canvas
}

export function syncStageAtmosphere(stage: HTMLElement): void {
  if (!stageCanvas || stageHost !== stage) return
  const key = `${stage.dataset.scene ?? ''}|${stage.dataset.tier ?? ''}|${stage.dataset.phase ?? ''}`
  if (key === lastSceneKey) return
  lastSceneKey = key
  seedParticles(stage)
}

export function initStageAtmosphere(stage: HTMLElement): void {
  if (reducedMotion()) {
    stage.dataset.animationActive = '0'
    return
  }

  if (stageHost === stage && stageCanvas?.isConnected) {
    ensureLoop()
    return
  }

  running = false
  stopLoop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()

  stageHost = stage
  stageCanvas = ensureCanvas(stage)
  ctx = stageCanvas.getContext('2d')
  if (!ctx) return
  lastSceneKey = ''

  const host = atmosphereHost(stage)
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas(stage)
    seedParticles(stage)
  })
  resizeObserver.observe(host)

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      inView = !!entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.05
      ensureLoop()
    },
    { threshold: [0, 0.05, 0.2] },
  )
  intersectionObserver.observe(host)

  resizeCanvas(stage)
  seedParticles(stage)

  running = true
  inView = true
  ensureLoop()
}

export function initMotionGuard(root: HTMLElement): void {
  const apply = (): void => {
    const paused = document.hidden || reducedMotion()
    root.classList.toggle('motion-paused', paused)
    ensureLoop()
  }
  document.addEventListener('visibilitychange', apply)
  apply()
}

export function initUiPolish(root: HTMLElement): void {
  const stage = root.querySelector('.stage') as HTMLElement | null
  if (stage) initStageAtmosphere(stage)
  initMotionGuard(root)
}
