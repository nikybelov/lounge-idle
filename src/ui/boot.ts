import { VENUES, type VenueId } from '../data/venues'

export type BootStep = 'loading' | 'name' | 'venue'

export interface BootResult {
  playerName: string
  venueId: VenueId
}

/**
 * Экран загрузки → имя → выбор заведения.
 * Можно листать места сколько угодно; финал только по «Начать смену».
 */
export function runBoot(root: HTMLElement): Promise<BootResult> {
  return new Promise((resolve) => {
    let step: BootStep = 'loading'
    let playerName = ''
    let selected: VenueId = 'smoke_river'

    const paint = (): void => {
      if (step === 'loading') {
        root.innerHTML = `
          <div class="boot">
            <div class="boot-card">
              <p class="boot-brand">Lounge Idle</p>
              <p class="boot-sub">Загрузка смены…</p>
              <div class="boot-bar"><i></i></div>
            </div>
          </div>
        `
        return
      }

      if (step === 'name') {
        root.innerHTML = `
          <div class="boot">
            <div class="boot-card">
              <p class="boot-brand">Lounge Idle</p>
              <p class="boot-label">Как тебя зовут?</p>
              <input class="boot-input" data-name type="text" maxlength="24" placeholder="Имя" autocomplete="nickname" />
              <button type="button" class="boot-cta" data-next disabled>Дальше</button>
            </div>
          </div>
        `
        const input = root.querySelector('[data-name]') as HTMLInputElement
        const next = root.querySelector('[data-next]') as HTMLButtonElement
        input.focus()
        const sync = (): void => {
          playerName = input.value.trim()
          next.disabled = playerName.length < 2
        }
        input.addEventListener('input', sync)
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !next.disabled) next.click()
        })
        next.addEventListener('click', () => {
          sync()
          if (playerName.length < 2) return
          step = 'venue'
          paint()
        })
        return
      }

      const list = VENUES.map((v) => {
        const active = selected === v.id
        return `
          <button type="button" class="boot-venue ${active ? 'active' : ''}" data-venue="${v.id}">
            <span class="boot-venue-top">
              <span class="boot-venue-name">${v.name}</span>
              <span class="boot-venue-vibe">${v.vibe}</span>
            </span>
            <span class="boot-venue-blurb">${v.blurb}</span>
            <span class="boot-venue-stats">
              оплата ×${v.payMult} · темп ×${v.cooldownMult} · шоп ×${v.shopPriceMult}
            </span>
          </button>
        `
      }).join('')

      root.innerHTML = `
        <div class="boot">
          <div class="boot-card boot-wide">
            <p class="boot-brand">Куда устроиться?</p>
            <p class="boot-sub">Привет, ${escapeHtml(playerName)}. Сравни смены — цена своего угла от заведения не зависит. Сменить место потом можно только со сбросом карьеры.</p>
            <div class="boot-venues" data-list>${list}</div>
            <button type="button" class="boot-cta" data-start>Начать смену здесь</button>
          </div>
        </div>
      `

      root.querySelector('[data-list]')!.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-venue]')
        if (!btn?.dataset.venue) return
        selected = btn.dataset.venue as VenueId
        paint()
      })

      root.querySelector('[data-start]')!.addEventListener('click', () => {
        resolve({ playerName, venueId: selected })
      })
    }

    paint()
    window.setTimeout(() => {
      step = 'name'
      paint()
    }, 1100)
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
