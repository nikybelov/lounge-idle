/** Какая сборка/среда запущена: веб или Telegram Mini App. */

export type AppFlavor = 'web' | 'telegram'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export interface TelegramThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
  bottom_bar_bg_color?: string
}

export interface TelegramSafeAreaInset {
  top: number
  bottom: number
  left: number
  right: number
}

export interface TelegramBackButton {
  isVisible: boolean
  onClick: (cb: () => void) => void
  offClick: (cb: () => void) => void
  show: () => void
  hide: () => void
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe?: {
    user?: {
      id?: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
      is_premium?: boolean
    }
    start_param?: string
  }
  version?: string
  platform?: string
  colorScheme?: 'light' | 'dark'
  themeParams?: TelegramThemeParams
  viewportHeight?: number
  viewportStableHeight?: number
  isExpanded?: boolean
  safeAreaInset?: TelegramSafeAreaInset
  contentSafeAreaInset?: TelegramSafeAreaInset
  BackButton?: TelegramBackButton
  ready: () => void
  expand: () => void
  close?: () => void
  enableClosingConfirmation?: () => void
  disableClosingConfirmation?: () => void
  disableVerticalSwipes?: () => void
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  isVersionAtLeast?: (version: string) => boolean
  onEvent?: (event: string, cb: (...args: unknown[]) => void) => void
  offEvent?: (event: string, cb: (...args: unknown[]) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
  }
}

const FLAVOR_QUERY = 'flavor'

export function getTelegramWebApp(): TelegramWebApp | null {
  try {
    return window.Telegram?.WebApp ?? null
  } catch {
    return null
  }
}

/**
 * Mini App только если:
 * - явный тест (?tg=1 / flavor=telegram / VITE_FLAVOR), или
 * - есть initData от Telegram (официальный запуск из бота).
 * Не считаем Mini App просто из-за подключённого telegram-web-app.js на вебе.
 */
export function isTelegramMiniApp(): boolean {
  const params = new URLSearchParams(location.search)
  if (params.get(FLAVOR_QUERY) === 'telegram' || params.get('tg') === '1') {
    return true
  }
  if (import.meta.env.VITE_FLAVOR === 'telegram') return true
  const wa = getTelegramWebApp()
  if (!wa) return false
  return typeof wa.initData === 'string' && wa.initData.length > 0
}

export function detectAppFlavor(): AppFlavor {
  return isTelegramMiniApp() ? 'telegram' : 'web'
}

/** Суффикс ключей localStorage — сейвы веб и TG не смешиваются. */
export function storageKey(base: string): string {
  return detectAppFlavor() === 'telegram' ? `${base}-tg` : base
}

export function appFlavorLabel(): string {
  return detectAppFlavor() === 'telegram' ? 'Telegram' : 'Веб'
}

export function appBuildLabel(): string {
  const ver = import.meta.env.VITE_APP_VERSION || '0.2.0'
  return detectAppFlavor() === 'telegram'
    ? `Дымная Империя · TG ${ver}`
    : `Дымная Империя · ${ver}`
}

/** Имя из профиля Telegram для префилла договора (только UI, без отправки на сервер). */
export function telegramSuggestedName(): string {
  const user = getTelegramWebApp()?.initDataUnsafe?.user
  const name = user?.first_name?.trim()
  return name && name.length >= 2 ? name.slice(0, 24) : ''
}
