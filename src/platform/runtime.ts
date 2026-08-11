/** Какая сборка/среда запущена: веб или Telegram Mini App. */

export type AppFlavor = 'web' | 'telegram'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

/** Минимальный тип Telegram WebApp — без полной зависимости от @twa-dev/types */
export interface TelegramWebApp {
  initData: string
  initDataUnsafe?: {
    user?: { id?: number; first_name?: string; username?: string }
  }
  version?: string
  platform?: string
  colorScheme?: 'light' | 'dark'
  ready: () => void
  expand: () => void
  enableClosingConfirmation?: () => void
  disableVerticalSwipes?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  themeParams?: Record<string, string>
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
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

/** Настоящий Mini App: есть initData от Telegram (или явный ?flavor=telegram для теста). */
export function isTelegramMiniApp(): boolean {
  const params = new URLSearchParams(location.search)
  if (params.get(FLAVOR_QUERY) === 'telegram' || params.get('tg') === '1') {
    return true
  }
  if (import.meta.env.VITE_FLAVOR === 'telegram') return true
  const wa = getTelegramWebApp()
  if (!wa) return false
  if (typeof wa.initData === 'string' && wa.initData.length > 0) return true
  // Некоторые клиенты отдают platform даже с пустым initData в preview
  if (wa.platform && wa.platform !== 'unknown') return true
  return false
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
