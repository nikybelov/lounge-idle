#!/usr/bin/env node
/**
 * Регрессии миграций сейва: F5 не должен сжимать прогресс повторно.
 * Дублирует формулу migrateScaledLevel из src/save/storage.ts — держать в синхроне.
 */

function migrateScaledLevel(level, oldMax, newMax) {
  if (!Number.isFinite(level) || level <= 0) return 0
  const n = Math.floor(level)
  if (n <= newMax) return Math.min(newMax, n)
  if (oldMax <= newMax) return Math.min(newMax, n)
  return Math.min(newMax, Math.ceil((n / oldMax) * newMax))
}

function assert(cond, msg) {
  if (!cond) {
    console.error('check-save-migrations: FAIL', msg)
    process.exit(1)
  }
}

function chain(start, oldMax, newMax, times) {
  let v = start
  const steps = [v]
  for (let i = 0; i < times; i++) {
    v = migrateScaledLevel(v, oldMax, newMax)
    steps.push(v)
  }
  return steps
}

assert(
  chain(4, 12, 4, 5).every((x) => x === 4),
  'telegram toolkit level 4 must stay 4 across reloads',
)
assert(
  chain(8, 15, 8, 5).every((x) => x === 8),
  'channel gear level 8 must stay 8 across reloads',
)
assert(
  chain(2, 12, 4, 5).every((x) => x === 2),
  'mid-scale toolkit level must stay put',
)

const legacyCam = chain(12, 15, 8, 4)
assert(legacyCam[1] === 7, `legacy camera 12→7 got ${legacyCam[1]}`)
assert(
  legacyCam.slice(1).every((x) => x === legacyCam[1]),
  'legacy camera must not shrink further after first migrate',
)

const legacyTk = chain(10, 12, 4, 4)
assert(legacyTk[1] === 4, `legacy toolkit 10→4 got ${legacyTk[1]}`)
assert(
  legacyTk.slice(1).every((x) => x === 4),
  'legacy toolkit must stay at cap after migrate',
)

// Старый баг: каждый reload сжимал 4→2→1
function buggy(level, oldMax, newMax) {
  return Math.min(newMax, Math.ceil((level / oldMax) * newMax))
}
const buggyChain = (() => {
  let v = 4
  const s = [v]
  for (let i = 0; i < 3; i++) {
    v = buggy(v, 12, 4)
    s.push(v)
  }
  return s
})()
assert(
  buggyChain[1] === 2 && buggyChain[2] === 1,
  'sanity: document old bug shape 4→2→1',
)

console.log('check-save-migrations: ok')
