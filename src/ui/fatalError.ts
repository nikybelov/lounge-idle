/** Экран вместо чёрного `#app`, если загрузка или тик упали. */

declare global {
  interface Window {
    __loungeShowFatal?: (err: unknown, where?: string) => void
  }
}

export function showFatalError(err: unknown, where = 'загрузке'): void {
  if (typeof window.__loungeShowFatal === 'function') {
    window.__loungeShowFatal(err, where)
    return
  }
  const app = document.getElementById('app')
  if (!app || app.getAttribute('data-fatal') === '1') return
  app.setAttribute('data-fatal', '1')
  const detail =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : 'неизвестная ошибка'
  app.textContent = `Дымная Империя — ошибка при ${where}: ${detail}`
}
