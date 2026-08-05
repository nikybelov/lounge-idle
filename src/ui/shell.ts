import {
  canBrowseLoungeOffer,
  canQuitJob,
  minOpenLoungeCost,
  shopItemCost,
  syncLoungeOfferUnlock,
} from '../game/career'
import {
  formatMoney,
  isUpgradeUnlocked,
  loungeClickPower,
  loungeIncomePerSec,
  upgradeCost,
} from '../game/economy'
import type { GameState } from '../game/state'
import {
  JOB_TASKS,
  QUIT_INCOME_THRESHOLD,
  isTaskUnlocked,
  taskUnlockHint,
} from '../data/tasks'
import {
  SHOP_ITEMS,
  isShopItemAvailable,
  shopRankHint,
  taskCooldownMs,
  taskPay,
  type ShopItemId,
} from '../data/shop'
import { nextRank, promoteProgress, rankDef } from '../data/ranks'
import { getVenue } from '../data/venues'
import { LOUNGE_TIERS, type LoungeTierId } from '../data/loungeTiers'
import { TOBACCOS, getTobacco, type TobaccoId } from '../data/tobacco'
import {
  guestTraffic,
  menuFilledCount,
  menuSlotCount,
  trafficLabel,
  ensureMenuSlots,
  capacityStatus,
  furnitureLevel,
} from '../game/appeal'
import { EXPANSIONS, type ExpansionId } from '../data/expansions'
import {
  ACHIEVEMENTS,
  achievementProgress,
  type AchievementDef,
} from '../data/achievements'
import { UPGRADES } from '../data/upgrades'
import type { TaskId } from '../data/tasks'
import type { UpgradeId } from '../data/upgrades'

export type MenuTab = 'story' | 'shop' | 'own' | 'achievements'

