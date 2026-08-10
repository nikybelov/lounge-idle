/** Детект in-app браузеров (Telegram и т.п.) — у них свой storage, сейв пропадает. */

const SKIP_KEY = 'lounge-idle-skip-browser-gate'

export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || ''
  const w = window as Window & {
    TelegramWebviewProxy?: unknown
    Telegram?: { WebApp?: unknown }
  }

  if (w.TelegramWebviewProxy || w.Telegram?.WebApp) return true

  if (/Telegram/i.test(ua)) return true
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\/|VKAndroidApp|Twitter|TikTok/i.test(ua)) {
    return true
  }
  // iOS WKWebView часто без «Safari» в UA
  if (/iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true
  }
  // Android WebView
  if (/Android/i.test(ua) && (/; wv\)/i.test(ua) || /Version\/[\d.]+/i.test(ua) && !/Chrome\/[\d.]+ Mobile/i.test(ua))) {
    return /; wv\)/i.test(ua)
  }
  return false
}

function playUrl(): string {
  const u = new URL(location.href)
  u.searchParams.delete('reset')
  return u.toString()
}

function safariOpenUrl(): string {
  const u = new URL(playUrl())
  return `x-safari-https://${u.host}${u.pathname}${u.search}${u.hash}`
}

function chromeIntentUrl(): string {
  const u = new URL(playUrl())
  const path = `${u.host}${u.pathname}${u.search}${u.hash}`
  return `intent://${path}#Intent;scheme=https;package=com.android.chrome;end`
}

function isIos(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent || '')
}

export function shouldShowBrowserGate(): boolean {
  const params = new URLSearchParams(location.search)
  if (params.get('force_play') === '1') return false
  // Для теста в обычном Safari: ?gate=1
  if (params.get('gate') === '1') return true
  if (!isInAppBrowser()) return false
  try {
    if (sessionStorage.getItem(SKIP_KEY) === '1') return false
  } catch {
    /* ignore */
  }
  return true
}

/** Показать экран «открой в Safari» и дождаться решения игрока */
export function presentBrowserGate(root: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const ios = isIos()
    const android = isAndroid()
    const href = playUrl()

    root.innerHTML = `
      <div class="boot boot--browser-gate">
        <div class="boot-card gradient-surface boot-browser-gate-card">
          <p class="boot-brand">Открой в браузере</p>
          <p class="boot-sub boot-browser-gate-copy">
            Сейчас игра в приложении (Telegram и т.п.). Там прогресс часто
            <strong>сбрасывается</strong>. Нужен Safari или Chrome.
          </p>
          <ol class="boot-browser-gate-steps">
            ${
              ios
                ? `<li>Нажми <strong>⋯</strong> или «Поделиться»</li>
                   <li>Выбери <strong>Открыть в Safari</strong></li>`
                : android
                  ? `<li>Нажми меню <strong>⋮</strong></li>
                     <li>Выбери <strong>Открыть в Chrome</strong></li>`
                  : `<li>Открой ссылку в обычном браузере</li>`
            }
          </ol>
          <div class="boot-browser-gate-actions">
            <button type="button" class="boot-cta" data-gate-open>
              ${ios ? 'Открыть в Safari' : android ? 'Открыть в Chrome' : 'Открыть ссылку'}
            </button>
            <button type="button" class="text-btn" data-gate-copy>Скопировать ссылку</button>
            <button type="button" class="text-btn text-btn--muted" data-gate-skip>Всё равно играть здесь</button>
          </div>
          <p class="boot-browser-gate-hint" data-gate-hint hidden></p>
        </div>
      </div>
    `

    const hint = root.querySelector('[data-gate-hint]') as HTMLElement
    const showHint = (text: string) => {
      hint.hidden = false
      hint.textContent = text
    }

    root.querySelector('[data-gate-open]')?.addEventListener('click', () => {
      if (ios) {
        location.href = safariOpenUrl()
        window.setTimeout(() => showHint('Если не открылось: ⋯ → «Открыть в Safari»'), 800)
        return
      }
      if (android) {
        location.href = chromeIntentUrl()
        window.setTimeout(() => showHint('Если не открылось: ⋮ → «Открыть в браузере»'), 800)
        return
      }
      window.open(href, '_blank')
    })

    root.querySelector('[data-gate-copy]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(href)
        showHint('Ссылка скопирована — вставь в Safari')
      } catch {
        window.prompt('Скопируй ссылку:', href)
      }
    })

    root.querySelector('[data-gate-skip]')?.addEventListener('click', () => {
      try {
        sessionStorage.setItem(SKIP_KEY, '1')
      } catch {
        /* ignore */
      }
      resolve()
    })
  })
}
