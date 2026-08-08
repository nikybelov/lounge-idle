import { VENUES, type VenueId } from '../data/venues'
import { DIFFICULTIES, difficultyFromVenue } from '../data/difficulty'
import { bootDifficultyCoach, bootStartCoach, bootVenueCoach } from '../game/guide'
import {
  animateBootVenueEntrance,
  animateContractEntrance,
  animateFireLoad,
  renderLoadingScreen,
  renderNameContractScreen,
} from './bootScreens'
import { showMascotWelcome } from './mascot'
import { dismissGuideCoach, presentStandaloneCoach } from './guideOverlay'

export type BootStep = 'loading' | 'name' | 'venue'

export interface BootResult {
  playerName: string
  venueId: VenueId
  venueGuideDone: boolean
}

const RECOMMENDED_VENUE: VenueId = 'smoke_river'

type BootGuidePhase = 'difficulty' | 'venue' | 'start' | 'done'

function wireNameContract(
  root: HTMLElement,
  onSubmit: (name: string) => void,
): void {
  const contract = root.querySelector('.boot--contract') as HTMLElement | null
  const input = root.querySelector('[data-name]') as HTMLInputElement
  const next = root.querySelector('[data-next]') as HTMLButtonElement
  const preview = root.querySelector('[data-employee-preview]') as HTMLElement | null

  const sync = (): void => {
    const name = input.value.trim()
    next.disabled = name.length < 2
    if (preview) preview.textContent = name || '—'
    contract?.classList.toggle('boot-contract-signed', name.length >= 2)
  }
  sync()
  window.setTimeout(() => input.focus(), 120)
  input.addEventListener('focus', () => {
    window.setTimeout(() => {
      input.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 320)
  })
  input.addEventListener('input', sync)

  const bar = root.querySelector('.boot-contract-bar') as HTMLElement | null
  const vv = window.visualViewport
  if (bar && vv) {
    const syncBar = (): void => {
      const offset = window.innerHeight - vv.height - vv.offsetTop
      bar.style.transform = offset > 0 ? `translateY(-${offset}px)` : ''
    }
    vv.addEventListener('resize', syncBar)
    vv.addEventListener('scroll', syncBar)
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !next.disabled) next.click()
  })
  next.addEventListener('click', () => {
    const name = input.value.trim()
    if (name.length < 2) return
    onSubmit(name)
  })
}

/**
 * Экран загрузки (огонь) → договор с именем → выбор заведения.
 */
