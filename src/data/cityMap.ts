import type { BranchId } from './branches'

/**
 * Точки сети на карте-референсе (печатная топография).
 * Координаты 0…100 в «плане»; projectCity кладёт их на фото.
 */
export type CityMapPinId = BranchId | 'hq'

export interface CityMapPin {
  id: CityMapPinId
  label: string
  x: number
  y: number
  district: string
}

export interface CityMapPt {
  x: number
  y: number
}

export const CITY_MAP_VIEW = { w: 360, h: 420 }

/**
 * Раскладка по смыслу названий на площади карты:
 * метро у центра, ТЦ восток, парк СЗ, БЦ СВ, берег юг.
 */
export const CITY_MAP_PINS: CityMapPin[] = [
  { id: 'hq', label: 'Штаб', x: 48, y: 46, district: 'Центр' },
  { id: 'metro', label: 'Метро', x: 36, y: 42, district: 'Узел' },
  { id: 'mall', label: 'ТЦ', x: 68, y: 40, district: 'Ритейл' },
  { id: 'park', label: 'Парк', x: 28, y: 28, district: 'Сад' },
  { id: 'tower', label: 'БЦ', x: 70, y: 26, district: 'Деловой' },
  { id: 'coast', label: 'Берег', x: 52, y: 72, district: 'Набережная' },
]

export function getCityMapPin(id: CityMapPinId): CityMapPin | undefined {
  return CITY_MAP_PINS.find((p) => p.id === id)
}

/** Лёгкий косой сдвиг поверх фото (чуть не строго сверху) */
export function projectCity(x: number, y: number): CityMapPt {
  return {
    x: 18 + x * 3.24 + y * 0.18,
    y: 36 + y * 3.4 - x * 0.12,
  }
}
