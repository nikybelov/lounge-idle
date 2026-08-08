import { icon } from './icons'
import { syncAmbientMusic } from './ambientMusic'
import {
  applySettings,
  getSettings,
  patchSettings,
  type GameSettings,
  type ReducedMotionPref,
} from '../save/settings'

type SettingsChangeHandler = (settings: GameSettings) => void

function motionLabel(value: ReducedMotionPref): string {
  if (value === 'system') return 'Как в системе'
  if (value === 'reduce') return 'Меньше анимаций'
  return 'Все эффекты'
}

function settingsHtml(settings: GameSettings): string {
  const version = '0.1.0'
  return `
    <div class="settings-sheet gradient-surface" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <header class="settings-sheet__head">
        <h2 id="settings-title" class="settings-sheet__title">Настройки</h2>
        <button type="button" class="settings-sheet__close" data-settings-close aria-label="Закрыть">${icon('close')}</button>
      </header>
      <div class="settings-sheet__body">
        <section class="settings-group" aria-labelledby="settings-sound-label">
          <p id="settings-sound-label" class="settings-group__label">Звук</p>
          <label class="settings-row settings-row--nested">
            <span class="settings-row__copy">
              <span class="settings-row__label">Эффекты</span>
              <span class="settings-row__hint">Клики, монеты, fanfare</span>
            </span>
            <input type="checkbox" class="settings-toggle" data-setting="sound" ${settings.sound ? 'checked' : ''} />
          </label>
          <label class="settings-row settings-row--nested">
            <span class="settings-row__copy">
              <span class="settings-row__label">Музыка</span>
              <span class="settings-row__hint">Тихий lounge-эмбиент · без треков</span>
            </span>
            <input type="checkbox" class="settings-toggle" data-setting="music" ${settings.music ? 'checked' : ''} />
          </label>
        </section>
        <label class="settings-row">
          <span class="settings-row__copy">
            <span class="settings-row__label">Подсказки Огонька</span>
            <span class="settings-row__hint">Coach-карточки и подсказки вкладок</span>
          </span>
          <input type="checkbox" class="settings-toggle" data-setting="coachHints" ${settings.coachHints ? 'checked' : ''} />
        </label>
        <div class="settings-row settings-row--select">
          <span class="settings-row__copy">
            <span class="settings-row__label">Анимации</span>
            <span class="settings-row__hint" data-motion-hint>${motionLabel(settings.reducedMotion)}</span>
          </span>
          <select class="settings-select" data-setting="reducedMotion" aria-label="Анимации">
            <option value="system" ${settings.reducedMotion === 'system' ? 'selected' : ''}>Как в системе</option>
            <option value="reduce" ${settings.reducedMotion === 'reduce' ? 'selected' : ''}>Меньше анимаций</option>
            <option value="full" ${settings.reducedMotion === 'full' ? 'selected' : ''}>Все эффекты</option>
          </select>
        </div>
      </div>
      <footer class="settings-sheet__foot">
        <span class="settings-version">Дымная Империя · v${version}</span>
      </footer>
    </div>
  `
}

export function openSettingsPanel(root: HTMLElement, onChange: SettingsChangeHandler): void {
  if (root.querySelector('.settings-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'
  overlay.innerHTML = settingsHtml(getSettings())
  root.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  const close = (): void => {
    overlay.classList.remove('visible')
    window.setTimeout(() => overlay.remove(), 220)
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
  overlay.querySelector('[data-settings-close]')!.addEventListener('click', close)

  overlay.querySelector('[data-setting="sound"]')!.addEventListener('change', (e) => {
    const next = patchSettings({ sound: (e.target as HTMLInputElement).checked })
    onChange(next)
  })

  overlay.querySelector('[data-setting="music"]')!.addEventListener('change', (e) => {
    const next = patchSettings({ music: (e.target as HTMLInputElement).checked })
    syncAmbientMusic()
    onChange(next)
  })

  overlay.querySelector('[data-setting="coachHints"]')!.addEventListener('change', (e) => {
    const next = patchSettings({ coachHints: (e.target as HTMLInputElement).checked })
    onChange(next)
  })

  overlay.querySelector('[data-setting="reducedMotion"]')!.addEventListener('change', (e) => {
    const value = (e.target as HTMLSelectElement).value as ReducedMotionPref
    const next = patchSettings({ reducedMotion: value })
    const hint = overlay.querySelector('[data-motion-hint]')
    if (hint) hint.textContent = motionLabel(value)
    applySettings(root)
    onChange(next)
  })
}
