/**
 * Cloudflare Worker: кросс-девайс сейв по Telegram user id.
 * Auth: HMAC проверка WebApp initData (официальный алгоритм Telegram).
 *
 * Secrets: BOT_TOKEN
 * Binding: SAVES (KV)
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
        if (!raw) return json({ save: null, cash: 0 }, 200, cors)
        let save = null
        try {
          save = JSON.parse(raw)
        } catch {
          return json({ error: 'corrupt' }, 500, cors)
        }
        const cash =
          typeof save?.cash === 'number' && Number.isFinite(save.cash)
            ? Math.floor(save.cash)
            : 0
        return json({ save, cash }, 200, cors)
      }

      if (request.method === 'PUT') {
        const body = await request.json()
        const save = body?.save
        if (!save || typeof save !== 'object' || save.v !== 1) {
          return json({ error: 'bad_save' }, 400, cors)
        }
        const cash =
          typeof save.cash === 'number' && Number.isFinite(save.cash)
            ? Math.floor(save.cash)
            : 0
        // Не даём более бедному клиенту затереть богатый сейв
        const existingRaw = await env.SAVES.get(key)
        if (existingRaw) {
          try {
            const existing = JSON.parse(existingRaw)
            const existingCash =
              typeof existing?.cash === 'number' ? Math.floor(existing.cash) : 0
            if (existingCash > cash) {
              return json(
                { ok: false, reason: 'remote_richer', cash: existingCash },
                409,
                cors,
              )
            }
          } catch {
            /* overwrite corrupt */
          }
        }
        await env.SAVES.put(key, JSON.stringify(save), {
          metadata: { cash, updatedAt: Date.now() },
        })
        return json({ ok: true, cash }, 200, cors)
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

  // Optional: reject old auth_date (> 24h)
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
