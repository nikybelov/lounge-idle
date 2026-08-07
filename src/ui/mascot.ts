/** Маскот — Огонёк (живое пламя). */
export const MASCOT_NAME = 'Огонёк'

export type MascotPose = 'idle' | 'wave' | 'point' | 'happy' | 'sit'

export type MascotSlot =
  | 'above-left'
  | 'above-right'
  | 'below-left'
  | 'below-right'
  | 'side-left'
  | 'side-right'
  | 'center'

let mascotRenderSeq = 0

function nextMascotUid(): string {
  mascotRenderSeq += 1
  return `flame-${mascotRenderSeq}`
}

function mascotFace(pose: MascotPose): string {
  if (pose === 'happy') {
    return `
      <path class="mascot-brow" d="M30 50 Q34 47 38 50" stroke="#5a2010" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/>
      <path class="mascot-brow" d="M42 50 Q46 47 50 50" stroke="#5a2010" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.55"/>
      <path class="mascot-eye-happy" d="M30 54 Q34 58 38 54" stroke="#3d1508" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path class="mascot-eye-happy" d="M42 54 Q46 58 50 54" stroke="#3d1508" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path class="mascot-smile mascot-smile--wide" d="M32 62 Q40 69 48 62" stroke="#3d1508" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `
  }

  return `
    <ellipse class="mascot-eye-white" cx="34" cy="56" rx="4.8" ry="5.4"/>
    <ellipse class="mascot-eye-white" cx="46" cy="56" rx="4.8" ry="5.4"/>
    <ellipse class="mascot-eye-pupil" cx="34.5" cy="57" rx="2.6" ry="3.2"/>
    <ellipse class="mascot-eye-pupil" cx="46.5" cy="57" rx="2.6" ry="3.2"/>
    <circle class="mascot-eye-shine" cx="35.5" cy="55" r="1.2" fill="#fff"/>
    <circle class="mascot-eye-shine" cx="47.5" cy="55" r="1.2" fill="#fff"/>
    <path class="mascot-smile" d="M33 63 Q40 67 47 63" stroke="#3d1508" stroke-width="2" fill="none" stroke-linecap="round"/>
  `
}

function mascotArms(pose: MascotPose, uid: string): string {
  if (pose === 'wave') {
    return `
      <g class="mascot-arm mascot-arm--wave">
        <path d="M14 52 C6 46 4 36 10 28" stroke="url(#${uid}-arm)" stroke-width="4" fill="none" stroke-linecap="round"/>
        <circle cx="10" cy="27" r="5" fill="#ffe8c8" opacity="0.95"/>
      </g>
    `
  }
  if (pose === 'point') {
    return `
      <g class="mascot-arm mascot-arm--point">
        <path d="M62 50 C70 44 74 34 68 26" stroke="url(#${uid}-arm)" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M68 26 L76 22 L70 30 Z" fill="#ffe8c8"/>
      </g>
    `
  }
  if (pose === 'sit') {
    return `
      <g class="mascot-legs">
        <path class="mascot-leg mascot-leg--l" d="M34 76 Q30 84 28 90" stroke="url(#${uid}-arm)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path class="mascot-leg mascot-leg--r" d="M46 76 Q50 84 52 90" stroke="url(#${uid}-arm)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <ellipse class="mascot-foot mascot-foot--l" cx="28" cy="90" rx="4" ry="2.5" fill="#ff9a2e"/>
        <ellipse class="mascot-foot mascot-foot--r" cx="52" cy="90" rx="4" ry="2.5" fill="#ff9a2e"/>
      </g>
    `
  }
  return ''
}