export interface ShellHandlers {
  onJobTask: (id: TaskId) => void
  onLoungeOrder: () => void
  onBuy: (id: UpgradeId) => void
  onBuyShop: (id: ShopItemId) => void
  onBuyTobacco: (id: TobaccoId) => void
  onBuyExpansion: (id: ExpansionId) => void
  onBeginMenuPick: (slot: number) => void
  onCancelMenuPick: () => void
  onSetMenuSlot: (slot: number, id: TobaccoId | null) => void
  onBeginLoungePick: () => void
  onCancelLoungePick: () => void
  onOpenLounge: (tier: LoungeTierId) => void
  onQuit: () => void
  onScene: (scene: 'job' | 'lounge') => void
  onMenuTab: (tab: MenuTab) => void
  onReset: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null
let achieveQueue: AchievementDef[] = []
let achieveShowing = false
let achieveHost: HTMLElement | null = null

function ensureAchieveFanfare(): HTMLElement {
  if (achieveHost?.isConnected) return achieveHost
  document.getElementById('achieve-fanfare-root')?.remove()

  const wrap = document.createElement('div')
  wrap.id = 'achieve-fanfare-root'
  wrap.className = 'achieve-fanfare'
  wrap.hidden = true
  wrap.innerHTML = `
    <div class="achieve-fanfare-backdrop"></div>
    <div class="achieve-fanfare-card" role="dialog" aria-modal="true" aria-live="assertive">
      <p class="achieve-fanfare-kicker">Достижение открыто</p>
      <p class="achieve-fanfare-title" data-achieve-title></p>
      <p class="achieve-fanfare-hint" data-achieve-hint></p>
      <p class="achieve-fanfare-reward" data-achieve-reward></p>
      <button type="button" class="achieve-fanfare-btn" data-achieve-ok>Круто</button>
    </div>
  `
  document.body.appendChild(wrap)
  wrap.querySelector('[data-achieve-ok]')!.addEventListener('click', () => {
    dismissAchievementFanfare()
  })
  achieveHost = wrap
  return wrap
}

export function mountShell(root: HTMLElement, handlers: ShellHandlers): void {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="cash-block">
          <span class="cash-label">Выручка</span>
          <span class="cash-value" data-cash>0</span>
        </div>
        <div class="rate-block" data-rate-wrap hidden>
          <span class="rate-value" data-rate>0/с</span>
        </div>
      </header>

      <main class="stage">
        <div class="haze" aria-hidden="true"></div>
        <div class="embers" aria-hidden="true"></div>
        <p class="brand" data-brand></p>
        <p class="tagline" data-tagline></p>
        <button type="button" class="cta" data-cta hidden>Принять заказ</button>
        <p class="toast" data-toast hidden></p>
      </main>

      <section class="panel">
        <nav class="menu-nav" data-menu aria-label="Меню"></nav>
        <nav class="scene-nav" data-nav></nav>
        <div class="panel-body" data-panel></div>
      </section>
    </div>
  `

  const cta = root.querySelector('[data-cta]') as HTMLButtonElement
  cta.addEventListener('click', () => {
    handlers.onLoungeOrder()
    cta.classList.remove('pulse')
    void cta.offsetWidth
    cta.classList.add('pulse')
  })

  root.querySelector('.menu-nav')!.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-menu-tab]')
    if (!btn?.dataset.menuTab) return
    handlers.onMenuTab(btn.dataset.menuTab as MenuTab)
  })

  ensureAchieveFanfare()
}

export function updateHud(root: HTMLElement, state: GameState): void {
  syncLoungeOfferUnlock(state)
  const cashEl = root.querySelector('[data-cash]') as HTMLElement | null
  const rateWrap = root.querySelector('[data-rate-wrap]') as HTMLElement | null
  const rateEl = root.querySelector('[data-rate]') as HTMLElement | null
  const cta = root.querySelector('[data-cta]') as HTMLButtonElement | null
  if (!cashEl || !rateWrap || !rateEl) return

  cashEl.textContent = formatMoney(state.cash)
  if (state.phase !== 'employed') {
    rateWrap.hidden = false
    rateEl.textContent = `${formatMoney(loungeIncomePerSec(state))}/с`
  } else {
    rateWrap.hidden = true
  }
  if (cta && state.scene === 'lounge' && !cta.hidden) {
    cta.textContent = `Принять заказ · +${formatMoney(loungeClickPower(state))}`
  }

  const ownTab = root.querySelector<HTMLButtonElement>('[data-menu-tab="own"]')
  if (ownTab && state.phase === 'employed') {
    const ready = canBrowseLoungeOffer(state)
    ownTab.disabled = !ready
    ownTab.classList.toggle('locked', !ready)
    ownTab.classList.toggle('ready', ready)
    ownTab.title = ready
      ? 'Выбор своего зала'
      : `Накопи ${formatMoney(minOpenLoungeCost())}`
  }

  root.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
    const id = btn.dataset.buy as UpgradeId
    const def = UPGRADES.find((u) => u.id === id)
    if (!def) return
    const unlocked = isUpgradeUnlocked(state, def)
    const cost = upgradeCost(def, state.owned[id])
    const canBuy = unlocked && state.cash >= cost
    btn.disabled = !canBuy
    btn.classList.toggle('afford', canBuy)
    btn.classList.toggle('locked', !unlocked)
  })

  root.querySelectorAll<HTMLButtonElement>('[data-shop]').forEach((btn) => {
    const id = btn.dataset.shop as ShopItemId
    const item = SHOP_ITEMS.find((i) => i.id === id)
    if (!item || state.shopOwned[id]) return
    const available =
      state.phase !== 'ownOnly' &&
      isShopItemAvailable(item, state.taskDone, state.jobRank)
    const cost = shopItemCost(state, item.cost)
    const canBuy = available && state.cash >= cost
    btn.disabled = !canBuy
    btn.classList.toggle('afford', canBuy)
  })

  const openBtn = root.querySelector<HTMLButtonElement>('[data-open]')
  if (openBtn) openBtn.disabled = !canBrowseLoungeOffer(state)

  const quitBtn = root.querySelector<HTMLButtonElement>('[data-quit]')
  if (quitBtn) quitBtn.disabled = !canQuitJob(state)

  if (state.phase === 'employed') {
    const openCost = minOpenLoungeCost()
    const openMilestone = root.querySelector('[data-open]')?.closest('.milestone')
    const head = openMilestone?.querySelector('.milestone-head span:last-child')
    if (head) {
      head.textContent = `${formatMoney(Math.min(state.cash, openCost))} / ${formatMoney(openCost)}`
    }
    const openBar = openMilestone?.querySelector('.bar i') as HTMLElement | null
    if (openBar) {
      openBar.style.width = `${Math.min(1, state.cash / openCost) * 100}%`
    }
  }

  root.querySelectorAll<HTMLButtonElement>('[data-tobacco]').forEach((btn) => {
    const id = btn.dataset.tobacco as TobaccoId
    const def = TOBACCOS.find((t) => t.id === id)
    if (!def || state.ownedTobacco[id]) return
    const unlocked = state.owned.menu >= def.needMenuLevel
    const canBuy = unlocked && state.cash >= def.cost
    btn.disabled = !canBuy
    btn.classList.toggle('afford', canBuy)
  })

  root.querySelectorAll<HTMLButtonElement>('[data-expansion]').forEach((btn) => {
    const id = btn.dataset.expansion as ExpansionId
    const def = EXPANSIONS.find((e) => e.id === id)
    if (!def || state.expansions[id]) return
    const unlocked = furnitureLevel(state) >= def.needFurniture
    const canBuy = unlocked && state.cash >= def.cost
    btn.disabled = !canBuy
    btn.classList.toggle('afford', canBuy)
  })

  root.querySelectorAll<HTMLButtonElement>('[data-tier]').forEach((btn) => {
    const tier = LOUNGE_TIERS.find((t) => t.id === btn.dataset.tier)
    if (!tier) return
    const can = state.cash >= tier.cost
    btn.disabled = !can
    btn.classList.toggle('afford', can)
    const sub = btn.querySelector('.row-sub')
    if (sub && !can) {
      const need = Math.ceil(tier.cost - state.cash)
      sub.textContent = `Ещё ${formatMoney(need)} — и можно открыть`
    }
  })
}

export function updateJobCooldowns(
  root: HTMLElement,
  state: GameState,
  now = Date.now(),
): void {
  if (state.scene !== 'job') return
  for (const t of JOB_TASKS) {
    const btn = root.querySelector<HTMLButtonElement>(`[data-task="${t.id}"]`)
    if (!btn || !isTaskUnlocked(t, state.taskDone)) continue
    const ready = now >= state.taskReadyAt[t.id]
    const left = Math.max(0, state.taskReadyAt[t.id] - now)
    const cd = Math.round(
      taskCooldownMs(t.cooldownMs, t.id, state.shopOwned) *
        getVenue(state.venueId).cooldownMult,
    )
    const pay = taskPay(
      t.pay,
      t.id,
      state.shopOwned,
      rankDef(state.jobRank).payMult * getVenue(state.venueId).payMult,
    )
    const speedNote = cd < t.cooldownMs ? ` · ${(cd / 1000).toFixed(1)}с` : ''
    btn.disabled = !ready
    btn.classList.toggle('busy', !ready)
    const sub = btn.querySelector('.row-sub')
    const meta = btn.querySelector('.row-meta')
    if (sub) {
      sub.textContent = ready ? `${t.hint}${speedNote}` : `ещё ${(left / 1000).toFixed(1)}с`
    }
    if (meta) meta.textContent = `+${pay}`
  }
}

export function showToast(root: HTMLElement, message: string): void {
  const el = root.querySelector('[data-toast]') as HTMLElement
  el.textContent = message
  el.hidden = false
  el.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    el.classList.remove('show')
    el.hidden = true
  }, 2800)
}

/** Очередь баннеров достижений — закрывается только кнопкой «Круто» */
export function announceAchievements(
  root: HTMLElement,
  unlocked: AchievementDef[],
): void {
  if (!unlocked.length) return
  achieveQueue.push(...unlocked)
  const tab = root.querySelector<HTMLElement>('[data-menu-tab="achievements"]')
  tab?.classList.add('achieve-ping')
  void presentNextAchievement()
}

function presentNextAchievement(): void {
  if (achieveShowing) return
  const next = achieveQueue.shift()
  if (!next) return
  achieveShowing = true

  const wrap = ensureAchieveFanfare()
  const title = wrap.querySelector('[data-achieve-title]') as HTMLElement
  const hint = wrap.querySelector('[data-achieve-hint]') as HTMLElement
  const reward = wrap.querySelector('[data-achieve-reward]') as HTMLElement

  title.textContent = next.title
  hint.textContent = next.hint
  reward.textContent = `+${formatMoney(next.reward)} к выручке`
  wrap.hidden = false
  wrap.classList.remove('out')
  wrap.classList.add('in')
  document.body.classList.add('achieve-locked')
  ;(wrap.querySelector('[data-achieve-ok]') as HTMLButtonElement).focus()
}

function dismissAchievementFanfare(): void {
  const wrap = achieveHost
  if (!wrap || wrap.hidden) {
    achieveShowing = false
    document.body.classList.remove('achieve-locked')
    void presentNextAchievement()
    return
  }
  wrap.classList.remove('in')
  wrap.classList.add('out')
  window.setTimeout(() => {
    wrap.hidden = true
    wrap.classList.remove('out')
    achieveShowing = false
    document.body.classList.remove('achieve-locked')
    void presentNextAchievement()
  }, 220)
}

export function renderShell(
  root: HTMLElement,
  state: GameState,
  handlers: ShellHandlers,
  menuTab: MenuTab,
  now = Date.now(),
): void {
  // Если stage был повреждён (старый баг data-menu) — пересобираем оболочку
  if (!root.querySelector('[data-brand]') || !root.querySelector('.menu-nav')) {
    mountShell(root, handlers)
  }

  const cashEl = root.querySelector('[data-cash]') as HTMLElement
  const rateWrap = root.querySelector('[data-rate-wrap]') as HTMLElement
  const rateEl = root.querySelector('[data-rate]') as HTMLElement
  const brand = root.querySelector('[data-brand]') as HTMLElement
  const tagline = root.querySelector('[data-tagline]') as HTMLElement
  const cta = root.querySelector('[data-cta]') as HTMLButtonElement
  const nav = root.querySelector('[data-nav]') as HTMLElement
  const panel = root.querySelector('[data-panel]') as HTMLElement
  const stage = root.querySelector('.stage') as HTMLElement
  const menuNav = root.querySelector('.menu-nav') as HTMLElement

  cashEl.textContent = formatMoney(state.cash)

  const income = loungeIncomePerSec(state)
  if (state.phase !== 'employed') {
    rateWrap.hidden = false
    rateEl.textContent = `${formatMoney(income)}/с`
  } else {
    rateWrap.hidden = true
  }

  stage.dataset.scene = state.scene
  stage.dataset.phase = state.phase
  stage.dataset.tab = menuTab

  if (state.scene === 'job') {
    brand.textContent = getVenue(state.venueId).name
    const rank = rankDef(state.jobRank).title
    const who = state.playerName ? `${state.playerName} · ` : ''
    tagline.textContent =
      state.phase === 'employed'
        ? `${who}${rank}`
        : `${who}${rank} · можно на смену`
    cta.hidden = true
  } else {
    brand.textContent = state.loungeName
    const multNote =
      state.loungeIncomeMult !== 1 || state.loungeClickMult !== 1
        ? ` · ×${state.loungeIncomeMult}/×${state.loungeClickMult}`
        : ''
    const traffic = guestTraffic(state)
    tagline.textContent = `Гости ${trafficLabel(traffic)} · ×${traffic.toFixed(2)}${multNote}`
    cta.hidden = menuTab !== 'story'
    cta.textContent = `Принять заказ · +${formatMoney(loungeClickPower(state))}`
  }

  const ownReady = canBrowseLoungeOffer(state)
  menuNav.innerHTML = `
    <button type="button" class="menu-btn ${menuTab === 'story' ? 'active' : ''}" data-menu-tab="story">Сюжет</button>
    <button type="button" class="menu-btn ${menuTab === 'shop' ? 'active' : ''}" data-menu-tab="shop">Магазин</button>
    ${
      state.phase === 'employed'
        ? `<button type="button" class="menu-btn ${menuTab === 'own' ? 'active' : ''} ${ownReady ? 'ready' : 'locked'}" data-menu-tab="own" ${ownReady ? '' : 'disabled'} title="${ownReady ? 'Выбор своего зала' : `Накопи ${formatMoney(minOpenLoungeCost())}`}">Свой зал</button>`
        : ''
    }
    <button type="button" class="menu-btn ${menuTab === 'achievements' ? 'active' : ''}" data-menu-tab="achievements">Ачивки</button>
  `

  nav.innerHTML = ''
  if (menuTab === 'story' && state.phase === 'dual') {
    nav.innerHTML = `
      <button type="button" class="nav-btn ${state.scene === 'job' ? 'active' : ''}" data-go="job">На смену</button>
      <button type="button" class="nav-btn ${state.scene === 'lounge' ? 'active' : ''}" data-go="lounge">Свой зал</button>
    `
    nav.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        handlers.onScene((btn as HTMLElement).dataset.go as 'job' | 'lounge')
      })
    })
  }

  if (menuTab === 'shop') {
    panel.innerHTML = renderShopPanel(state)
    wireShopPanel(panel, handlers)
    return
  }

  if (menuTab === 'own' && state.phase === 'employed' && ownReady) {
    panel.innerHTML = renderOwnLoungePanel(state)
    wireOwnLoungePanel(panel, handlers)
    return
  }

  if (menuTab === 'achievements') {
    panel.innerHTML = renderAchievementsPanel(state)
    return
  }

  if (state.scene === 'job') {
    panel.innerHTML = renderJobStoryPanel(state, now)
    wireJobStoryPanel(panel, handlers)
  } else {
    panel.innerHTML = renderLoungePanel(state)
    wireLoungePanel(panel, handlers)
  }
}

function renderJobStoryPanel(state: GameState, now: number): string {
  const rank = rankDef(state.jobRank)
  const venue = getVenue(state.venueId)
  const next = nextRank(state.jobRank)
  const progressRows = promoteProgress(state.jobRank, state.taskDone)
  const payMult = rank.payMult * venue.payMult
  const minCost = minOpenLoungeCost()
  const careerBlock = `
    <div class="milestone career">
      <div class="milestone-head">
        <span>Карьера</span>
        <span>${rank.title}${payMult !== 1 ? ` · ×${payMult.toFixed(2)}` : ''}</span>
      </div>
      ${
        next
          ? `<p class="row-sub">До «${next.title}»: ${progressRows
              .map((p) => `${p.label} ${p.have}/${p.need}`)
              .join(' · ')}</p>
             <div class="bar"><i style="width:${
               progressRows.length
                 ? (progressRows.reduce((s, p) => s + p.have / p.need, 0) /
                     progressRows.length) *
                   100
                 : 0
             }%"></i></div>`
          : `<p class="row-sub">Макс. ранг — копи на свой угол</p>`
      }
    </div>
  `

  const tasks = JOB_TASKS.map((t) => {
    const unlocked = isTaskUnlocked(t, state.taskDone)
    if (!unlocked) {
      return `
      <button type="button" class="row-btn task locked" data-task="${t.id}" disabled>
        <span class="row-main">
          <span class="row-title">${t.label}</span>
          <span class="row-sub">${taskUnlockHint(t, state.taskDone)}</span>
        </span>
        <span class="row-meta">закрыто</span>
      </button>
    `
    }
    const cd = Math.round(
      taskCooldownMs(t.cooldownMs, t.id, state.shopOwned) * venue.cooldownMult,
    )
    const pay = taskPay(t.pay, t.id, state.shopOwned, payMult)
    const ready = now >= state.taskReadyAt[t.id]
    const left = Math.max(0, state.taskReadyAt[t.id] - now)
    const speedNote = cd < t.cooldownMs ? ` · ${(cd / 1000).toFixed(1)}с` : ''
    return `
      <button type="button" class="row-btn task ${ready ? '' : 'busy'}" data-task="${t.id}" ${ready ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${t.label}</span>
          <span class="row-sub">${ready ? `${t.hint}${speedNote}` : `ещё ${(left / 1000).toFixed(1)}с`}</span>
        </span>
        <span class="row-meta">+${pay}</span>
      </button>
    `
  }).join('')

  let milestone = ''
  if (state.phase === 'employed') {
    const ready = canBrowseLoungeOffer(state)
    const progress = Math.min(1, state.cash / minCost)
    const hint = ready
      ? 'Открыта вкладка «Свой зал»'
      : `До вкладки «Свой зал»`
    milestone = `
      <div class="milestone">
        <div class="milestone-head">
          <span>${hint}</span>
          <span>${formatMoney(Math.min(state.cash, minCost))} / ${formatMoney(minCost)}</span>
        </div>
        <div class="bar"><i style="width:${progress * 100}%"></i></div>
        <button type="button" class="row-btn accent" data-open ${ready ? '' : 'disabled'}>
          <span class="row-main">
            <span class="row-title">${ready ? 'Выбрать зал' : 'Копим на угол'}</span>
            <span class="row-sub">${LOUNGE_TIERS.map((t) => formatMoney(t.cost)).join(' · ')}</span>
          </span>
        </button>
      </div>
    `
  }

  return `
    <div class="list">
      ${tasks}
      ${careerBlock}
      ${milestone}
      <button type="button" class="text-btn" data-reset>Сбросить карьеру</button>
    </div>
  `
}

function renderOwnLoungePanel(state: GameState): string {
  const tiers = LOUNGE_TIERS.map((tier) => {
    const can = state.cash >= tier.cost
    const need = Math.ceil(tier.cost - state.cash)
    const bonus = [
      `доход ×${tier.incomeMult}`,
      `заказ ×${tier.clickMult}`,
      tier.startShop.length ? `инструменты: ${tier.startShop.length}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    const sub = can
      ? `${tier.blurb} · ${bonus}`
      : `Ещё ${formatMoney(need)} — и можно открыть`
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : 'locked'}" data-tier="${tier.id}" ${can ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${tier.name} · ${tier.vibe}</span>
          <span class="row-sub">${sub}</span>
        </span>
        <span class="row-meta">${formatMoney(tier.cost)}</span>
      </button>
    `
  }).join('')

  const affordable = LOUNGE_TIERS.filter((t) => state.cash >= t.cost)
  const nextUp = LOUNGE_TIERS.find((t) => state.cash < t.cost)

  return `
    <div class="list">
      <div class="milestone">
        <div class="milestone-head">
          <span>Какой зал открыть?</span>
          <span>${formatMoney(state.cash)}</span>
        </div>
        <p class="row-sub shop-note">
          ${
            affordable.length
              ? `Доступно: ${affordable.map((t) => t.name).join(', ')}.`
              : 'Пока ничего не хватает.'
          }
          ${
            nextUp
              ? ` Подкопи до ${formatMoney(nextUp.cost)} — откроется «${nextUp.name}».`
              : ' Можно брать любой тариф.'
          }
        </p>
      </div>
      ${tiers}
    </div>
  `
}

function wireOwnLoungePanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-tier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onOpenLounge((btn as HTMLElement).dataset.tier as LoungeTierId)
    })
  })
}

function wireJobStoryPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-task]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onJobTask((btn as HTMLElement).dataset.task as TaskId)
    })
  })
  panel.querySelector('[data-open]')?.addEventListener('click', () => handlers.onBeginLoungePick())
  panel.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (confirm('Сбросить карьеру? Имя и заведение тоже сбросятся.')) handlers.onReset()
  })
}

function renderAchievementsPanel(state: GameState): string {
  const { done, total } = achievementProgress(state)
  const rows = ACHIEVEMENTS.map((a) => {
    const unlocked = !!state.achievements[a.id]
    return `
      <div class="row-btn achievement ${unlocked ? 'unlocked' : 'locked'}">
        <span class="achieve-mark" aria-hidden="true">${unlocked ? '★' : '·'}</span>
        <span class="row-main">
          <span class="row-title">${unlocked ? a.title : 'Ещё закрыто'}</span>
          <span class="row-sub">${a.hint}</span>
        </span>
        <span class="row-meta">${unlocked ? 'получено' : `+${formatMoney(a.reward)}`}</span>
      </div>
    `
  }).join('')

  return `
    <div class="list">
      <div class="achieve-summary">
        <p class="achieve-summary-title">Трофеи смены</p>
        <p class="achieve-summary-count">${done} из ${total}</p>
        <div class="bar"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>
      </div>
      ${rows}
    </div>
  `
}

function renderShopPanel(state: GameState): string {
  if (state.phase === 'ownOnly') {
    const owned = SHOP_ITEMS.filter((i) => state.shopOwned[i.id])
      .map(
        (item) => `
      <div class="row-btn shop owned">
        <span class="row-main">
          <span class="row-title">${item.name}</span>
          <span class="row-sub">${item.blurb}</span>
        </span>
        <span class="row-meta">есть</span>
      </div>
    `,
      )
      .join('')

    return `
      <div class="list">
        <p class="panel-label">Магазин смены</p>
        <p class="row-sub shop-note">Смена закрыта после увольнения — новые покупки недоступны.</p>
        ${owned || '<p class="row-sub shop-note">Инструментов не было.</p>'}
      </div>
    `
  }

  const shop = SHOP_ITEMS.map((item) => {
    const owned = !!state.shopOwned[item.id]
    const available = isShopItemAvailable(item, state.taskDone, state.jobRank)
    const price = shopItemCost(state, item.cost)
    if (owned) {
      return `
      <div class="row-btn shop owned">
        <span class="row-main">
          <span class="row-title">${item.name}</span>
          <span class="row-sub">${item.blurb}</span>
        </span>
        <span class="row-meta">есть</span>
      </div>
    `
    }
    if (!available) {
      return `
      <button type="button" class="row-btn shop locked" data-shop="${item.id}" disabled>
        <span class="row-main">
          <span class="row-title">${item.name}</span>
          <span class="row-sub">${shopRankHint(item)}</span>
        </span>
        <span class="row-meta">${formatMoney(price)}</span>
      </button>
    `
    }
    const canBuy = state.cash >= price
    const effect =
      item.cooldownMult < 1
        ? `быстрее ×${item.cooldownMult}`
        : item.payBonus
          ? `+${item.payBonus} к выплате`
          : ''
    return `
      <button type="button" class="row-btn shop ${canBuy ? 'afford' : ''}" data-shop="${item.id}" ${canBuy ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${item.name}</span>
          <span class="row-sub">${item.blurb}${effect ? ` · ${effect}` : ''}</span>
        </span>
        <span class="row-meta">${formatMoney(price)}</span>
      </button>
    `
  }).join('')

  const venue = getVenue(state.venueId)
  return `
    <div class="list">
      <p class="panel-label">Магазин смены</p>
      <p class="row-sub shop-note">${venue.name}: цены ×${venue.shopPriceMult}, темп задач ×${venue.cooldownMult}.</p>
      ${shop}
    </div>
  `
}

function wireShopPanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-shop]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyShop((btn as HTMLElement).dataset.shop as ShopItemId)
    })
  })
}

function renderLoungePanel(state: GameState): string {
  ensureMenuSlots(state)
  const traffic = guestTraffic(state)
  const filled = menuFilledCount(state)
  const slotsN = menuSlotCount(state)
  const cap = capacityStatus(state)

  const trafficBlock = `
    <div class="milestone career">
      <div class="milestone-head">
        <span>Посадка ${cap.seated}/${cap.capacity}${cap.full ? ' · полный' : ''}</span>
        <span>${trafficLabel(traffic)} · ×${traffic.toFixed(2)}</span>
      </div>
      <div class="bar"><i style="width:${Math.min(100, (cap.seated / Math.max(1, cap.capacity)) * 100)}%"></i></div>
    </div>
  `

  const slotButtons = Array.from({ length: slotsN }, (_, i) => {
    const id = state.menuSlots[i]
    const def = id ? getTobacco(id) : null
    const picking = state.menuPickSlot === i
    return `
      <button type="button" class="row-btn ${picking ? 'afford' : ''}" data-menu-slot="${i}">
        <span class="row-main">
          <span class="row-title">Слот ${i + 1}${def ? ` · ${def.name}` : ''}</span>
          <span class="row-sub">${def ? def.blurb : 'Пусто — гости проходят мимо'}</span>
        </span>
        <span class="row-meta">${def ? 'сменить' : 'выбрать'}</span>
      </button>
    `
  }).join('')

  let pickPanel = ''
  if (state.menuPickSlot !== null) {
    const slot = state.menuPickSlot
    const owned = TOBACCOS.filter((t) => state.ownedTobacco[t.id])
    const options = owned
      .map((t) => {
        const usedElsewhere =
          state.menuSlots.some((s, idx) => idx !== slot && s === t.id)
        return `
        <button type="button" class="row-btn shop afford" data-set-menu="${t.id}" data-slot="${slot}">
          <span class="row-main">
            <span class="row-title">${t.name}</span>
            <span class="row-sub">${t.blurb}${usedElsewhere ? ' · сейчас в другом слоте' : ''}</span>
          </span>
          <span class="row-meta">+${t.appeal}</span>
        </button>
      `
      })
      .join('')
    pickPanel = `
      <div class="milestone">
        <p class="row-sub">Выбери вкус для слота ${slot + 1}</p>
        ${
          options ||
          '<p class="row-sub shop-note">Склад пуст — купи табак ниже.</p>'
        }
        <button type="button" class="row-btn" data-clear-menu data-slot="${slot}">Убрать из меню</button>
        <button type="button" class="text-btn" data-cancel-menu-pick>Отмена</button>
      </div>
    `
  }

  const tobaccoShop = TOBACCOS.map((t) => {
    const owned = !!state.ownedTobacco[t.id]
    if (owned) {
      return `
        <div class="row-btn shop owned">
          <span class="row-main">
            <span class="row-title">${t.name}</span>
            <span class="row-sub">${t.blurb}</span>
          </span>
          <span class="row-meta">склад</span>
        </div>
      `
    }
    const unlocked = state.owned.menu >= t.needMenuLevel
    const can = unlocked && state.cash >= t.cost
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''} ${unlocked ? '' : 'locked'}" data-tobacco="${t.id}" ${can ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${t.name}</span>
          <span class="row-sub">${
            unlocked
              ? `${t.blurb} · appeal ${t.appeal}`
              : `Нужно меню ур.${t.needMenuLevel}`
          }</span>
        </span>
        <span class="row-meta">${formatMoney(t.cost)}</span>
      </button>
    `
  }).join('')

