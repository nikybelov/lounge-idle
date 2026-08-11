/** Детект in-app браузеров (Telegram и т.п.) — у них свой storage, сейв пропадает. */

import { MASCOT_NAME, mascotSvg } from './mascot'

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

/** Ссылка для Safari/Chrome без тестовых параметров gate */
function playUrl(): string {
  const u = new URL(location.href)
  for (const key of ['reset', 'gate', 'force_play', 'design', 'v', 't']) {
    u.searchParams.delete(key)
  }
  return u.toString()
}

function safariOpenUrl(): string {
  const u = new URL(playUrl())
  // x-safari работает только с https; на localhost оставляем обычный URL
  if (u.protocol !== 'https:') return u.toString()
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

function markSkip(): void {
  try {
    sessionStorage.setItem(SKIP_KEY, '1')
  } catch {
    /* ignore */
  }
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
    const inApp = isInAppBrowser()
    const previewOnly = !inApp
    const href = playUrl()
    const browserName = ios ? 'Safari' : android ? 'Chrome' : 'браузере'
    const openLabel = previewOnly
      ? 'Продолжить'
      : ios
        ? 'Открыть в Safari'
        : android
          ? 'Открыть в Chrome'
          : 'Открыть ссылку'
    const steps = previewOnly
      ? `<li><span class="boot-browser-gate-step-n">1</span><span>Это превью gate — ты уже в обычном браузере</span></li>
         <li><span class="boot-browser-gate-step-n">2</span><span>Жми <strong>Продолжить</strong>, чтобы войти в игру</span></li>`
      : ios
        ? `<li><span class="boot-browser-gate-step-n">1</span><span>Нажми <strong>⋯</strong> или «Поделиться»</span></li>
           <li><span class="boot-browser-gate-step-n">2</span><span>Выбери <strong>Открыть в Safari</strong></span></li>`
        : android
          ? `<li><span class="boot-browser-gate-step-n">1</span><span>Нажми меню <strong>⋮</strong></span></li>
             <li><span class="boot-browser-gate-step-n">2</span><span>Выбери <strong>Открыть в Chrome</strong></span></li>`
          : `<li><span class="boot-browser-gate-step-n">1</span><span>Открой ссылку в обычном браузере</span></li>`

    root.innerHTML = `
      <div class="boot boot--browser-gate">
        <div class="boot-browser-gate-ambience" aria-hidden="true">
          <span class="boot-load-haze boot-load-haze--1"></span>
          <span class="boot-load-haze boot-load-haze--2"></span>
          <span class="boot-browser-gate-ember boot-browser-gate-ember--1"></span>
          <span class="boot-browser-gate-ember boot-browser-gate-ember--2"></span>
          <span class="boot-browser-gate-ember boot-browser-gate-ember--3"></span>
        </div>
        <div class="boot-card gradient-surface boot-browser-gate-card">
          <div class="boot-browser-gate-hero">
            <div class="mascot-figure mascot-figure--wave boot-browser-gate-mascot" aria-hidden="true">
              ${mascotSvg('wave')}
            </div>
            <p class="boot-browser-gate-brand">Дымная Империя</p>
            <p class="boot-brand boot-browser-gate-title">Открой в ${browserName}</p>
            <p class="boot-browser-gate-copy">
              ${MASCOT_NAME} шепчет: в Telegram и других приложениях прогресс часто
              <strong>сбрасывается</strong>. Сохрани кассу — зайди через Safari или Chrome.
            </p>
          </div>
          <p class="boot-browser-gate-badge">Прогресс сохранится в обычном браузере</p>
          <ol class="boot-browser-gate-steps">${steps}</ol>
          <div class="boot-browser-gate-actions">
            <button type="button" class="boot-cta" data-gate-open>${openLabel}</button>
            <button type="button" class="boot-browser-gate-secondary" data-gate-copy>Скопировать ссылку</button>
            <button type="button" class="text-btn text-btn--muted boot-browser-gate-skip" data-gate-skip>Всё равно играть здесь</button>
          </div>
          <p class="boot-browser-gate-hint" data-gate-hint hidden></p>
        </div>
      </div>
    `

    requestAnimationFrame(() => {
      root.querySelector('.boot--browser-gate')?.classList.add('boot-browser-gate-in')
    })

    const hint = root.querySelector('[data-gate-hint]') as HTMLElement
    const showHint = (text: string) => {
      hint.hidden = false
      hint.textContent = text
    }

    const enterGame = () => {
      markSkip()
      const clean = playUrl()
      if (clean !== location.href) {
        history.replaceState(null, '', clean)
      }
      resolve()
    }

    root.querySelector('[data-gate-open]')?.addEventListener('click', async () => {
      // Превью ?gate=1 в обычном браузере: некуда «открывать» — входим в игру
      if (previewOnly) {
        showHint('Ты уже в браузере — заходим')
        window.setTimeout(enterGame, 280)
        return
      }

      if (ios) {
        showHint('Пробую открыть Safari…')
        location.href = safariOpenUrl()
        window.setTimeout(() => showHint('Если не открылось: ⋯ → «Открыть в Safari»'), 900)
        return
      }

      if (android) {
        showHint('Пробую открыть Chrome…')
        location.href = chromeIntentUrl()
        window.setTimeout(() => showHint('Если не открылось: ⋮ → «Открыть в браузере»'), 900)
        return
      }

      const opened = window.open(href, '_blank', 'noopener,noreferrer')
      if (opened) {
        showHint('Открыл новую вкладку')
        return
      }

      try {
        await navigator.clipboard.writeText(href)
        showHint('Вкладку заблокировали. Ссылка скопирована — вставь в браузер')
      } catch {
        showHint('Не удалось открыть. Нажми «Скопировать ссылку»')
      }
    })

    root.querySelector('[data-gate-copy]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(href)
        showHint(ios ? 'Ссылка скопирована — вставь в Safari' : 'Ссылка скопирована')
      } catch {
        window.prompt('Скопируй ссылку:', href)
      }
    })

    root.querySelector('[data-gate-skip]')?.addEventListener('click', () => {
      enterGame()
    })
  })
}
