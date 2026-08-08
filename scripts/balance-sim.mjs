/** Rough progression sim — active play, tab open, no offline */

const COST_GROWTH = 1.17
const QUIT_AT = 9
const UPGRADES = [
  { id: 'table', baseCost: 15, income: 0.12, click: 0.5 },
  { id: 'sofa', baseCost: 100, income: 1, click: 1, unlock: { table: 3 } },
  { id: 'menu', baseCost: 500, income: 2.5, click: 8, unlock: { sofa: 2 } },
  { id: 'hood', baseCost: 3000, income: 8, click: 3, unlock: { menu: 1 } },
  { id: 'vip', baseCost: 12000, income: 40, click: 10, unlock: { hood: 1 } },
]

const EXP_BASE = [
  { cost: 4550, income: 3, needFurn: 4 },
  { cost: 9100, income: 6, needFurn: 7 },
  { cost: 18_200, income: 14, needFurn: 10 },
  { cost: 13_000, income: 9, needFurn: 8 },
  { cost: 28_600, income: 18, needFurn: 14 },
]

const BRANCHES = [150_000, 375_000, 825_000, 1_500_000, 3_750_000]

function upgradeCost(def, level) {
  return Math.floor(def.baseCost * COST_GROWTH ** level)
}

function ownedIncome(owned) {
  let s = 0
  for (const u of UPGRADES) s += u.income * (owned[u.id] || 0)
  return s
}

function furniture(owned) {
  return (owned.table || 0) + (owned.sofa || 0) + (owned.vip || 0)
}

function simJobToOpen(target = 10500) {
  // Смена чуть медленнее после rebalance
  let cash = 0
  let sec = 0
  let rate = 1.9
  while (cash < target && sec < 7200) {
    cash += rate
    sec += 1
    if (sec === 120) rate = 3.1
    if (sec === 300) rate = 4.6
    if (sec === 600) rate = 6.0
  }
  return { sec, cash, rate }
}

function simLoungeToQuit(tier = { incomeMult: 1, clickMult: 1, start: { table: 1 } }) {
  let cash = 500
  let sec = 0
  const owned = { table: tier.start.table || 1, sofa: 0, menu: 0, hood: 0, vip: 0 }
  let expansions = 0
  const bought = new Set()

  const income = () => ownedIncome(owned) * tier.incomeMult * 1.05 // base traffic

  while (sec < 36000) {
    const inc = income()
    cash += inc
    sec += 1

    for (const u of UPGRADES) {
      if (u.unlock) {
        for (const [k, v] of Object.entries(u.unlock)) {
          if ((owned[k] || 0) < v) continue
        }
      }
      const lvl = owned[u.id] || 0
      const cost = upgradeCost(u, lvl)
      if (cash >= cost && !bought.has(`${u.id}-${lvl}`)) {
        cash -= cost
        owned[u.id] = lvl + 1
      }
    }

    for (const ex of EXP_BASE) {
      if (expansions >= EXP_BASE.length) break
      const e = EXP_BASE[expansions]
      if (furniture(owned) >= e.needFurn && cash >= e.cost) {
        cash -= e.cost
        owned._exp = (owned._exp || 0) + e.income
        expansions++
      }
    }

    const gross =
      ownedIncome(owned) * tier.incomeMult * 1.15 +
      (owned._exp || 0) +
      expansions * 0.5
    if (gross >= QUIT_AT) {
      return { sec, owned, expansions, income: gross, cash }
    }
  }
  return { sec, owned, expansions, income: income(), cash, failed: true }
}

function simEmpireBranches(startIncome = 12) {
  let cash = 50_000
  let sec = 0
  let income = startIncome
  let branch = 0
  const times = []
  while (branch < BRANCHES.length && sec < 200000) {
    const cost = BRANCHES[branch]
    while (cash < cost && sec < 200000) {
      cash += income
      sec += 1
      income *= 1.00002 // tiny organic growth
    }
    if (cash >= cost) {
      cash -= cost
      income *= 1.14
      times.push({ branch: branch + 1, sec, income })
      branch++
    } else break
  }
  return { times, finalIncome: income, sec }
}

function simPersonalAmbassador() {
  // video ~40s cd, grade 4, reach 0.8: ~1 fame, ~1 media per video after taper
  // event 180s: +2/+1, tg post 150s: +0-1/+1
  let fame = 0
  let media = 0
  let sec = 0
  const taper = (v) => (v < 22 ? 1 : v < 38 ? 0.85 : v < 55 ? 0.65 : 0.5)
  const unlock = () =>
    (fame >= 36 && media >= 30) ||
    fame + media * 0.55 >= 52

  while (!unlock() && sec < 7200) {
    if (sec % 40 === 0) {
      fame += Math.max(1, Math.round(1 * taper(fame)))
      media += Math.max(1, Math.round(1 * taper(media)))
    }
    if (sec % 180 === 0) {
      fame += Math.round(2 * taper(fame))
      media += Math.round(1 * taper(media))
    }
    if (sec % 150 === 0) media += Math.round(1 * taper(media))
    sec += 1
  }
  return { sec, fame, media, rep: Math.round(fame + media * 0.55) }
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}м ${s}с`
}

console.log('=== Дымная Империя — грубая симуляция активной игры ===\n')

const job = simJobToOpen(10500)
console.log(`1. Смена → 10500₽ (открыть «Уголок»): ~${fmt(job.sec)}`)

for (const tier of [
  { name: 'Уголок', incomeMult: 1, clickMult: 1, start: { table: 1 }, cost: 10500 },
  { name: 'Малый зал', incomeMult: 1.2, clickMult: 1.15, start: { table: 2, sofa: 1 }, cost: 17500 },
  { name: 'Авторский', incomeMult: 1.45, clickMult: 1.3, start: { table: 3, sofa: 2, menu: 1, hood: 1 }, cost: 23000 },
]) {
  const jobT = simJobToOpen(tier.cost)
  const lounge = simLoungeToQuit(tier)
  console.log(
    `\n2. Тариф «${tier.name}» (${tier.cost}₽): смена ${fmt(jobT.sec)} + dual до увольнения ${fmt(lounge.sec)} = ${fmt(jobT.sec + lounge.sec)}`,
  )
  console.log(`   → доход при увольнении ~${lounge.income?.toFixed(1)}/с, мебель table ${lounge.owned?.table}`)
}

const empire = simEmpireBranches(18)
console.log(`\n3. Сеть (5 филиалов, старт ~18/с, 50k в кассе):`)
for (const t of empire.times) {
  console.log(`   филиал ${t.branch}: ~${fmt(t.sec)} · доход ~${t.income.toFixed(1)}/с`)
}
console.log(`   итого до полной сети: ~${fmt(empire.sec)} · финал ~${empire.finalIncome.toFixed(1)}/с`)

const amb = simPersonalAmbassador()
console.log(`\n4. Амбассадор (ролики+ивенты+TG, активно): ~${fmt(amb.sec)} → ${amb.fame} узн. / ${amb.media} мед.`)

console.log('\n--- Оценка темпа ---')
console.log('Полный прогон (уголок + dual + сеть + личное): ~', fmt(job.sec + simLoungeToQuit({ start: { table: 1 } }).sec + empire.sec))