  const furn = furnitureLevel(state)
  const expansionRows = EXPANSIONS.map((def) => {
    const owned = !!state.expansions[def.id]
    if (owned) {
      return `
        <div class="row-btn shop owned">
          <span class="row-main">
            <span class="row-title">${def.name}</span>
            <span class="row-sub">+${def.seats} мест · +${formatMoney(def.incomeBonus)}/с</span>
          </span>
          <span class="row-meta">есть</span>
        </div>
      `
    }
    const unlocked = furn >= def.needFurniture
    const can = unlocked && state.cash >= def.cost
    return `
      <button type="button" class="row-btn shop ${can ? 'afford' : ''} ${unlocked ? '' : 'locked'}" data-expansion="${def.id}" ${can ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${def.name}</span>
          <span class="row-sub">${
            unlocked
              ? `${def.blurb} · +${def.seats} мест`
              : `Нужна мебель суммарно ур.${def.needFurniture} (сейчас ${furn})`
          }</span>
        </span>
        <span class="row-meta">${formatMoney(def.cost)}</span>
      </button>
    `
  }).join('')

  const rows = UPGRADES.map((def) => {
    const unlocked = isUpgradeUnlocked(state, def)
    const level = state.owned[def.id]
    const cost = upgradeCost(def, level)
    const canBuy = unlocked && state.cash >= cost
    return `
      <button type="button" class="row-btn upgrade ${unlocked ? '' : 'locked'} ${canBuy ? 'afford' : ''}" data-buy="${def.id}" ${unlocked && canBuy ? '' : 'disabled'}>
        <span class="row-main">
          <span class="row-title">${def.name}${level ? ` · ур.${level}` : ''}</span>
          <span class="row-sub">${unlocked ? def.blurb : 'Пока закрыто'}</span>
        </span>
        <span class="row-meta">
          ${unlocked ? formatMoney(cost) : '—'}
          <small>+${formatMoney(def.incomePerLevel)}/с</small>
        </span>
      </button>
    `
  }).join('')

