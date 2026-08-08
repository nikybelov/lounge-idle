/**
 * Симуляция активной игры (вкладка открыта, кликает задачи/покупки).
 * Не учитывает coach, личное видео кликами — personal упрощён.
 */

const COST_GROWTH = 1.17
const QUIT_BASE = 9
const BARE_HANDS = 35

const VENUES = {
  easy: { payMult: 1.26, cooldownMult: 0.85, label: 'Лёгкий · Неон' },
  normal: { payMult: 1, cooldownMult: 1, label: 'Средний · Дым у реки' },
  hard: { payMult: 0.76, cooldownMult: 1.25, label: 'Сложный · Подвал' },
}

const DIFF = {
  easy: {
    upgradeCost: 0.88,
    loungeCost: 0.92,
    branchCost: 0.86,
    expansionCost: 0.92,
    staffCost: 0.9,
    shiftShopCost: 0.88,
    quitIncome: 0.85,
    loyalExtra: 2500,
  },
  normal: {
    upgradeCost: 1,
    loungeCost: 1,
    branchCost: 1,
    expansionCost: 1,
    staffCost: 1,
    shiftShopCost: 1,
    quitIncome: 1,
    loyalExtra: 3000,
  },
  hard: {
    upgradeCost: 1.15,
    loungeCost: 1.08,
    branchCost: 1.16,
    expansionCost: 1.06,
    staffCost: 1.1,
    shiftShopCost: 1.12,
    quitIncome: 1.12,
    loyalExtra: 3500,
  },
}

const TASKS = [
  { id: 'wash', pay: 2.5, cdMs: 1600 },
  { id: 'coals', pay: 4, cdMs: 2000, unlock: { wash: 8 } },
  { id: 'order', pay: 6, cdMs: 2400, unlock: { coals: 8 } },
]

const RANKS = [
  { id: 'assistant', payMult: 1 },
  { id: 'master', payMult: 1.65, requires: { wash: 30, coals: 20, order: 12 } },
  { id: 'senior', payMult: 2.4, requires: { wash: 70, coals: 50, order: 40 } },
]

const SHOP = [
  {
    id: 'drill',
    task: 'wash',
    grades: [
      { cost: 180, cd: 0.72, pay: 0 },
      { cost: 340, cd: 0.56, pay: 1 },
      { cost: 580, cd: 0.44, pay: 2 },
      { cost: 920, cd: 0.34, pay: 3 },
    ],
  },
  {
    id: 'tongs',
    task: 'coals',
    grades: [
      { cost: 220, cd: 0.74, pay: 0 },
      { cost: 400, cd: 0.58, pay: 1 },
      { cost: 660, cd: 0.45, pay: 2 },
      { cost: 1050, cd: 0.35, pay: 3 },
    ],
  },
  {
    id: 'sneakers',
    task: 'order',
    grades: [
      { cost: 320, cd: 0.74, pay: 0 },
      { cost: 520, cd: 0.58, pay: 1 },
      { cost: 820, cd: 0.46, pay: 2 },
      { cost: 1280, cd: 0.36, pay: 3 },
    ],
  },
]

const TIERS = {
  nook: {
    cost: 10500,
    incomeMult: 1,
    start: { table: 1 },
    shop: [],
  },
  signature: {
    cost: 23000,
    incomeMult: 1.45,
    start: { table: 3, sofa: 2, menu: 1, hood: 1 },
    shop: ['drill', 'tongs'],
  },
}

const UPGRADES = [
  { id: 'table', base: 15, inc: 0.12, unlock: null },
  { id: 'sofa', base: 100, inc: 1, unlock: { table: 3 } },
  { id: 'menu', base: 500, inc: 2.5, unlock: { sofa: 2 } },
  { id: 'hood', base: 3000, inc: 8, unlock: { menu: 1 } },
  { id: 'vip', base: 12000, inc: 40, unlock: { hood: 1 } },
]

const EXPANSIONS = [
  { cost: 4550, inc: 3, needFurn: 4 },
  { cost: 9100, inc: 6, needFurn: 7 },
  { cost: 18200, inc: 14, needFurn: 10 },
  { cost: 13000, inc: 9, needFurn: 8 },
  { cost: 28600, inc: 18, needFurn: 14 },
]

