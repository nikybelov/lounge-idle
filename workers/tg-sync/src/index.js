/**
 * Cloudflare Worker: кросс-девайс сейв + тихий пульс Mini App.
 * /stats в боте отвечает только ADMIN_USER_ID (секрет), остальным — тишина.
 */
const SAVE_PREFIX = 'lounge-idle:v1:'
const STATS_KEY = 'stats:v1'
const WEBHOOK_META = 'meta:webhook'

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    try {
      if (url.pathname === '/telegram' && request.method === 'POST') {
        return handleTelegramWebhook(request, env)
      }

      const initData = request.headers.get('X-Telegram-Init-Data') || ''
      const userId = await validateInitDataUserId(initData, env.BOT_TOKEN)
      if (!userId) {
        return json({ error: 'unauthorized' }, 401, cors)
      }

      if (url.pathname === '/pulse' && request.method === 'POST') {
        await recordPulse(env, userId)
        if (isAdmin(env, userId)) {
          await ensureWebhook(env, url.origin)
        }
        return json({ ok: true }, 200, cors)
      }

      if (url.pathname !== '/' && url.pathname !== '') {
        return json({ error: 'not_found' }, 404, cors)
      }

      return handleSave(request, env, userId, cors)
    } catch (err) {
      return json(
        { error: 'server', message: err instanceof Error ? err.message : String(err) },
        500,
        cors,
      )
    }
  },
}

async function handleSave(request, env, userId, cors) {
  const key = `${SAVE_PREFIX}${userId}`

  if (request.method === 'GET') {
    const raw = await env.SAVES.get(key)
    if (!raw) {
      return json({ save: null, cash: 0, lastActive: 0, syncRev: 0, score: 0 }, 200, cors)
    }
    let save = null
    try {
      save = JSON.parse(raw)
    } catch {
      return json({ error: 'corrupt' }, 500, cors)
    }
    return json(
      {
        save,
        cash: num(save?.cash),
        lastActive: num(save?.lastActive),
        syncRev: rev(save),
        score: progressScore(save),
      },
      200,
      cors,
    )
  }

  if (request.method === 'PUT') {
    const body = await request.json()
    const save = body?.save
    if (!save || typeof save !== 'object' || save.v !== 1) {
      return json({ error: 'bad_save' }, 400, cors)
    }
    const cash = num(save.cash)
    const lastActive = num(save.lastActive) || Date.now()
    save.lastActive = lastActive
    if (typeof save.syncRev !== 'number' || !Number.isFinite(save.syncRev)) {
      save.syncRev = 0
    } else {
      save.syncRev = Math.max(0, Math.floor(save.syncRev))
    }
    const score = progressScore(save)
    const syncRev = save.syncRev

    const existingRaw = await env.SAVES.get(key)
    if (existingRaw) {
      try {
        const existing = JSON.parse(existingRaw)
        if (remoteAhead(existing, save)) {
          return json(
            {
              ok: false,
              reason: 'remote_ahead',
              cash: num(existing?.cash),
              lastActive: num(existing?.lastActive),
              syncRev: rev(existing),
              score: progressScore(existing),
            },
            409,
            cors,
          )
        }
      } catch {
        /* overwrite corrupt */
      }
    }

    await env.SAVES.put(key, JSON.stringify(save), {
      metadata: { cash, lastActive, syncRev, score, updatedAt: Date.now() },
    })
    return json({ ok: true, cash, lastActive, syncRev, score }, 200, cors)
  }

  return json({ error: 'method' }, 405, cors)
}

function isAdmin(env, userId) {
  const adminId = Number(env.ADMIN_USER_ID)
  return Number.isFinite(adminId) && adminId > 0 && userId === adminId
}

async function recordPulse(env, userId) {
  let stats = { opens: 0, unique: 0, lastOpenAt: 0 }
  try {
    const raw = await env.SAVES.get(STATS_KEY)
    if (raw) stats = { ...stats, ...JSON.parse(raw) }
  } catch {
    /* keep defaults */
  }
  stats.opens = num(stats.opens) + 1
  stats.lastOpenAt = Date.now()
  const seenKey = `pulse:u:${userId}`
  const seen = await env.SAVES.get(seenKey)
  if (!seen) {
    await env.SAVES.put(seenKey, '1')
    stats.unique = num(stats.unique) + 1
  }
  await env.SAVES.put(STATS_KEY, JSON.stringify(stats))
}