  let quit = ''
  if (state.phase === 'dual') {
    const ready = canQuitJob(state)
    quit = `
      <div class="milestone">
        <p class="row-sub">Уволиться можно, когда свой зал даёт от ${QUIT_INCOME_THRESHOLD}/сек. Сейчас: ${formatMoney(loungeIncomePerSec(state))}/с</p>
        <button type="button" class="row-btn accent" data-quit ${ready ? '' : 'disabled'}>
          <span class="row-main">
            <span class="row-title">Уволиться из «${getVenue(state.venueId).name}»</span>
            <span class="row-sub">Смена больше не нужна</span>
          </span>
        </button>
      </div>
    `
  }

  return `
    <div class="list">
      ${trafficBlock}
      <p class="panel-label">Закупка</p>
      ${rows}
      <p class="panel-label">Меню · ${filled}/${slotsN}</p>
      ${slotButtons}
      ${pickPanel}
      <p class="panel-label">Табаки</p>
      ${tobaccoShop}
      <p class="panel-label">Расширение</p>
      ${expansionRows}
      ${quit}
      <button type="button" class="text-btn" data-reset>Сбросить карьеру</button>
    </div>
  `
}

function wireLoungePanel(panel: HTMLElement, handlers: ShellHandlers): void {
  panel.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuy((btn as HTMLElement).dataset.buy as UpgradeId)
    })
  })
  panel.querySelectorAll('[data-tobacco]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyTobacco((btn as HTMLElement).dataset.tobacco as TobaccoId)
    })
  })
  panel.querySelectorAll('[data-expansion]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBuyExpansion((btn as HTMLElement).dataset.expansion as ExpansionId)
    })
  })
  panel.querySelectorAll('[data-menu-slot]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onBeginMenuPick(Number((btn as HTMLElement).dataset.menuSlot))
    })
  })
  panel.querySelectorAll('[data-set-menu]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = btn as HTMLElement
      handlers.onSetMenuSlot(
        Number(el.dataset.slot),
        el.dataset.setMenu as TobaccoId,
      )
    })
  })
  panel.querySelector('[data-clear-menu]')?.addEventListener('click', () => {
    const el = panel.querySelector('[data-clear-menu]') as HTMLElement
    handlers.onSetMenuSlot(Number(el.dataset.slot), null)
  })
  panel.querySelector('[data-cancel-menu-pick]')?.addEventListener('click', () => {
    handlers.onCancelMenuPick()
  })
  panel.querySelector('[data-quit]')?.addEventListener('click', () => handlers.onQuit())
  panel.querySelector('[data-reset]')?.addEventListener('click', () => {
    if (confirm('Сбросить карьеру? Имя и заведение тоже сбросятся.')) handlers.onReset()
  })
}
