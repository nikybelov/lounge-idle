import type { ShopItemId } from '../data/shop'
import type { TaskId } from '../data/tasks'
import type { TobaccoId } from '../data/tobacco'
import type { UpgradeId } from '../data/upgrades'
import type { LoungeTierId } from '../data/loungeTiers'
import type { StaffId } from '../data/staff'
import type { PromotionId } from '../data/promotions'
import { allLoungeTierStageSvgs, venueJobStageSvg } from './venueStageArt'
import type { VenueId } from '../data/venues'

const svg = (body: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const ICONS = {
  wash: svg(
    '<path d="M6 14h12l-1 6H7l-1-6z"/><path d="M9 14V8a3 3 0 0 1 6 0v6"/><path d="M8 5h8"/>',
  ),
  coals: svg(
    '<path d="M8 18c-2-2-2-5 0-7s4-2 6 0 4 2 4 5-2 5-4 2-6 0z"/><path d="M14 11c1-1 3-1 4 1"/>',
  ),
  order: svg(
    '<rect x="5" y="7" width="14" height="11" rx="1"/><path d="M9 7V5h6v2"/><path d="M12 11v4"/><path d="M10 13h4"/>',
  ),
  drill_brush: svg(
    '<path d="M14 4l6 6-3 3-6-6 3-3z"/><path d="M8 10L4 20l4 1 4-10"/><circle cx="17" cy="7" r="1.5" fill="currentColor" stroke="none"/>',
  ),
  tongs: svg('<path d="M6 4v8c0 2 1.5 4 4 4"/><path d="M18 4v8c0 2-1.5 4-4 4"/>'),
  sneakers: svg(
    '<path d="M4 15h16l-2 4H6l-2-4z"/><path d="M6 15l2-6h8l2 6"/><path d="M10 9V6h4v3"/>',
  ),
  table: svg('<path d="M4 10h16"/><path d="M7 10v8"/><path d="M17 10v8"/>'),
  sofa: svg(
    '<path d="M4 12h16v5H4z"/><path d="M6 12V9a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M4 17v2"/><path d="M20 17v2"/>',
  ),
  menu: svg(
    '<path d="M6 5h12"/><path d="M6 10h12"/><path d="M6 15h8"/><circle cx="18" cy="15" r="2"/>',
  ),
  hood: svg(
    '<path d="M4 8h16l-2 10H6L4 8z"/><path d="M8 8V5h8v3"/><path d="M10 14h4"/>',
  ),
  vip: svg(
    '<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z"/>',
  ),
  lounge: svg(
    '<path d="M4 18h16"/><path d="M8 18V10h3v8"/><path d="M13 18V8h3v10"/><path d="M11 6c0-1 1-2 2-2"/><path d="M16 4c1 0 2 1 2 2"/>',
  ),
  tier_nook: svg('<rect x="6" y="10" width="12" height="8" rx="1"/><path d="M9 10V7h6v3"/>'),
  tier_hall: svg(
    '<path d="M4 18h16"/><path d="M6 18V11h5v7"/><path d="M13 18V9h5v9"/>',
  ),
  tier_signature: svg(
    '<path d="M3 18h18"/><path d="M5 18V8l7-4 7 4v10"/><path d="M12 4v14"/>',
  ),
  trophy: svg(
    '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M6 4H4v2a2 2 0 0 0 2 2"/><path d="M18 4h2v2a2 2 0 0 1-2 2"/><path d="M12 13v3"/><path d="M8 20h8"/>',
  ),
  coin: svg(
    '<circle cx="12" cy="12" r="8"/><path d="M12 8v8"/><path d="M9 10h4a2 2 0 0 1 0 4h-2"/>',
  ),
  lock: svg(
    '<rect x="6" y="11" width="12" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ),
  tab_story: svg(
    '<path d="M4 19V5l7-2 7 2v14"/><path d="M11 3v16"/><path d="M4 9h14"/>',
  ),
  tab_shop: svg(
    '<path d="M6 7h12l-1 12H7L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
  ),
  tab_tobacco: svg(
    '<rect x="5" y="8" width="14" height="10" rx="1"/><path d="M8 8V6h8v2"/><path d="M7 12h10"/><path d="M7 15h6"/>',
  ),
  tab_network: svg(
    '<circle cx="6" cy="12" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 11l3-3"/><path d="M14 9l3 3"/>',
  ),
  tab_career: svg(
    '<path d="M5 18V8l4-3v13"/><path d="M12 18V5l4-3v16"/><path d="M19 18V11l3-2v9"/>',
  ),
  tab_trophies: svg(
    '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M12 13v3"/><path d="M8 20h8"/>',
  ),
  tab_achievements: svg(
    '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M12 13v3"/><path d="M8 20h8"/>',
  ),
  tab_staff: svg(
    '<circle cx="9" cy="8" r="3"/><path d="M4 20v-1a5 5 0 0 1 10 0v1"/><circle cx="17" cy="9" r="2.5"/><path d="M14 20v-1a3.5 3.5 0 0 1 7 0v1"/>',
  ),
  tab_personal: svg(
    '<circle cx="12" cy="8" r="3.5"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/><path d="M17 5h3v3"/><path d="M18.5 3.5v4"/>',
  ),
  staff_host: svg(
    '<circle cx="12" cy="8" r="3"/><path d="M6 20v-1a6 6 0 0 1 12 0v1"/><path d="M16 8h4"/><path d="M18 6v4"/>',
  ),
  staff_master: svg(
    '<path d="M8 18c-2-2-2-5 0-7s4-2 6 0 4 2 4 5-2 5-4 2-6 0z"/><path d="M14 11c1-1 3-1 4 1"/>',
  ),
  staff_bar: svg(
    '<path d="M5 8h14v10H5z"/><path d="M8 8V5h8v3"/><path d="M10 13h4"/>',
  ),
  staff_manager: svg(
    '<path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 16l-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z"/>',
  ),
  staff_waiter: svg(
    '<circle cx="9" cy="8" r="2.5"/><path d="M5 20v-1a4 4 0 0 1 8 0v1"/><path d="M14 11h7"/><path d="M17.5 9v4"/><path d="M14 13h7"/>',
  ),
  tobacco_apple: svg(
    '<path d="M12 20c-3.5 0-6-2.8-6-6.5S8.5 7 12 7s6 2.8 6 6.5S15.5 20 12 20z"/><path d="M12 7V5"/><path d="M12 5c1-1 2.5-1.5 3.5-.5"/>',
  ),
  tobacco_mint: svg(
    '<path d="M12 21c-4-3-6-6.5-6-10a6 6 0 0 1 12 0c0 3.5-2 7-6 10z"/><path d="M12 11v10"/>',
  ),
  tobacco_berry: svg(
    '<circle cx="9" cy="14" r="2.5"/><circle cx="15" cy="14" r="2.5"/><circle cx="12" cy="10" r="2.5"/><path d="M12 7V5"/>',
  ),
  tobacco_citrus: svg(
    '<circle cx="12" cy="13" r="7"/><path d="M12 6v14"/><path d="M7 9l10 8"/><path d="M17 9L7 17"/>',
  ),
  tobacco_grape: svg(
    '<circle cx="10" cy="16" r="2"/><circle cx="14" cy="16" r="2"/><circle cx="12" cy="13" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="14" cy="10" r="2"/><path d="M12 8V5"/>',
  ),
  tobacco_peach: svg(
    '<path d="M12 20c-4 0-7-3.2-7-7.5S8 5 12 5s7 3.2 7 7.5-3 7.5-7 7.5z"/><path d="M12 5c1-2 3-3 5-2"/>',
  ),
  tobacco_pine: svg(
    '<path d="M12 4l-6 8h4l-2 8h8l-2-8h4L12 4z"/>',
  ),
  tobacco_honey: svg(
    '<path d="M8 10h8l1 8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3l1-8z"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/>',
  ),
  tobacco_melon: svg(
    '<path d="M5 18c0-6 3.5-11 7-11s7 5 7 11H5z"/><path d="M12 7V4"/>',
  ),
  tobacco_ice: svg(
    '<path d="M12 3v18"/><path d="M5 7l14 10"/><path d="M19 7L5 17"/><path d="M4 12h16"/>',
  ),
  promo_happy: svg(
    '<circle cx="12" cy="12" r="8"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15a4 4 0 0 0 5 0"/>',
  ),
  promo_combo: svg(
    '<path d="M8 6h8v12H8z"/><path d="M10 6V4h4v2"/><path d="M6 10h12"/><path d="M12 10v4"/>',
  ),
  promo_tasting: svg(
    '<path d="M8 4h8l-1 14H9L8 4z"/><path d="M10 18v2"/><path d="M14 18v2"/><circle cx="12" cy="9" r="2"/>',
  ),
  tab_telegram: svg(
    '<path d="M21 4L3 11l7 3 3 7 8-17z"/><path d="M10 14l11-8"/>',
  ),
  settings: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>',
  ),
  close: svg('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
} as const

export type IconName = keyof typeof ICONS

export function icon(name: IconName, extraClass = ''): string {
  const cls = extraClass ? `row-icon ${extraClass}` : 'row-icon'
  return `<span class="${cls}" aria-hidden="true">${ICONS[name]}</span>`
}

export function taskIcon(id: TaskId): string {
  return icon(id)
}

export function shopIcon(id: ShopItemId): string {
  return icon(id)
}

export function tobaccoIcon(id: TobaccoId): string {
  return icon(TOBACCO_ICONS[id], TOBACCO_TINTS[id])
}

export function upgradeIcon(id: UpgradeId): string {
  return icon(id)
}

export function tierIcon(id: LoungeTierId): string {
  const map: Record<LoungeTierId, IconName> = {
    nook: 'tier_nook',
    hall: 'tier_hall',
    signature: 'tier_signature',
  }
  return icon(map[id])
}

const TOBACCO_ICONS: Record<TobaccoId, IconName> = {
  dawn_apple: 'tobacco_apple',
  mint_fog: 'tobacco_mint',
  berry_night: 'tobacco_berry',
  citrus_lane: 'tobacco_citrus',
  grape_dock: 'tobacco_grape',
  peach_ember: 'tobacco_peach',
  pine_breeze: 'tobacco_pine',
  honey_dune: 'tobacco_honey',
  melon_shift: 'tobacco_melon',
  double_ice: 'tobacco_ice',
}

const TOBACCO_TINTS: Record<TobaccoId, string> = {
  dawn_apple: 'row-icon--tobacco-apple',
  mint_fog: 'row-icon--tobacco-mint',
  berry_night: 'row-icon--tobacco-berry',
  citrus_lane: 'row-icon--tobacco-citrus',
  grape_dock: 'row-icon--tobacco-grape',
  peach_ember: 'row-icon--tobacco-peach',
  pine_breeze: 'row-icon--tobacco-pine',
  honey_dune: 'row-icon--tobacco-honey',
  melon_shift: 'row-icon--tobacco-melon',
  double_ice: 'row-icon--tobacco-ice',
}

const TAB_ICONS: Record<string, IconName> = {
  story: 'tab_story',
  shop: 'tab_shop',
  tobacco: 'tab_tobacco',
  network: 'tab_network',
  career: 'tab_career',
  own: 'tier_signature',
  staff: 'tab_staff',
  personal: 'tab_personal',
}

export function tabIcon(tab: string): string {
  const name = TAB_ICONS[tab] ?? 'tab_story'
  return `<span class="menu-btn-icon" aria-hidden="true">${ICONS[name]}</span>`
}

export function staffIcon(id: StaffId): string {
  const map: Record<StaffId, IconName> = {
    host: 'staff_host',
    waiter: 'staff_waiter',
    master: 'staff_master',
    bar: 'staff_bar',
    manager: 'staff_manager',
  }
  return icon(map[id])
}

export function promotionIcon(id: PromotionId): string {
  const map: Record<PromotionId, IconName> = {
    happy_hour: 'promo_happy',
    second_hookah: 'promo_combo',
    tasting: 'promo_tasting',
  }
  return icon(map[id])
}

/** Декоративная сцена для hero */
export function stageSceneArt(): string {
  const venues: VenueId[] = ['neon_haze', 'smoke_river', 'basement']
  return `
    <div class="stage-art" aria-hidden="true">
      ${venues.map((id) => venueJobStageSvg(id)).join('')}
      ${allLoungeTierStageSvgs()}
    </div>
  `
}
