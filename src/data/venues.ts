import type { DifficultyId } from './difficulty'

export type VenueId = 'basement' | 'smoke_river' | 'neon_haze'

export interface VenueDef {
  id: VenueId
  name: string
  /** Сложность прохождения — выбор заведения = выбор режима */
  difficulty: DifficultyId
  blurb: string
  /** Множитель выплат за задачи смены */
  payMult: number
  /** Множитель кулдауна задач (<1 = быстрее) */
  cooldownMult: number
  vibe: string
}

export const VENUES: VenueDef[] = [
  {
    id: 'basement',
    name: 'Подвал на Лесной',
    difficulty: 'hard',
    blurb: 'Платят мало, задачи тянутся — зато упрямство здесь ценят.',
    payMult: 0.76,
    cooldownMult: 1.25,
    vibe: 'мало платят · медленно',
  },
  {
    id: 'smoke_river',
    name: 'Дым у реки',
    difficulty: 'normal',
    blurb: 'Классика: честная оплата, обычный темп, обычный магазин.',
    payMult: 1,
    cooldownMult: 1,
    vibe: 'баланс',
  },
  {
    id: 'neon_haze',
    name: 'Неон и дымка',
    difficulty: 'easy',
    blurb: 'Премиум-зал: жирная оплата и быстрые задачи.',
    payMult: 1.26,
    cooldownMult: 0.85,
    vibe: 'жирно · быстро',
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
