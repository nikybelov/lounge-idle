import { icon } from './icons'
import { syncAmbientMusic } from './ambientMusic'
import { CHANGELOG, CURRENT_VERSION } from '../data/changelog'
import {
  applySettings,
  getSettings,
  patchSettings,
  type GameSettings,
  type ReducedMotionPref,
} from '../save/settings'

type SettingsChangeHandler = (settings: GameSettings) => void
type SettingsView = 'main' | 'changelog'

function motionLabel(value: ReducedMotionPref): string {
  if (value === 'system') return 'Как в системе'
  if (value === 'reduce') return 'Меньше анимаций'
  return 'Все эффекты'
}

function formatReleaseDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const months = [
    'янв',
    'фев',
    'мар',
    'апр',
    'мая',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ]
  return `${d} ${months[m - 1]} ${y}`
}

function settingsMainHtml(settings: GameSettings): string {
  return `
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
            <span class="settings-row__hint">Редкие ноты и тихий ритм · без дронов</span>
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
      <button type="button" class="settings-version-btn" data-open-changelog>
        <span class="settings-version">Дымная Империя · v${CURRENT_VERSION}</span>
        <span class="settings-version-cta">Что нового</span>
      </button>
    </footer>
  `
}

function changelogHtml(): string {
  const entries = CHANGELOG.map(
    (entry) => `
      <article class="changelog-entry">
        <header class="changelog-entry__head">
          <p class="changelog-entry__version">v${entry.version}</p>
          <p class="changelog-entry__date">${formatReleaseDate(entry.releasedAt)}</p>
        </header>
        <h3 class="changelog-entry__title">${entry.title}</h3>
        <ul class="changelog-entry__list">
          ${entry.details.map((line) => `<li>${line}</li>`).join('')}
        </ul>
      </article>
    `,
  ).join('')

  return `
    <header class="settings-sheet__head">
      <button type="button" class="settings-sheet__back" data-changelog-back aria-label="Назад к настройкам">←</button>
      <h2 id="settings-title" class="settings-sheet__title">Что нового</h2>
      <button type="button" class="settings-sheet__close" data-settings-close aria-label="Закрыть">${icon('close')}</button>
    </header>
    <div class="settings-sheet__body settings-sheet__body--changelog" data-changelog-list>
      ${entries}
    </div>
  `
}

export function openSettingsPanel(root: HTMLElement, onChange: SettingsChangeHandler): void {
  if (root.querySelector('.settings-overlay')) return

  const overlay = document.createElement('div')
  overlay.className = 'settings-overlay'
  overlay.innerHTML = `
    <div class="settings-sheet gradient-surface" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      ${settingsMainHtml(getSettings())}
    </div>
  `
  root.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('visible'))

  let view: SettingsView = 'main'
  const sheet = () => overlay.querySelector('.settings-sheet') as HTMLElement

  const close = (): void => {
    overlay.classList.remove('visible')
    window.removeEventListener('keydown', onKey)
    window.setTimeout(() => overlay.remove(), 220)
  }

  const renderView = (next: SettingsView): void => {
    view = next
    const el = sheet()
    if (next === 'changelog') {
      el.innerHTML = changelogHtml()
      el.querySelector('[data-changelog-back]')?.addEventListener('click', () => {
        renderView('main')
      })
    } else {
      el.innerHTML = settingsMainHtml(getSettings())
      wireMainControls()
    }
    el.querySelector('[data-settings-close]')?.addEventListener('click', close)
    const focusTarget =
      (el.querySelector(
        next === 'changelog' ? '[data-changelog-back]' : '[data-settings-close]',
      ) as HTMLElement | null) ?? el
    focusTarget.focus()
  }

  const wireMainControls = (): void => {
    const el = sheet()
    el.querySelector('[data-open-changelog]')?.addEventListener('click', () => {
      renderView('changelog')
    })

    el.querySelector('[data-setting="sound"]')?.addEventListener('change', (e) => {
      const next = patchSettings({ sound: (e.target as HTMLInputElement).checked })
      onChange(next)
    })

    el.querySelector('[data-setting="music"]')?.addEventListener('change', (e) => {
      const next = patchSettings({ music: (e.target as HTMLInputElement).checked })
      syncAmbientMusic()
      onChange(next)
    })

    el.querySelector('[data-setting="coachHints"]')?.addEventListener('change', (e) => {
      const next = patchSettings({ coachHints: (e.target as HTMLInputElement).checked })
      onChange(next)
    })

    el.querySelector('[data-setting="reducedMotion"]')?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as ReducedMotionPref
      const next = patchSettings({ reducedMotion: value })
      const hint = el.querySelector('[data-motion-hint]')
      if (hint) hint.textContent = motionLabel(value)
      applySettings(root)
      onChange(next)
    })
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    if (view === 'changelog') renderView('main')
    else close()
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })
  window.addEventListener('keydown', onKey)
  sheet().querySelector('[data-settings-close]')!.addEventListener('click', close)
  wireMainControls()
}
