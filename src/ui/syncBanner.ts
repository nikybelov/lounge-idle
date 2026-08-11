/** Заметный баннер синка — не зависит от shell/toast внутри stage. */

export function showSyncBanner(message: string, ms = 6500): void {
  const prev = document.querySelectorAll('.tg-sync-banner')
  prev.forEach((n) => n.remove())

  const el = document.createElement('div')
  el.className = 'tg-sync-banner'
  el.setAttribute('role', 'status')
  el.innerHTML = `<strong>Синк</strong><span>${escapeHtml(message)}</span>`
  document.body.appendChild(el)
  requestAnimationFrame(() => {
    el.classList.add('tg-sync-banner--show')
  })
  window.setTimeout(() => {
    el.classList.remove('tg-sync-banner--show')
    window.setTimeout(() => el.remove(), 350)
  }, ms)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
