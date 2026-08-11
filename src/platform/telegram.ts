import {
  detectAppFlavor,
  getTelegramWebApp,
  type TelegramWebApp,
} from './runtime'

let prepared: TelegramWebApp | null = null

/** Готовит Telegram WebApp: expand, цвета, без свайпа закрытия по возможности. */
export function prepareTelegramMiniApp(): TelegramWebApp | null {
  if (detectAppFlavor() !== 'telegram') return null
  const wa = getTelegramWebApp()
  if (!wa) return null
  if (prepared === wa) return wa

  try {
    wa.ready()
    wa.expand()
    wa.setHeaderColor?.('#0e0b08')
    wa.setBackgroundColor?.('#0e0b08')
    wa.disableVerticalSwipes?.()
    wa.enableClosingConfirmation?.()
    document.documentElement.dataset.flavor = 'telegram'
    document.body.classList.add('flavor-telegram')
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