async function countSaves(env) {
  let count = 0
  let cursor
  do {
    const page = await env.SAVES.list({
      prefix: SAVE_PREFIX,
      limit: 1000,
      cursor,
    })
    count += page.keys.length
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  return count
}

function formatWhen(ts) {
  if (!ts) return 'ещё не было'
  try {
    return new Date(ts).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(ts)
  }
}

async function formatStats(env) {
  let stats = { opens: 0, unique: 0, lastOpenAt: 0 }
  try {
    const raw = await env.SAVES.get(STATS_KEY)
    if (raw) stats = { ...stats, ...JSON.parse(raw) }
  } catch {
    /* defaults */
  }
  const saves = await countSaves(env)
  return [
    'Дымная Империя — пульс',
    '',
    `Открытий Mini App: ${num(stats.opens)}`,
    `Уникальных игроков: ${num(stats.unique)}`,
    `Сейвов на сервере: ${saves}`,
    `Последнее открытие: ${formatWhen(num(stats.lastOpenAt))}`,
  ].join('\n')
}

async function webhookSecret(botToken) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`lounge-idle-hook:${botToken}`),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 48)
}

async function ensureWebhook(env, origin) {
  if (!env.BOT_TOKEN || !origin) return
  const want = `${origin.replace(/\/$/, '')}/telegram`
  const already = await env.SAVES.get(WEBHOOK_META)
  if (already === want) return
  const secret = await webhookSecret(env.BOT_TOKEN)
  const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: want,
      secret_token: secret,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  })
  if (res.ok) await env.SAVES.put(WEBHOOK_META, want)
}

async function handleTelegramWebhook(request, env) {
  const got = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || ''
  const want = await webhookSecret(env.BOT_TOKEN)
  if (!got || got !== want) {
    return json({ error: 'unauthorized' }, 401)
  }

  let update
  try {
    update = await request.json()
  } catch {
    return json({ ok: true }, 200)
  }

  const msg = update?.message
  const text = typeof msg?.text === 'string' ? msg.text.trim() : ''
  const chatId = msg?.chat?.id
  const fromId = msg?.from?.id
  if (!text || !chatId) return json({ ok: true }, 200)

  const cmd = text.split(/\s+/)[0].replace(/@\w+$/, '').toLowerCase()
  if (cmd !== '/stats') return json({ ok: true }, 200)
  if (!isAdmin(env, fromId)) return json({ ok: true }, 200)

  const body = await formatStats(env)
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: body }),
  })
  return json({ ok: true }, 200)
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0
}

function rev(save) {
  return num(save?.syncRev)
}

function sumValues(obj) {
  if (!obj || typeof obj !== 'object') return 0
  let n = 0
  for (const v of Object.values(obj)) n += Number(v) || 0
  return n
}

function countTruthy(obj) {
  if (!obj || typeof obj !== 'object') return 0
  let n = 0
  for (const v of Object.values(obj)) if (v) n += 1
  return n
}

function progressScore(save) {
  if (!save || typeof save !== 'object') return 0
  const shop = sumValues(save.shopOwned)
  const owned = sumValues(save.owned)
  const tasks = sumValues(save.taskDone)
  let staff = 0
  if (save.staffMembers && typeof save.staffMembers === 'object') {
    for (const arr of Object.values(save.staffMembers)) {
      if (Array.isArray(arr)) staff += arr.length
    }
  }
  const flags =
    countTruthy(save.expansions) +
    countTruthy(save.branches) +
    countTruthy(save.ownedTobacco)
  const cash = Math.max(0, num(save.cash))
  return (
    shop * 1_000_000_000 +
    owned * 10_000_000 +
    staff * 1_000_000 +
    flags * 100_000 +
    tasks * 100 +
    cash
  )
}

function remoteAhead(existing, incoming) {
  const er = rev(existing)
  const ir = rev(incoming)
  if (er !== ir) return er > ir
  const es = progressScore(existing)
  const is = progressScore(incoming)
  if (es !== is) return es > is
  return num(existing?.lastActive) > num(incoming?.lastActive)
}

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...(cors || {}) },
  })
}

async function validateInitDataUserId(initData, botToken) {
  if (!initData || !botToken) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const entries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

  const enc = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const secret = await crypto.subtle.sign('HMAC', secretKey, enc.encode(botToken))
  const checkKey = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', checkKey, enc.encode(dataCheckString))
  const hex = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  if (hex !== hash) return null

  const authDate = Number(params.get('auth_date') || 0)
  if (authDate && Date.now() / 1000 - authDate > 86400) return null

  const userRaw = params.get('user')
  if (!userRaw) return null
  try {
    const user = JSON.parse(userRaw)
    const id = user?.id
    return typeof id === 'number' && Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}
