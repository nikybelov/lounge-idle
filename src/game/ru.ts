/** Русское склонение числительных для UI. */

/** 1 заказ, 2 заказа, 5 заказов (и 11–14 → many). */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(Math.trunc(n))
  const mod100 = abs % 100
  const mod10 = abs % 10
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export function pluralRuCount(n: number, one: string, few: string, many: string): string {
  return `${n}\u00a0${pluralRu(n, one, few, many)}`
}