export function runBoot(root: HTMLElement): Promise<BootResult> {
  return new Promise((resolve) => {
    let step: BootStep = 'loading'
    let playerName = ''
    let selected: VenueId = RECOMMENDED_VENUE
    let bootGuidePhase: BootGuidePhase = 'difficulty'
    let loadingStarted = false
    let bootFinished = false

    const updateVenueUi = (): void => {
      root.dataset.difficulty = difficultyFromVenue(selected)
      root.querySelectorAll<HTMLElement>('[data-venue]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.venue === selected)
      })
      const startBtn = root.querySelector('[data-start]') as HTMLButtonElement | null
      if (startBtn) startBtn.disabled = bootGuidePhase !== 'done'
    }

    const onVenueSelect = (venueId: VenueId): void => {
      if (selected === venueId) return
      selected = venueId
      updateVenueUi()
      if (bootGuidePhase !== 'venue') return
      presentStandaloneCoach(
        root,
        bootVenueCoach(playerName, selected),
        () => {
          bootGuidePhase = 'start'
          updateVenueUi()
          showBootGuides()
        },
        'boot-venue',
      )
    }

    const showBootGuides = (): void => {
      if (bootFinished || step !== 'venue' || bootGuidePhase === 'done') return

      if (bootGuidePhase === 'difficulty') {
        presentStandaloneCoach(
          root,
          bootDifficultyCoach(playerName),
          () => {
            bootGuidePhase = 'venue'
            updateVenueUi()
            showBootGuides()
          },
          'boot-difficulty',
        )
        return
      }

      if (bootGuidePhase === 'venue') {
        presentStandaloneCoach(
          root,
          bootVenueCoach(playerName, selected),
          () => {
            bootGuidePhase = 'start'
            updateVenueUi()
            showBootGuides()
          },
          'boot-venue',
        )
        return
      }

      presentStandaloneCoach(
        root,
        bootStartCoach(),
        () => {
          bootGuidePhase = 'done'
          updateVenueUi()
        },
        'boot-start',
      )
    }

    const paint = (): void => {
      if (step === 'loading') {
        dismissGuideCoach(root)
        root.innerHTML = renderLoadingScreen()
        if (!loadingStarted) {
          loadingStarted = true
          animateFireLoad(root, () => {
            showMascotWelcome(root, () => {
              step = 'name'
              paint()
            })
          })
        }
        return
      }

      if (step === 'name') {
        dismissGuideCoach(root)
        root.classList.remove('boot-welcome-leave')
        root.innerHTML = renderNameContractScreen()
        animateContractEntrance(root)
        wireNameContract(root, (name) => {
          playerName = name
          step = 'venue'
          bootGuidePhase = 'difficulty'
          paint()
        })
        return
      }

      const list = VENUES.map((v) => {
        const active = selected === v.id
        const rec = v.id === RECOMMENDED_VENUE
        const diff = DIFFICULTIES[v.difficulty]
        return `
          <button type="button" class="boot-venue boot-venue--${v.id} ${active ? 'active' : ''}" data-venue="${v.id}">
            <span class="boot-venue-top">
              <span class="boot-venue-name">${v.name}${rec ? ' <em class="boot-rec">старт</em>' : ''}</span>
              <span class="boot-venue-vibe">${v.vibe}</span>
            </span>
            <span class="boot-venue-diff boot-venue-diff--${v.difficulty}">${diff.label}</span>
            <span class="boot-venue-blurb">${v.blurb}</span>
            <span class="boot-venue-stats">
              <span title="Сколько платят за задачу">оплата ×${v.payMult}</span>
              <span title="Как быстро откатываются задачи">темп ×${v.cooldownMult}</span>
              <span title="Цены инструментов на смене (от сложности)">инструменты ×${DIFFICULTIES[v.difficulty].shiftShopCost}</span>
            </span>
          </button>
        `
      }).join('')

      root.innerHTML = `
        <div class="boot boot--venue" data-difficulty="${difficultyFromVenue(selected)}">
          <div class="boot-venue-ambience" aria-hidden="true">
            <span class="boot-venue-haze boot-venue-haze--1"></span>
            <span class="boot-venue-haze boot-venue-haze--2"></span>
            <span class="boot-venue-glow"></span>
          </div>
          <div class="boot-card boot-wide gradient-surface boot-venue-card">
            <p class="boot-brand boot-venue-head">Сложность и заведение</p>
            <p class="boot-sub boot-venue-intro">Привет, ${escapeHtml(playerName)}. Заведение = <strong>сложность</strong> прохождения: оплата на смене, цены зала и сети.</p>
            <div class="boot-venues" data-list>${list}</div>
            <button type="button" class="boot-cta boot-venue-start" data-start disabled>Начать смену здесь</button>
          </div>
        </div>
      `

      root.querySelector('[data-list]')!.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-venue]')
        if (!btn?.dataset.venue) return
        onVenueSelect(btn.dataset.venue as VenueId)
      })

      root.querySelector('[data-start]')!.addEventListener('click', () => {
        if (bootGuidePhase !== 'done') return
        bootFinished = true
        bootGuidePhase = 'done'
        dismissGuideCoach(root)
        resolve({
          playerName,
          venueId: selected,
          venueGuideDone: true,
        })
      })

      updateVenueUi()
      animateBootVenueEntrance(root)

      if (!bootFinished) {
        requestAnimationFrame(() => showBootGuides())
      }
    }

    paint()
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
