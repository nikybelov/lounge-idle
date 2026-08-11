/**
 * Cloudflare Worker: кросс-девайс сейв по Telegram user id.
 * Конфликт: syncRev → progressScore → lastActive.
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    try {
      const initData = request.headers.get('X-Telegram-Init-Data') || ''
      const userId = await validateInitDataUserId(initData, env.BOT_TOKEN)
      if (!userId) {
        return json({ error: 'unauthorized' }, 401, cors)
      }

      const key = `lounge-idle:v1:${userId}`

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
    } catch (err) {
      return json(
        { error: 'server', message: err instanceof Error ? err.message : String(err) },
        500,
        cors,
      )
    }
  },
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
    headers: { 'Content-Type': 'application/json', ...cors },
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
