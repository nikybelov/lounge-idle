import { prefersReducedMotion } from '../save/settings'
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
      <div class="boot-contract-scroll">
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
                «Свой лаунж»: задачи → капитал → открытие своего лаунжа.
              </li>
              <li>
                Обязуется выполнять сменные задачи и копить выручку — со смены
                включится <strong>пассивный доход</strong>, он тоже идёт в капитал на лаунж.
              </li>
              <li>
                Принимает правила игры: угли горячие, чай важен, свой лаунж —
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
      </figure>
      </div>
      <div class="boot-contract-bar">
        <button type="button" class="boot-cta boot-contract-btn" data-next disabled>
          Подписать и на смену
        </button>
      </div>
    </div>
  `
}

export function renderLoadingScreen(): string {
  return `
    <div class="boot boot--loading">
      <div class="boot-load-ambience" aria-hidden="true">
        <span class="boot-load-haze boot-load-haze--1"></span>
        <span class="boot-load-haze boot-load-haze--2"></span>
        <div class="boot-load-embers" data-load-embers></div>
      </div>
      <div class="boot-splash">
        <p class="boot-brand boot-splash-brand" data-load-brand>Дымная Империя</p>
        <p class="boot-tag" data-load-tag>idle · кальянный tycoon</p>
        <p class="boot-sub" data-load-label>Разжигаем угли…</p>
        <div class="boot-fire-stage" aria-hidden="true">
          <div class="boot-fire-glow" data-fire-glow></div>
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

function spawnLoadEmber(layer: HTMLElement): void {
  const ember = document.createElement('span')
  ember.className = 'boot-load-ember'
  ember.style.left = `${8 + Math.random() * 84}%`
  ember.style.setProperty('--rise', `${48 + Math.random() * 72}px`)
  ember.style.setProperty('--drift', `${(Math.random() - 0.5) * 36}px`)
  ember.style.setProperty('--dur', `${1.4 + Math.random() * 1.2}s`)
  ember.style.setProperty('--delay', `${Math.random() * 0.4}s`)
  layer.appendChild(ember)
  window.setTimeout(() => ember.remove(), 2800)
}

/** Появление экрана выбора заведения — карточка и список. */
export function animateBootVenueEntrance(root: HTMLElement): void {
  const boot = root.querySelector('.boot--venue') as HTMLElement | null
  if (!boot) return

  if (prefersReducedMotion()) {
    boot.classList.add('boot-venue-ready')
    return
  }

  boot.classList.add('boot-venue-ready')

  requestAnimationFrame(() => {
    boot.classList.add('boot-venue-enter')
  })
}

/** Появление экрана договора — бумага, пункты, печать. */
export function animateContractEntrance(root: HTMLElement): void {
  const contract = root.querySelector('.boot--contract') as HTMLElement | null
  if (!contract) return

  if (prefersReducedMotion()) {
    contract.classList.add('boot-contract-ready')
    return
  }

  contract.classList.add('boot-contract-ready')

  const safety = window.setTimeout(() => {
    contract.classList.add('boot-contract-enter')
  }, 1800)

  requestAnimationFrame(() => {
    contract.classList.add('boot-contract-enter')
    window.clearTimeout(safety)
  })
}

export function animateFireLoad(
  root: HTMLElement,
  onDone: () => void,
  durationMs = 3200,
): void {
  const fill = root.querySelector('[data-fire-fill]') as HTMLElement | null
  const label = root.querySelector('[data-load-label]') as HTMLElement | null
  const glow = root.querySelector('[data-fire-glow]') as HTMLElement | null
  const emberLayer = root.querySelector('[data-load-embers]') as HTMLElement | null
  const boot = root.querySelector('.boot--loading') as HTMLElement | null

  if (!fill) {
    window.setTimeout(onDone, durationMs)
    return
  }

  boot?.classList.add('boot-loading-live')
  requestAnimationFrame(() => boot?.classList.add('boot-splash-in'))

  const labels = [
    'Разжигаем угли…',
    'Раздуваем пламя…',
    'Прогреваем чаши…',
    'Открываем смену…',
  ]
  const start = performance.now()
  let emberTick = 0

  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / durationMs)
    const eased = 1 - (1 - t) ** 2.1
    fill.style.width = `${Math.max(8, eased * 100)}%`

    if (glow) {
      glow.style.opacity = `${0.35 + eased * 0.55}`
      glow.style.transform = `scaleX(${0.4 + eased * 0.65})`
    }

    if (label) {
      const idx = Math.min(labels.length - 1, Math.floor(t * labels.length))
      label.textContent = labels[idx] ?? labels[labels.length - 1]
    }

    if (emberLayer && !prefersReducedMotion() && now - emberTick > 220) {
      emberTick = now
      spawnLoadEmber(emberLayer)
    }

    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      boot?.classList.add('boot-loading-done')
      window.setTimeout(onDone, 280)
    }
  }

  requestAnimationFrame(tick)
}
