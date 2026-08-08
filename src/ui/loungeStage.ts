import { hiredStaffCount } from '../game/staff'
import type { GameState } from '../game/state'

function tableSvg(x: number, w: number, h: number, glow: number): string {
  const stroke = glow > 0 ? `rgba(224,122,58,${0.15 + glow * 0.25})` : 'rgba(255,255,255,0.06)'
  return `
    <rect x="${x}" y="${72 - h}" width="${w}" height="${h}" rx="2" fill="rgba(52,38,30,0.95)" stroke="${stroke}"/>
    <rect x="${x + w * 0.35}" y="${72 - h - 14}" width="${w * 0.3}" height="12" rx="2" fill="rgba(75,52,40,0.9)"/>
  `
}

function sofaSvg(x: number, glow: number): string {
  const stroke = glow > 0 ? `rgba(212,165,116,${0.2 + glow * 0.3})` : 'rgba(255,255,255,0.08)'
  return `
    <rect x="${x}" y="58" width="38" height="16" rx="3" fill="rgba(68,48,36,0.95)" stroke="${stroke}"/>
    <path d="M${x + 4} 58 V52 a4 4 0 0 1 8 0 v6 M${x + 26} 58 V52 a4 4 0 0 1 8 0 v6" fill="rgba(58,42,32,0.95)" stroke="${stroke}"/>
  `
}

export function renderLoungeStageSvg(state: GameState): string {
  const tables = state.owned.table
  const sofas = state.owned.sofa
  const menu = state.owned.menu
  const hood = state.owned.hood
  const vip = state.owned.vip
  const staff = hiredStaffCount(state)
  const tier = state.loungeTier ?? 'nook'

  const tableSlots = Math.min(5, tables)
  const sofaSlots = Math.min(3, sofas)
  let furniture = ''
  for (let i = 0; i < tableSlots; i++) {
    furniture += tableSvg(28 + i * 34, 26, 18, i === tableSlots - 1 ? 0.6 : 0.2)
  }
  for (let i = 0; i < sofaSlots; i++) {
    furniture += sofaSvg(30 + i * 44, i === sofaSlots - 1 ? 0.5 : 0.15)
  }

  const emptyFloor =
    tableSlots === 0 && sofaSlots === 0
      ? `<rect x="28" y="56" width="164" height="16" rx="2" fill="none" stroke="rgba(212,165,116,0.16)" stroke-dasharray="5 4"/>
         <text x="110" y="67" text-anchor="middle" fill="rgba(212,165,116,0.35)" font-size="7" font-family="system-ui,sans-serif">купи стол в «Свой зал»</text>`
      : ''

  const shelfRows = menu > 0 ? Math.min(4, menu + 1) : 0
  let shelf = ''
  for (let i = 0; i < shelfRows; i++) {
    const colors = ['rgba(224,122,58,0.5)', 'rgba(90,160,180,0.45)', 'rgba(212,165,116,0.5)', 'rgba(180,120,200,0.4)']
    shelf += `<rect x="${168 + i * 9}" y="${36 - i * 2}" width="7" height="3" rx="1" fill="${colors[i % colors.length]}"/>`
  }

  const hoodGlow = hood > 0 ? `<rect x="152" y="18" width="8" height="18" rx="1" fill="rgba(224,122,58,0.55)" opacity="${0.4 + hood * 0.15}"/>` : ''
  const vipStar =
    vip > 0
      ? `<path d="M186 28 l2 4 4.5.7-3.2 3.2.8 4.5-4.1-2.2-4.1 2.2.8-4.5-3.2-3.2 4.5-.7z" fill="rgba(230,196,154,0.85)"/>`
      : ''

  const staffDots =
    staff > 0
      ? Array.from({ length: Math.min(staff, 8) }, (_, i) => {
          const cx = 42 + i * 14
          return `<circle cx="${cx}" cy="44" r="3.5" fill="rgba(240,160,90,0.75)"/><path d="M${cx - 5} 54 Q${cx} 48 ${cx + 5} 54" stroke="rgba(240,160,90,0.5)" fill="none"/>`
        }).join('')
      : ''

  const tierAccent =
    tier === 'signature'
      ? '<rect x="18" y="28" width="184" height="2" rx="1" fill="rgba(230,196,154,0.35)"/>'
      : tier === 'hall'
        ? '<rect x="24" y="30" width="172" height="1" rx="1" fill="rgba(224,122,58,0.25)"/>'
        : ''

  const smokeOpacity = 0.35 + Math.min(0.45, tables * 0.06 + sofas * 0.08 + staff * 0.05)

  return `
    <svg class="stage-svg stage-svg--lounge stage-svg--live" viewBox="0 0 220 110" fill="none">
      <defs>
        <radialGradient id="loungeGlowLive" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(240,160,90,0.65)"/>
          <stop offset="100%" stop-color="rgba(224,122,58,0.08)"/>
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="100" rx="92" ry="9" fill="rgba(0,0,0,0.52)"/>
      <path d="M16 74 L16 38 L44 26 L176 26 L204 38 L204 74 Z" fill="rgba(38,26,20,0.94)" stroke="rgba(212,165,116,0.2)"/>
      ${tierAccent}
      ${emptyFloor}
      ${furniture}
      ${shelf}
      <path d="M108 26 Q108 10 116 4 Q124 -2 132 6" stroke="rgba(210,200,190,0.5)" stroke-width="2.8" stroke-linecap="round" opacity="${smokeOpacity}"/>
      <circle cx="132" cy="6" r="7" fill="url(#loungeGlowLive)"/>
      <circle cx="132" cy="6" r="14" fill="rgba(224,122,58,0.12)"/>
      ${hoodGlow}
      ${vipStar}
      ${staffDots}
      ${menu > 0 ? `<rect x="160" y="32" width="22" height="14" rx="1" fill="rgba(42,32,26,0.9)" stroke="rgba(212,165,116,0.15)"/>` : ''}
    </svg>
  `
}

export function shouldShowLiveLoungeStage(state: GameState): boolean {
  return state.scene === 'lounge' && state.phase !== 'employed'
}

export function updateLoungeStageArt(root: HTMLElement, state: GameState): void {
  const stage = root.querySelector('.stage') as HTMLElement | null
  const art = root.querySelector('.stage-art') as HTMLElement | null
  if (!art) return

  const showLive = shouldShowLiveLoungeStage(state)
  if (stage) {
    if (showLive) stage.dataset.loungeLive = '1'
    else delete stage.dataset.loungeLive
  }

  const live = art.querySelector('.stage-svg--live') as SVGSVGElement | null
  if (!showLive) {
    live?.remove()
    art.dataset.live = '0'
    return
  }

  art.dataset.live = '1'
  const html = renderLoungeStageSvg(state)
  if (live) {
    live.outerHTML = html.trim()
  } else {
    art.insertAdjacentHTML('beforeend', html)
  }
}
