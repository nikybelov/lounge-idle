export type VenueId = 'basement' | 'smoke_river' | 'neon_haze'

export interface VenueDef {
  id: VenueId
  name: string
  blurb: string
  /** Множитель выплат за задачи смены */
  payMult: number
  /** Множитель кулдауна задач (<1 = быстрее) */
  cooldownMult: number
  /** Множитель цен магазина смены */
  shopPriceMult: number
  vibe: string
}

export const VENUES: VenueDef[] = [
  {
    id: 'basement',
    name: 'Подвал на Лесной',
    blurb: 'Платят мало, задачи тянутся — зато инструменты почти даром.',
    payMult: 0.7,
    cooldownMult: 1.25,
    shopPriceMult: 0.65,
    vibe: 'дешёвый шоп · медленно',
  },
  {
    id: 'smoke_river',
    name: 'Дым у реки',
    blurb: 'Классика: честная оплата, обычный темп, обычный магазин.',
    payMult: 1,
    cooldownMult: 1,
    shopPriceMult: 1,
    vibe: 'баланс',
  },
  {
    id: 'neon_haze',
    name: 'Неон и дымка',
    blurb: 'Премиум-зал: жирная оплата и быстрые задачи, магазин кусается.',
    payMult: 1.35,
    cooldownMult: 0.85,
    shopPriceMult: 1.2,
    vibe: 'жирно · быстро · шоп',
  },
]

/** Старые сейвы с 5 заведениями */
const LEGACY_VENUE: Record<string, VenueId> = {
  corner_coal: 'basement',
  terrace_wind: 'neon_haze',
}

export function normalizeVenueId(id: string | null | undefined): VenueId {
  if (!id) return 'smoke_river'
  if (VENUES.some((v) => v.id === id)) return id as VenueId
  return LEGACY_VENUE[id] ?? 'smoke_river'
}

export function getVenue(id: VenueId | null | undefined): VenueDef {
  const normalized = normalizeVenueId(id)
  return VENUES.find((v) => v.id === normalized) ?? VENUES[1]
}
