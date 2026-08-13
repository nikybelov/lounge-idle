/** Меньше этого отсутствия — не чаевые, а «свернул на минуту». */
export const WELCOME_TIPS_MIN_AWAY_MS = 8 * 60 * 1000
/** Дальше ночь не копит — как 40 минут. */
export const WELCOME_TIPS_MAX_AWAY_MS = 40 * 60 * 1000
/** Доля живой ставки: чай, не зарплата. */
export const WELCOME_TIPS_RATE = 0.2
/** Потолок: ~3 минуты текущего пассива. */
export const WELCOME_TIPS_LIVE_CAP_SEC = 180
export const WELCOME_TIPS_FLOOR = 12
/** На смене — меньше первого инструмента (180). */
export const WELCOME_TIPS_JOB_CAP = 80

export function welcomeTipsAmount(
  awayMs: number,
  rate: number,
  employed: boolean,
): number {
  if (awayMs < WELCOME_TIPS_MIN_AWAY_MS) return 0

  const cappedSec = Math.min(awayMs, WELCOME_TIPS_MAX_AWAY_MS) / 1000
  const liveRate = Math.max(0, rate)
  let tips = liveRate * cappedSec * WELCOME_TIPS_RATE
  const liveCap = liveRate * WELCOME_TIPS_LIVE_CAP_SEC
  if (liveCap > 0) tips = Math.min(tips, liveCap)
  if (employed) tips = Math.min(tips, WELCOME_TIPS_JOB_CAP)
  if (tips < WELCOME_TIPS_FLOOR) tips = WELCOME_TIPS_FLOOR
  return Math.floor(tips)
}