const BRANCHES = [150_000, 375_000, 825_000, 1_500_000, 3_750_000]

const STAFF_HIRE = [750, 900, 1100, 1400, 2400]

function scaled(base, mult) {
  return Math.max(1, Math.round(base * mult))
}

function upgradeCost(def, lvl, diff) {
  return scaled(Math.floor(def.base * COST_GROWTH ** lvl), diff.upgradeCost)
}

function furniture(owned) {
  return (owned.table || 0) + (owned.sofa || 0) + (owned.vip || 0)
}

function fmt(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.round(sec % 60)
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м ${s}с`
}

function shopLevel(owned, id) {
  return owned[`shop_${id}`] || 0
}

function taskCdMs(taskId, venue, shopOwned) {
  const task = TASKS.find((t) => t.id === taskId)
  let mult = 1
  for (const item of SHOP) {
    if (item.task !== taskId) continue
    const lvl = shopLevel(shopOwned, item.id)
    if (lvl > 0) mult *= item.grades[lvl - 1].cd
  }
  return Math.max(280, Math.round(task.cdMs * mult * venue.cooldownMult))
}

function taskPay(taskId, rank, venue, shopOwned) {
  const task = TASKS.find((t) => t.id === taskId)
  let pay = task.pay
  for (const item of SHOP) {
    if (item.task !== taskId) continue
    const lvl = shopLevel(shopOwned, item.id)
    if (lvl > 0) pay += item.grades[lvl - 1].pay
  }
  return Math.max(1, Math.floor(pay * rank.payMult * venue.payMult))
}

function canPromote(rankIdx, taskDone) {
  const next = RANKS[rankIdx + 1]
  if (!next?.requires) return false
  return Object.entries(next.requires).every(([k, v]) => taskDone[k] >= v)
}

function jobRepPerSec(taskDone) {
  const total = taskDone.wash + taskDone.coals + taskDone.order
  if (total < 3) return 0
  return Math.min(0.55, 0.04 + total * 0.012)
}

function simJobPhase(difficulty, tierKey, opts = {}) {
  const venue = VENUES[difficulty]
  const diff = DIFF[difficulty]
  const tier = TIERS[tierKey]
  const openCost = scaled(tier.cost, diff.loungeCost)
  const loyalThreshold = scaled(TIERS.nook.cost, diff.loungeCost) + diff.loyalExtra

  let t = 0
  let cash = 0
  let rankIdx = 0
  const taskDone = { wash: 0, coals: 0, order: 0 }
  const shopOwned = {}
  const readyAt = { wash: 0, coals: Infinity, order: Infinity }
  let loyalPockets = false
  let bareHands = false
  const milestones = {}

  const mark = (name) => {
    if (!milestones[name]) milestones[name] = t
  }

  while (cash < openCost && t < 7200) {
    // rep passive
    const rep = jobRepPerSec(taskDone)
    if (rep > 0) cash += rep

    if (cash >= loyalThreshold) loyalPockets = true

    // shop buys — skip drill if bare hands chase on hard
    const skipDrill = opts.bareHands && shopLevel(shopOwned, 'drill') === 0
    for (const item of SHOP) {
      const lvl = shopLevel(shopOwned, item.id)
      if (lvl >= item.grades.length) continue
      if (item.id === 'drill' && skipDrill) continue
      const cost = scaled(item.grades[lvl].cost, diff.shiftShopCost)
      if (cash >= cost) {
        cash -= cost
        shopOwned[`shop_${item.id}`] = lvl + 1
      }
    }

    // pick ready task — prefer order > coals > wash
    const order = ['order', 'coals', 'wash']
    let picked = null
    for (const id of order) {
      const task = TASKS.find((x) => x.id === id)
      if (task.unlock) {
        const [k, n] = Object.entries(task.unlock)[0]
        if (taskDone[k] < n) continue
      }
      if (readyAt[id] <= t + 0.001) {
        picked = id
        break
      }
    }

    if (!picked) {
      const waits = order
        .filter((id) => {
          const task = TASKS.find((x) => x.id === id)
          if (task.unlock) {
            const [k, n] = Object.entries(task.unlock)[0]
            if (taskDone[k] < n) return false
          }
          return true
        })
        .map((id) => readyAt[id])
      t = Math.min(...waits)
      continue
    }

    const rank = RANKS[rankIdx]
    cash += taskPay(picked, rank, venue, shopOwned)
    taskDone[picked]++
    readyAt[picked] = t + taskCdMs(picked, venue, shopOwned) / 1000

    if (taskDone.wash === 1) mark('first_wash')
    if (taskDone.wash >= 15) mark('coals_hands')
    if (taskDone.coals >= 15) mark('full_shift')
    if (taskDone.wash >= BARE_HANDS && shopLevel(shopOwned, 'drill') === 0) {
      bareHands = true
      mark('bare_hands')
    }

    if (canPromote(rankIdx, taskDone)) {
      rankIdx++
      mark(rankIdx === 1 ? 'made_master' : 'made_senior')
    }

    t += 0.05 // UI / reaction overhead per click
  }

  mark('open_lounge')
  return {
    t,
    cash,
    openCost,
    taskDone,
    rankIdx,
    loyalPockets,
    bareHands,
    milestones,
    shopOwned,
  }
}

function grossIncome(owned, expIncome, tierMult, branches, traffic = 1.08) {
  let base = expIncome
  for (const u of UPGRADES) base += u.inc * (owned[u.id] || 0)
  let mult = tierMult * traffic
  mult *= 1 + branches * 0.14 // rough empire
  if (branches >= 2) mult *= 1 + (branches - 1) * 0.03
  if (branches >= 5) mult *= 1.1
  return base * mult
}

function simLoungePhase(difficulty, tierKey, startCash, jobStats, opts = {}) {
  const diff = DIFF[difficulty]
  const tier = TIERS[tierKey]
  const quitNeed = QUIT_BASE * diff.quitIncome

  let t = 0
  let cash = startCash
  const owned = { ...tier.start }
  let expIncome = 0
  let expCount = 0
  let branches = 0
  let staff = 0
  let phase = 'dual'
  let returnedToJob = false
  let loungeOrders = 0
  const milestones = { ...jobStats.milestones }

  const mark = (name) => {
    if (!milestones[name]) milestones[name] = jobStats.t + t
  }

  mark('path')

  while (t < 50000) {
    const traffic = 1.05 + Math.min(0.25, (owned.menu || 0) * 0.04)
    const gross = grossIncome(owned, expIncome, tier.incomeMult, branches, traffic)
    const payroll =
      staff > 0 ? Math.max(staff * 0.5, gross * (0.12 + (staff / 5) * 0.24)) : 0
    const net = gross - payroll

    cash += net
    t += 1

    // occasional click
    if (t % 4 === 0) cash += 2.5 * tier.incomeMult * traffic

    // upgrades
    for (const u of UPGRADES) {
      if (u.unlock) {
        let ok = true
        for (const [k, v] of Object.entries(u.unlock)) {
          if ((owned[k] || 0) < v) ok = false
        }
        if (!ok) continue
      }
      const lvl = owned[u.id] || 0
      const cost = upgradeCost(u, lvl, diff)
      if (cash >= cost) {
        cash -= cost
        owned[u.id] = lvl + 1
      }
    }

    // expansions
    for (const ex of EXPANSIONS) {
      if (expCount >= EXPANSIONS.length) break
      const e = EXPANSIONS[expCount]
      if (furniture(owned) >= e.needFurn && cash >= scaled(e.cost, diff.expansionCost)) {
        cash -= scaled(e.cost, diff.expansionCost)
        expIncome += e.inc
        expCount++
      }
    }

    // staff
    if (staff < STAFF_HIRE.length && cash >= scaled(STAFF_HIRE[staff], diff.staffCost)) {
      cash -= scaled(STAFF_HIRE[staff], diff.staffCost)
      staff++
      if (staff === 1) mark('first_hire')
      if (staff >= 3) mark('payroll_master')
      if (staff >= 5) mark('full_team')
    }

    if (net >= 8) mark('steady_income')
    if (net >= 12 && difficulty === 'normal') mark('normal_income')
    if (loungeOrders >= 1) mark('first_guest')
    if (t === 30) loungeOrders = 1

    if (phase === 'dual' && net >= quitNeed) {
      mark('quit_ready')
      if (opts.stayDualFirst) {
        returnedToJob = true
        mark('shift_loyal')
        mark('back_shift')
        phase = 'dual'
        opts.stayDualFirst = false
      } else {
        phase = 'ownOnly'
        mark('own_boss')
        mark(`quit_${difficulty}`)
        mark('empire_ready')
      }
    }

    if (phase === 'ownOnly' && branches < BRANCHES.length) {
      const cost = scaled(BRANCHES[branches], diff.branchCost)
      if (cash >= cost) {
        cash -= cost
        branches++
        if (branches === 1) mark('second_door')
        if (branches === 1 && difficulty === 'easy') mark('easy_branch')
        if (branches >= 3) {
          mark('three_spots')
          if (difficulty === 'hard') mark('iron_empire')
        }
        if (branches >= 5) mark('full_network')
        if (branches >= 3 && net >= 40) mark('empire_boss')
      }
    }

    if (phase === 'ownOnly' && branches >= 5 && net >= 30) break
    if (t > 40000) break // safety cap ~11h lounge
  }

  return {
    t,
    net: grossIncome(owned, expIncome, tier.incomeMult, branches) - staff * 0.5,
    branches,
    staff,
    phase,
    milestones,
    owned,
  }
}

function simPersonalAmbassador() {
  let fame = 0
  let media = 0
  let t = 0
  const taper = (v) => (v < 22 ? 1 : v < 38 ? 0.85 : v < 55 ? 0.65 : 0.5)
  const unlocked = () => fame >= 36 && media >= 30

  while (!unlocked() && t < 5400) {
    if (t % 45 === 0 && t > 0) {
      fame += Math.max(1, Math.round(1.2 * taper(fame)))
      media += Math.max(1, Math.round(1 * taper(media)))
    }
    if (t % 200 === 0 && t > 0) {
      fame += Math.round(2 * taper(fame))
      media += Math.round(1 * taper(media))
    }
    t += 1
  }
  return { t, fame, media }
}

function countAchievements(milestones, difficulty, job, lounge, lifetime = {}) {
  const got = new Set(Object.keys(lifetime))
  const tryMark = (id) => {
    if (milestones[id] != null) got.add(id)
  }

  tryMark('first_wash')
  tryMark('coals_hands')
  tryMark('full_shift')
  tryMark('made_master')
  tryMark('made_senior')
  if (job.taskDone.wash >= 70) got.add('wash_marathon')
  if (job.taskDone.coals >= 50) got.add('coal_stack')
  if (job.taskDone.order >= 40) got.add('order_runner')
  if (job.bareHands) got.add('bare_hands')
  tryMark('open_lounge')
  if (job.loyalPockets) got.add('loyal_pockets')
  tryMark('shift_loyal')
  tryMark('back_shift')
  tryMark('first_guest')
  tryMark('steady_income')
  tryMark('own_boss')
  tryMark('empire_ready')
  tryMark('second_door')
  tryMark('three_spots')
  tryMark('full_network')
  tryMark('empire_boss')
  tryMark('first_hire')
  tryMark('full_team')
  tryMark('payroll_master')

  got.add(`path_${difficulty}`)
  if (milestones[`quit_${difficulty}`]) got.add(`${difficulty}_quit`)
  if (difficulty === 'easy' && milestones.easy_branch) got.add('easy_branch')
  if (difficulty === 'normal' && milestones.shift_loyal) got.add('normal_dual')
  if (difficulty === 'normal' && milestones.normal_income) got.add('normal_income')
  if (difficulty === 'hard' && job.loyalPockets) got.add('hard_patience')
  if (difficulty === 'hard' && job.bareHands) got.add('hard_bare')
  if (difficulty === 'hard' && milestones.iron_empire) got.add('iron_empire')

  return got
}

function runFull(difficulty, opts = {}) {
  const tierKey = opts.tier || 'nook'
  const job = simJobPhase(difficulty, tierKey, opts)
  const lounge = simLoungePhase(difficulty, tierKey, 800, job, opts)
  const personal = simPersonalAmbassador()
  const total = job.t + lounge.t + personal.t
  const achievements = countAchievements(lounge.milestones, difficulty, job)
  return { difficulty, job, lounge, personal, total, achievements, tierKey }
}

console.log('=== Дымная Империя · симуляция прохождения ===\n')
console.log('Модель: активные клики, greedy-покупки, тариф «Уголок», dual → увольнение → сеть.\n')

const results = []
for (const d of ['easy', 'normal', 'hard']) {
  const r = runFull(d, {
    bareHands: d === 'hard',
    stayDualFirst: d === 'normal',
  })
  results.push(r)
  console.log(`── ${VENUES[d].label} ──`)
  console.log(`  Смена → зал:        ${fmt(r.job.t)} (открытие ${r.job.openCost.toLocaleString('ru')}₽)`)
  console.log(`  Dual → сеть:        ${fmt(r.lounge.t)} (филиалов ${r.lounge.branches}, ФОТ ${r.lounge.staff} чел.)`)
  console.log(`  Личное/амбассадор:  ~${fmt(r.personal.t)}`)
  console.log(`  ИТОГО прогон:       ${fmt(r.total)}`)
  console.log(`  Трофеев за прогон:  ${r.achievements.size} (режимных: ${[...r.achievements].filter((a) => a.includes('_') && (a.startsWith('path_') || a.startsWith('easy_') || a.startsWith('normal_') || a.startsWith('hard_') || a === 'iron_empire')).length})`)
  console.log('')
}

// Lifetime collection: 3 runs
const lifetime = new Set()
let totalAllRuns = 0
for (const r of results) {
  totalAllRuns += r.total
  for (const a of r.achievements) lifetime.add(a)
}

// Missing from sim (need manual/signature/full_kit/ambassador)
const ACHIEVEMENT_IDS = [
  'first_wash', 'coals_hands', 'full_shift', 'made_master', 'made_senior',
  'wash_marathon', 'coal_stack', 'order_runner', 'bare_hands', 'first_tool',
  'full_kit', 'loyal_pockets', 'open_corner', 'shift_loyal', 'back_shift',
  'first_guest', 'steady_income', 'own_boss', 'signature_hall', 'empire_ready',
  'second_door', 'three_spots', 'full_network', 'empire_boss', 'first_hire',
  'full_team', 'payroll_master', 'brand_ambassador',
  'path_easy', 'easy_quit', 'easy_branch', 'path_normal', 'normal_dual',
  'normal_income', 'path_hard', 'hard_patience', 'hard_bare', 'hard_quit', 'iron_empire',
]

const TOTAL_ACHIEVEMENTS = ACHIEVEMENT_IDS.length
const missing = ACHIEVEMENT_IDS.filter((id) => !lifetime.has(id))
console.log('── Все сложности (3 прогона подряд) ──')
console.log(`  Суммарное время:     ${fmt(totalAllRuns)}`)
console.log(`  Трофеев из симуляции: ${lifetime.size} / ${TOTAL_ACHIEVEMENTS}`)
if (missing.length) console.log(`  Не попали в сим: ${missing.join(', ')}`)
console.log('')

// Estimate full 100% with extras
const extraEst = 25 * 60 // signature tier job + full kit + ambassador ~25m per long run
console.log(`  Оценка 100% коллекции (3 прогона + догоняющие): ~${fmt(totalAllRuns + extraEst)}`)
console.log('')

// Balance readout
console.log('── Баланс ──')
const easy = results[0].total
const hard = results[2].total
const ratio = hard / easy
console.log(`  Hard / Easy ≈ ${ratio.toFixed(2)}× (${fmt(hard)} vs ${fmt(easy)})`)
if (easy < 3600) console.log('  ⚠ Лёгкий < 1ч — возможно слишком быстро для «лёгкого курорта»')
if (hard > 36000) console.log('  ⚠ Сложный > 10ч — возможно слишком долго')
if (ratio < 1.4) console.log('  ⚠ Разброс сложностей мал — hard должен ощущаться заметно дольше')

// Milestone table
console.log('\n── Вехи по времени (мин) ──')
console.log('Веха'.padEnd(22), 'Лёгкий'.padStart(8), 'Средний'.padStart(8), 'Сложный'.padStart(8))
for (const key of ['first_wash', 'open_lounge', 'quit_ready', 'second_door', 'three_spots', 'full_network']) {
  const row = [key.padEnd(22)]
  for (const r of results) {
    const v = r.lounge.milestones[key] ?? r.job.milestones[key]
    row.push(v != null ? fmt(v).padStart(8) : '—'.padStart(8))
  }
  console.log(...row)
}
