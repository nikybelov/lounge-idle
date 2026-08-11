import { storageKey } from './runtime'
import { MASCOT_NAME, mascotSvg } from '../ui/mascot'

const AGE_KEY_BASE = 'lounge-idle-tg-age-ok'

function ageKey(): string {
  return storageKey(AGE_KEY_BASE)
}

export function hasAcceptedTelegramAgeGate(): boolean {
  try {
    return localStorage.getItem(ageKey()) === '1'
  } catch {
    return false
  }
}

function markAccepted(): void {
  try {
    localStorage.setItem(ageKey(), '1')
  } catch {
    /* ignore */
  }
}

/**
 * Дисклеймер 18+ для табачной тематики в Mini App (фикшн-тайкун, без инструкций курения).
 * Требуется один раз на устройстве/сейве TG.
 */
export function presentTelegramAgeGate(root: HTMLElement): Promise<void> {
  if (hasAcceptedTelegramAgeGate()) return Promise.resolve()

  return new Promise((resolve) => {
    root.innerHTML = `
      <div class="tg-age-gate" role="dialog" aria-modal="true" aria-labelledby="tg-age-title">
        <div class="tg-age-gate__card">
          <div class="tg-age-gate__mascot" aria-hidden="true">${mascotSvg()}</div>
          <p class="tg-age-gate__brand">Дымная Империя</p>
          <h1 id="tg-age-title" class="tg-age-gate__title">Только для взрослых</h1>
          <p class="tg-age-gate__body">
            Это браузерная idle-игра про вымышленный кальянный лаунж.
            Здесь нет инструкций по курению и реальных брендов табака — только игровой сеттинг.
          </p>
          <p class="tg-age-gate__body tg-age-gate__body--soft">
            Продолжая, ты подтверждаешь, что тебе есть <strong>18 лет</strong>,
            и соглашаешься с правилами Telegram Mini Apps.
          </p>
          <p class="tg-age-gate__hint">${MASCOT_NAME} рядом — если что, подскажет в игре.</p>
          <button type="button" class="tg-age-gate__btn" data-tg-age-ok>Мне есть 18 — играть</button>
        </div>
      </div>
    `
    const btn = root.querySelector('[data-tg-age-ok]') as HTMLButtonElement | null
    btn?.addEventListener('click', () => {
      markAccepted()
      root.innerHTML = ''
      resolve()
    })
  })
}
