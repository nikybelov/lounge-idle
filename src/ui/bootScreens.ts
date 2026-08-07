import { fireTipsSvg } from './bootArt'

/** Экран подписи договора — имя игрока как подпись. */
export function renderNameContractScreen(): string {
  return `
    <div class="boot boot--name boot--contract">
      <div class="boot-contract-ambience" aria-hidden="true">
        <span class="boot-contract-haze boot-contract-haze--1"></span>
        <span class="boot-contract-haze boot-contract-haze--2"></span>
        <span class="boot-contract-ember-glow"></span>
      </div>
      <figure class="boot-contract-sheet">
        <article class="boot-contract-paper">
          <div class="boot-contract-fold" aria-hidden="true"></div>
          <div class="boot-contract-margin" aria-hidden="true"></div>

          <header class="boot-contract-head">
            <span class="boot-contract-no">№ 001 · смена</span>
            <p class="boot-contract-kicker">Угольная канцелярия</p>
            <h1 class="boot-contract-title">Трудовой договор</h1>
            <p class="boot-contract-org">лаунж «Дымная Империя»</p>
          </header>

          <div class="boot-contract-parties">
            <p class="boot-contract-party">
              <span class="boot-contract-party-label">Работодатель</span>
              <span>ООО «Дымная Империя»</span>
            </p>
            <p class="boot-contract-party">
              <span class="boot-contract-party-label">Сотрудник</span>
              <span class="boot-contract-employee" data-employee-preview>—</span>
            </p>
          </div>

          <div class="boot-contract-body">
            <p class="boot-contract-lead">
              Настоящим договором стороны договорились о следующем:
            </p>
            <ol class="boot-contract-clauses">
              <li>
                Сотрудник выходит на <strong>первую смену</strong> в программе
                «Свой зал»: задачи → капитал → открытие своего лаунжа.
              </li>
              <li>
                Обязуется выполнять сменные задачи, копить выручку и наращивать
                <strong>репутацию</strong> — без неё зал не откроешь.
              </li>
              <li>
                Принимает правила игры: угли горячие, чай важен, свой угол —
                <strong>главная цель</strong>.
              </li>
            </ol>
          </div>

          <div class="boot-contract-sign-row">
            <label class="boot-contract-sign-field">
              <span class="boot-contract-sign-label">Подпись сотрудника</span>
              <span class="boot-contract-sign-line">
                <input
                  class="boot-contract-input"
                  data-name
                  type="text"
                  maxlength="24"
                  placeholder="Напиши имя от руки"
                  autocomplete="nickname"
                  spellcheck="false"
                />
              </span>
              <span class="boot-contract-sign-hint">Именно так тебя будут звать на смене</span>
            </label>
            <div class="boot-contract-seal" aria-hidden="true">
              <span>Дымная</span>
              <span>Империя</span>
            </div>
          </div>

          <footer class="boot-contract-foot">
            <span>Дата: первый день смены</span>
            <span>Форма утверждена · действует с подписи</span>
          </footer>
        </article>

        <button type="button" class="boot-cta boot-contract-btn" data-next disabled>
          Подписать и на смену
        </button>
      </figure>
    </div>
  `
}

export function renderLoadingScreen(): string {
  return `
    <div class="boot boot--loading">
      <div class="boot-splash">
        <p class="boot-brand boot-splash-brand">Дымная Империя</p>
        <p class="boot-tag">idle · кальянный tycoon</p>
        <p class="boot-sub" data-load-label>Разжигаем угли…</p>
        <div class="boot-fire-stage" aria-hidden="true">
          <div class="boot-fire-track">
            <div class="boot-fire-ember" data-fire-fill>
              <div class="boot-fire-inner"></div>
              <div class="boot-fire-tips">${fireTipsSvg()}</div>
            </div>
          </div>
          <div class="boot-fire-bowl"></div>
        </div>
      </div>
    </div>
  `
}

export function animateFireLoad(
  root: HTMLElement,
  onDone: () => void,
  durationMs = 2800,
): void {
  const fill = root.querySelector('[data-fire-fill]') as HTMLElement | null
  const label = root.querySelector('[data-load-label]') as HTMLElement | null
  if (!fill) {
    window.setTimeout(onDone, durationMs)
    return
  }

  const labels = [
    'Разжигаем угли…',
    'Раздуваем пламя…',
    'Прогреваем чаши…',
    'Открываем смену…',
  ]
  const start = performance.now()

  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / durationMs)
    const eased = 1 - (1 - t) ** 2.1
    fill.style.width = `${Math.max(8, eased * 100)}%`

    if (label) {
      const idx = Math.min(labels.length - 1, Math.floor(t * labels.length))
      label.textContent = labels[idx] ?? labels[labels.length - 1]
    }

    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      window.setTimeout(onDone, 220)
    }
  }

  requestAnimationFrame(tick)
}