export function mascotSvg(pose: MascotPose = 'idle'): string {
  const uid = nextMascotUid()

  return `
    <svg class="mascot-svg" viewBox="0 0 80 92" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="${uid}-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff9040" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ff9040" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${uid}-outer" x1="40" y1="6" x2="40" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fffef5"/>
          <stop offset="18%" stop-color="#ffe566"/>
          <stop offset="42%" stop-color="#ff9a2e"/>
          <stop offset="72%" stop-color="#ff5c1a"/>
          <stop offset="100%" stop-color="#c42808"/>
        </linearGradient>
        <linearGradient id="${uid}-mid" x1="40" y1="14" x2="40" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fffef0"/>
          <stop offset="35%" stop-color="#ffd54a"/>
          <stop offset="70%" stop-color="#ff8c2a" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#ff5c1a" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${uid}-core" x1="40" y1="22" x2="40" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="45%" stop-color="#fff4a8"/>
          <stop offset="100%" stop-color="#ffc04a" stop-opacity="0.35"/>
        </linearGradient>
        <linearGradient id="${uid}-arm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffd54a"/>
          <stop offset="100%" stop-color="#ff6a1a"/>
        </linearGradient>
        <filter id="${uid}-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      <ellipse class="mascot-floor-glow" cx="40" cy="82" rx="24" ry="8" fill="url(#${uid}-floor)" filter="url(#${uid}-blur)"/>

      <g class="mascot-fire-body">
        <!-- fire emoji silhouette -->
        <path class="mascot-shell mascot-shell--back"
          d="M40 8
             C48 16 54 26 52 36
             C58 30 62 38 58 46
             C64 42 66 52 60 58
             C66 62 62 72 52 76
             C48 80 40 82 40 82
             C40 82 32 80 28 76
             C18 72 14 62 20 58
             C14 52 16 42 22 46
             C18 38 22 30 28 36
             C26 26 32 16 40 8Z"
          fill="url(#${uid}-outer)"/>
        <path class="mascot-shell mascot-shell--mid"
          d="M40 18
             C46 24 50 32 48 40
             C52 36 54 44 50 50
             C54 54 50 64 40 68
             C30 64 26 54 30 50
             C26 44 28 36 32 40
             C30 32 34 24 40 18Z"
          fill="url(#${uid}-mid)"/>
        <ellipse class="mascot-shell mascot-shell--core" cx="40" cy="46" rx="14" ry="18" fill="url(#${uid}-core)"/>
        <!-- tongue tips -->
        <path class="mascot-tip mascot-tip--l"
          d="M26 34 C22 28 24 20 28 24 C24 30 26 36 26 34Z"
          fill="#ff9a2e" opacity="0.7"/>
        <path class="mascot-tip mascot-tip--r"
          d="M54 34 C58 28 56 20 52 24 C56 30 54 36 54 34Z"
          fill="#ff9a2e" opacity="0.7"/>
        <path class="mascot-tip mascot-tip--c"
          d="M40 10 C44 16 44 22 40 26 C36 22 36 16 40 10Z"
          fill="#fffef5" opacity="0.9"/>
      </g>

      <g class="mascot-face">${mascotFace(pose)}</g>
      ${mascotArms(pose, uid)}
    </svg>
  `
}

export function mascotBubbleHtml(opts: {
  title: string
  body: string
  cta: string
  pose?: MascotPose
  compact?: boolean
}): string {
  const pose = opts.pose ?? 'wave'
  return `
    <div class="mascot-bubble ${opts.compact ? 'mascot-bubble--compact' : ''}">
      <div class="mascot-figure mascot-figure--${pose}">${mascotSvg(pose)}</div>
      <div class="mascot-speech">
        <p class="mascot-speech-title">${opts.title}</p>
        <p class="mascot-speech-body">${opts.body}</p>
        <button type="button" class="boot-cta mascot-speech-btn" data-mascot-ok>${opts.cta}</button>
      </div>
    </div>
  `
}

/** Слот маскота относительно карточки подсказки — чередуем по ключу шага. */
export function pickMascotSlot(stepKey: string, cardPlacement: string): MascotSlot {
  const slots: MascotSlot[] = [
    'above-left',
    'above-right',
    'below-left',
    'side-right',
    'side-left',
    'below-right',
  ]
  let hash = 0
  for (let i = 0; i < stepKey.length; i++) {
    hash = (hash + stepKey.charCodeAt(i) * (i + 1)) % 997
  }

  if (cardPlacement === 'above') {
    return hash % 2 === 0 ? 'below-left' : 'below-right'
  }
  if (cardPlacement === 'below') {
    return slots[hash % 3]!
  }
  if (cardPlacement === 'left') {
    return 'side-right'
  }
  if (cardPlacement === 'right') {
    return 'side-left'
  }
  return slots[hash % slots.length]!
}

export function showMascotWelcome(root: HTMLElement, onContinue: () => void): void {
  root.innerHTML = `
    <div class="boot boot--welcome">
      <div class="mascot-welcome-overlay">
        ${mascotBubbleHtml({
          title: `Привет! Я ${MASCOT_NAME}`,
          body:
            'Добро пожаловать в «Дымную Империю». Подпиши договор об устройстве на работу — и пойдём на первую смену.',
          cta: 'Понятно, к договору',
          pose: 'wave',
        })}
      </div>
    </div>
  `

  root.querySelector('[data-mascot-ok]')!.addEventListener('click', () => {
    onContinue()
  })
}
