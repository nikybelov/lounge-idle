/** Модалки переноса сейва телефон ↔ Mac (без зависимости от clipboard API). */

import { encodeSaveTransfer, decodeSaveTransfer } from '../save/transfer'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tryExecCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  } catch {
    return false
  }
}

/** Показать код сейва: зажать → копировать → отправить себе в Избранное. */
export function presentSaveExportModal(
  root: HTMLElement,
  rawJson: string,
): Promise<void> {
  const code = encodeSaveTransfer(rawJson)
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'save-transfer-overlay'
    overlay.innerHTML = `
      <div class="save-transfer-card" role="dialog" aria-modal="true" aria-labelledby="save-export-title">
        <h2 id="save-export-title" class="save-transfer-title">Код прогресса</h2>
        <ol class="save-transfer-steps">
          <li>Зажми поле ниже → <strong>Скопировать</strong></li>
          <li>Отправь код себе в <strong>Избранное</strong> в Telegram</li>
          <li>На Mac открой Избранное → скопируй код → в игре «Вставить прогресс»</li>
        </ol>
        <textarea class="save-transfer-code" readonly rows="6" data-save-code>${escapeHtml(code)}</textarea>
        <div class="save-transfer-actions">
          <button type="button" class="save-transfer-btn" data-save-select>Выделить код</button>
          <button type="button" class="save-transfer-btn save-transfer-btn--primary" data-save-try-copy>Попробовать копировать</button>
          <button type="button" class="save-transfer-btn save-transfer-btn--ghost" data-save-done>Готово</button>
        </div>
        <p class="save-transfer-hint" data-save-hint></p>
      </div>
    `
    root.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('visible'))

    const ta = overlay.querySelector('[data-save-code]') as HTMLTextAreaElement
    const hint = overlay.querySelector('[data-save-hint]') as HTMLElement
    const finish = (): void => {
      overlay.classList.remove('visible')
      window.setTimeout(() => {
        overlay.remove()
        resolve()
      }, 200)
    }

    overlay.querySelector('[data-save-select]')?.addEventListener('click', () => {
      ta.focus()
      ta.select()
      hint.textContent = 'Код выделен — зажми → Скопировать'
    })

    overlay.querySelector('[data-save-try-copy]')?.addEventListener('click', () => {
      void (async () => {
        let ok = false
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code)
            ok = true
          }
        } catch {
          /* ignore */
        }
        if (!ok) ok = tryExecCopy(code)
        ta.focus()
        ta.select()
        hint.textContent = ok
          ? 'Скопировано! Вставь себе в Избранное в Telegram'
          : 'Автокопирование запрещено — зажми код пальцем → Скопировать'
      })()
    })

    overlay.querySelector('[data-save-done]')?.addEventListener('click', finish)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish()
    })

    ta.focus()
    ta.select()
  })
}

/** Вставить код с телефона (через Избранное). */
export function presentSaveImportModal(
  root: HTMLElement,
): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'save-transfer-overlay'
    overlay.innerHTML = `
      <div class="save-transfer-card" role="dialog" aria-modal="true" aria-labelledby="save-import-title">
        <h2 id="save-import-title" class="save-transfer-title">Вставить прогресс</h2>
        <ol class="save-transfer-steps">
          <li>На Mac открой <strong>Избранное</strong> в Telegram</li>
          <li>Скопируй сообщение с кодом <code>DI_SAVE_v1:</code>…</li>
          <li>Вставь сюда и нажми «Применить»</li>
        </ol>
        <textarea class="save-transfer-code" rows="6" placeholder="Вставь сюда код DI_SAVE_v1:..." data-save-paste></textarea>
        <div class="save-transfer-actions">
          <button type="button" class="save-transfer-btn save-transfer-btn--primary" data-save-apply>Применить</button>
          <button type="button" class="save-transfer-btn save-transfer-btn--ghost" data-save-cancel>Отмена</button>
        </div>
        <p class="save-transfer-hint" data-save-hint></p>
      </div>
    `
    root.appendChild(overlay)
    requestAnimationFrame(() => overlay.classList.add('visible'))

    const ta = overlay.querySelector('[data-save-paste]') as HTMLTextAreaElement
    const hint = overlay.querySelector('[data-save-hint]') as HTMLElement

    const finish = (raw: string | null): void => {
      overlay.classList.remove('visible')
      window.setTimeout(() => {
        overlay.remove()
        resolve(raw)
      }, 200)
    }

    overlay.querySelector('[data-save-cancel]')?.addEventListener('click', () => finish(null))
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null)
    })

    overlay.querySelector('[data-save-apply]')?.addEventListener('click', () => {
      const decoded = decodeSaveTransfer(ta.value)
      if (!decoded) {
        hint.textContent =
          'Не похоже на код сейва. Нужна строка, которая начинается с DI_SAVE_v1:'
        return
      }
      finish(decoded)
    })

    // Попытка авто-вставки из буфера
    void (async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText()
          if (text.includes('DI_SAVE_v1:')) {
            ta.value = text.trim()
            hint.textContent = 'Код подставлен из буфера — нажми «Применить»'
          }
        }
      } catch {
        /* ignore */
      }
      ta.focus()
    })()
  })
}
