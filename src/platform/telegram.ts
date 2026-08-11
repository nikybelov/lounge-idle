import {
  detectAppFlavor,
  getTelegramWebApp,
  type TelegramWebApp,
} from './runtime'

let prepared: TelegramWebApp | null = null
let backHandler: (() => void) | null = null

const BRAND_BG = '#0e0b08'
const BRAND_HEADER = '#0e0b08'

function applyThemeCss(wa: TelegramWebApp): void {
  const root = document.documentElement
  const tp = wa.themeParams ?? {}
  const bg = tp.bg_color || tp.secondary_bg_color || BRAND_BG
  const text = tp.text_color || '#f3e8d8'
  const button = tp.button_color || '#c4a574'
  const hint = tp.hint_color || '#a89880'

  root.style.setProperty('--tg-theme-bg-color', bg)
  root.style.setProperty('--tg-theme-text-color', text)
  root.style.setProperty('--tg-theme-button-color', button)
  root.style.setProperty('--tg-theme-hint-color', hint)
  if (tp.secondary_bg_color) {
    root.style.setProperty('--tg-theme-secondary-bg-color', tp.secondary_bg_color)
  }
}

function applyViewportCss(wa: TelegramWebApp): void {
  const root = document.documentElement
  const h = wa.viewportStableHeight || wa.viewportHeight
  if (typeof h === 'number' && h > 0) {
    root.style.setProperty('--tg-viewport-stable-height', `${h}px`)
    root.style.setProperty('--tg-viewport-height', `${wa.viewportHeight ?? h}px`)
  }
  const safe = wa.safeAreaInset
  if (safe) {
    root.style.setProperty('--tg-safe-area-inset-top', `${safe.top}px`)
    root.style.setProperty('--tg-safe-area-inset-bottom', `${safe.bottom}px`)
    root.style.setProperty('--tg-safe-area-inset-left', `${safe.left}px`)
    root.style.setProperty('--tg-safe-area-inset-right', `${safe.right}px`)
  }
  const content = wa.contentSafeAreaInset
  if (content) {
    root.style.setProperty('--tg-content-safe-area-inset-top', `${content.top}px`)
    root.style.setProperty(
      '--tg-content-safe-area-inset-bottom',
      `${content.bottom}px`,
    )
  }
}

function syncChrome(wa: TelegramWebApp): void {
  applyThemeCss(wa)
  applyViewportCss(wa)
  const bg = wa.themeParams?.bg_color || BRAND_BG
  const header = wa.themeParams?.header_bg_color || wa.themeParams?.secondary_bg_color || BRAND_HEADER
  try {
    wa.setHeaderColor?.(header)
    wa.setBackgroundColor?.(bg)
  } catch {
    try {
      wa.setHeaderColor?.(BRAND_HEADER)
      wa.setBackgroundColor?.(BRAND_BG)
    } catch {
      /* older clients */
    }
  }
}

/**
 * Готовит Mini App по гайдам Telegram:
 * ready → expand → тема/viewport CSS → safe area → closing confirm.
 * Fullscreen для игры (Bot API 8+), если клиент умеет.
 */
export function prepareTelegramMiniApp(): TelegramWebApp | null {
  if (detectAppFlavor() !== 'telegram') return null
  const wa = getTelegramWebApp()
  if (!wa) return null
  if (prepared === wa) {
    syncChrome(wa)
    return wa
  }

  try {
    wa.ready()
    wa.expand()
    syncChrome(wa)
    wa.disableVerticalSwipes?.()
    wa.enableClosingConfirmation?.()

    if (wa.isVersionAtLeast?.('8.0') && typeof wa.requestFullscreen === 'function') {
      try {
        wa.requestFullscreen()
      } catch {
        /* пользователь/клиент может отказать */
      }
    }

    const onViewport = (): void => applyViewportCss(wa)
    const onTheme = (): void => syncChrome(wa)
    wa.onEvent?.('viewportChanged', onViewport)
    wa.onEvent?.('themeChanged', onTheme)
    wa.onEvent?.('safeAreaChanged', onViewport)
    wa.onEvent?.('contentSafeAreaChanged', onViewport)

    document.documentElement.dataset.flavor = 'telegram'
    document.body.classList.add('flavor-telegram')
    if (wa.colorScheme === 'light') {
      document.body.classList.add('flavor-telegram--light')
    }
  } catch (err) {
    console.warn('[telegram] prepare failed', err)
  }

  prepared = wa
  return wa
}

export function telegramHapticLight(): void {
  try {
    prepared?.HapticFeedback?.impactOccurred('light')
  } catch {
    /* ignore */
  }
}

export function telegramHapticSuccess(): void {
  try {
    prepared?.HapticFeedback?.notificationOccurred?.('success')
  } catch {
    /* ignore */
  }
}

/** Показать системную BackButton Telegram и вызвать handler. */
export function setTelegramBackHandler(handler: (() => void) | null): void {
  const wa = prepared ?? getTelegramWebApp()
  const btn = wa?.BackButton
  if (!btn) return

  if (backHandler) {
    try {
      btn.offClick(backHandler)
    } catch {
      /* ignore */
    }
    backHandler = null
  }

  if (!handler) {
    btn.hide()
    return
  }

  backHandler = handler
  btn.onClick(handler)
  btn.show()
}

export function hideTelegramBackButton(): void {
  setTelegramBackHandler(null)
}
