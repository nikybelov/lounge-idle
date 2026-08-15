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
 * метро у центра, молл восток, парк СЗ, башня СВ, набережная юг.
 * Подписи на карте — короткие живые слова, без аббревиатур БЦ/ТЦ.
 */
export const CITY_MAP_PINS: CityMapPin[] = [
  { id: 'hq', label: 'Штаб', x: 48, y: 46, district: 'Центр' },
  { id: 'metro', label: 'Метро', x: 36, y: 42, district: 'Узел' },
  { id: 'mall', label: 'Молл', x: 68, y: 40, district: 'Галерея' },
  { id: 'park', label: 'Веранда', x: 28, y: 28, district: 'Парк' },
  { id: 'tower', label: 'Башня', x: 70, y: 26, district: 'Деловой' },
  { id: 'coast', label: 'Набережная', x: 52, y: 72, district: 'Курорт' },
]

export function getCityMapPin(id: CityMapPinId): CityMapPin | undefined {
  return CITY_MAP_PINS.find((p) => p.id === id)
}

/** Лёгкий косой сдвиг + сжатие к центру (арт с круглой виньеткой, full-bleed зум) */
export function projectCity(x: number, y: number): CityMapPt {
  const cx = 50
  const cy = 46
  const zx = cx + (x - cx) * 0.72
  const zy = cy + (y - cy) * 0.72
  return {
    x: 18 + zx * 3.24 + zy * 0.18,
    y: 36 + zy * 3.4 - zx * 0.12,
  }
}
