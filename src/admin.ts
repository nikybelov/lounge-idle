import { ACHIEVEMENTS } from './data/achievements'
import { EXPANSIONS } from './data/expansions'
import { LOUNGE_TIERS, type LoungeTierId } from './data/loungeTiers'
import { SHOP_ITEMS, shopMaxLevel } from './data/shop'
import { TOBACCOS } from './data/tobacco'
import { STAFF_ROLES } from './data/staff'
import { BRANCHES } from './data/branches'
import { VENUES, type VenueId } from './data/venues'
import { shelfCapacity } from './game/appeal'
import type { GameState } from './game/state'

export { isAdminEnabled } from './adminFlag'

/** Полный доступ для просмотра контента и тестов */
export function adminUnlockAll(state: GameState): void {
  state.cash = Math.max(state.cash, 500_000)
  state.jobRank = 'senior'
  state.taskDone = { wash: 120, coals: 120, order: 120 }
  state.owned = {
    table: 12,
    sofa: 10,
    menu: 8,
    hood: 6,
    vip: 4,
  }
  for (const item of SHOP_ITEMS) state.shopOwned[item.id] = shopMaxLevel(item)
  for (const t of TOBACCOS) state.ownedTobacco[t.id] = true
  for (const e of EXPANSIONS) state.expansions[e.id] = true
  for (const b of BRANCHES) state.branches[b.id] = true
  for (const r of STAFF_ROLES) state.staffMembers[r.id] = [4]
  for (const a of ACHIEVEMENTS) state.achievements[a.id] = true

  state.flags.empireOfferUnlocked = true
  const cap = shelfCapacity(state)
  state.shelfActive = TOBACCOS.slice(0, cap).map((t) => t.id)
  state.flags.pickingLounge = false
  if (state.phase === 'employed') state.flags.loungeOfferUnlocked = true
  state.flags.guideStep = 'done'
  state.flags.guideAckedIndex = 99
  state.flags.tabHints = {
    shop: true,
    tobacco: true,
    staff: true,
    network: true,
    personal: true,
    career: true,
  }
  state.flags.celebration = null
}

export function adminForceLounge(state: GameState, tierId: LoungeTierId): void {
  const tier = LOUNGE_TIERS.find((t) => t.id === tierId) ?? LOUNGE_TIERS[0]
  state.phase = 'dual'
  state.scene = 'lounge'
  state.loungeTier = tier.id
  state.loungeIncomeMult = tier.incomeMult
  state.loungeClickMult = tier.clickMult
  state.loungeName = tier.name
  state.flags.personalIntroPending = true
  state.flags.tobaccoSetupPending = true
  adminUnlockAll(state)
}

export function adminToJob(state: GameState): void {
  state.phase = 'employed'
  state.scene = 'job'
  state.loungeTier = null
  state.loungeIncomeMult = 1
  state.loungeClickMult = 1
  state.flags.pickingLounge = false
  adminUnlockAll(state)
}

export interface AdminPanelHandlers {
  onCash: (amount: number) => void
  onUnlockAll: () => void
  onOpenLounge: (tier: LoungeTierId) => void
  onToJob: () => void
  onSetVenue: (id: VenueId) => void
}

export function mountAdminPanel(
  host: HTMLElement,
  handlers: AdminPanelHandlers,
): void {
  host.querySelector('.admin-panel')?.remove()

  const venues = VENUES.map(
    (v) => `<option value="${v.id}">${v.name}</option>`,
  ).join('')
  const tiers = LOUNGE_TIERS.map(
    (t) =>
      `<button type="button" class="admin-btn" data-tier="${t.id}">Зал: ${t.name}</button>`,
  ).join('')

  const el = document.createElement('div')
  el.className = 'admin-panel'
  el.innerHTML = `
    <button type="button" class="admin-toggle" data-toggle>ADMIN</button>
    <div class="admin-body" hidden>
      <p class="admin-title">Админ</p>
      <p class="admin-hint">Выкл: ?admin=0 · Вкл: ?admin=1</p>
      <button type="button" class="admin-btn" data-cash="50000">+50k</button>
      <button type="button" class="admin-btn" data-cash="500000">+500k</button>
      <button type="button" class="admin-btn accent" data-unlock>Открыть всё</button>
      <button type="button" class="admin-btn" data-job>Сцена: смена</button>
      ${tiers}
      <label class="admin-label">Заведение
        <select data-venue>${venues}</select>
      </label>
    </div>
  `
  host.appendChild(el)

  const body = el.querySelector('.admin-body') as HTMLElement
  el.querySelector('[data-toggle]')!.addEventListener('click', () => {
    body.hidden = !body.hidden
  })
  el.querySelectorAll('[data-cash]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onCash(Number((btn as HTMLElement).dataset.cash))
    })
  })
  el.querySelector('[data-unlock]')!.addEventListener('click', () => {
    handlers.onUnlockAll()
  })
  el.querySelector('[data-job]')!.addEventListener('click', () => {
    handlers.onToJob()
  })
  el.querySelectorAll('[data-tier]').forEach((btn) => {
    btn.addEventListener('click', () => {
      handlers.onOpenLounge((btn as HTMLElement).dataset.tier as LoungeTierId)
    })
  })
  el.querySelector('[data-venue]')!.addEventListener('change', (e) => {
    handlers.onSetVenue((e.target as HTMLSelectElement).value as VenueId)
  })
}
