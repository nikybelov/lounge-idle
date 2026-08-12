/**
 * Автосинк сейва через наш Worker (телефон ↔ Mac).
 * Побеждает больший syncRev (игровые сохранения), затем прогресс, затем lastActive.
 * Сворот приложения syncRev не бампает — иначе телефон затирает Mac.
 */
import type { GameState } from '../game/state'
import { getTelegramWebApp, isTelegramMiniApp } from './runtime'

const TIMEOUT_MS = 8000

export type RemoteSyncResult = {
  state: GameState
  source: 'local' | 'remote' | 'none'
  remoteCash?: number
  localCash?: number
  uploaded?: boolean
  detail?: string
  available: boolean
}

function syncUrl(): string | null {
  const raw = (import.meta.env.VITE_TG_SYNC_URL as string | undefined)?.trim()
  if (!raw) return null
  return raw.replace(/\/$/, '')
}

export function isRemoteSyncConfigured(): boolean {
  return Boolean(syncUrl()) && isTelegramMiniApp()
}

function initDataHeader(): string | null {
  const wa = getTelegramWebApp()
  const data = wa?.initData
  return data && data.length > 0 ? data : null
}

function tsOf(s: { lastActive?: number } | null | undefined): number {
  return typeof s?.lastActive === 'number' && Number.isFinite(s.lastActive)
    ? Math.floor(s.lastActive)
    : 0
}

function revOf(s: { syncRev?: number } | null | undefined): number {
  return typeof s?.syncRev === 'number' && Number.isFinite(s.syncRev)
    ? Math.max(0, Math.floor(s.syncRev))
    : 0
}

/** Сколько «прогресса» в сейве — покупки важнее кассы. */
export function progressScore(s: {
  cash?: number
  shopOwned?: Record<string, number>
  owned?: Record<string, number>
  taskDone?: Record<string, number>
  staffMembers?: Record<string, number[]>
  expansions?: Record<string, boolean>
  branches?: Record<string, boolean>
  ownedTobacco?: Record<string, boolean>
} | null | undefined): number {
  if (!s) return 0
  let shop = 0
  for (const v of Object.values(s.shopOwned || {})) shop += Number(v) || 0
  let owned = 0
  for (const v of Object.values(s.owned || {})) owned += Number(v) || 0
  let tasks = 0
  for (const v of Object.values(s.taskDone || {})) tasks += Number(v) || 0
  let staff = 0
  for (const arr of Object.values(s.staffMembers || {})) {
    if (Array.isArray(arr)) staff += arr.length
  }
  let flags = 0
  for (const v of Object.values(s.expansions || {})) if (v) flags += 1
  for (const v of Object.values(s.branches || {})) if (v) flags += 1
  for (const v of Object.values(s.ownedTobacco || {})) if (v) flags += 1
  const cash = Math.max(0, Math.floor(s.cash ?? 0))
  return (
    shop * 1_000_000_000 +
    owned * 10_000_000 +
    staff * 1_000_000 +
    flags * 100_000 +
    tasks * 100 +
    cash
  )
}

/** remote строго лучше local → берём remote */
function remoteBeatsLocal(remote: GameState, local: GameState): boolean {
  const rr = revOf(remote)
  const lr = revOf(local)
  if (rr !== lr) return rr > lr
  const rs = progressScore(remote)
  const ls = progressScore(local)
  if (rs !== ls) return rs > ls
  return tsOf(remote) > tsOf(local)
}

function localBeatsRemote(local: GameState, remote: GameState): boolean {
  return remoteBeatsLocal(local, remote)
}

async function fetchJson(
  path: string,
  init: RequestInit,
  opts?: { keepalive?: boolean },
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const base = syncUrl()
  const initData = initDataHeader()
  if (!base || !initData) return { ok: false, status: 0, body: {} }

  const keepalive = Boolean(opts?.keepalive)
  const ctrl = keepalive ? null : new AbortController()
  const t = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      keepalive,
      ...(ctrl ? { signal: ctrl.signal } : {}),
      headers: {
        ...(init.headers || {}),
        'X-Telegram-Init-Data': initData,
      },
    })
    let body: Record<string, unknown> = {}
    try {
      body = (await res.json()) as Record<string, unknown>
    } catch {
      body = {}
    }
    return { ok: res.ok, status: res.status, body }
  } catch {
    return { ok: false, status: 0, body: {} }
  } finally {
    if (t) clearTimeout(t)
  }
}

/** Ждём initData — после холодного старта Mini App иногда пустой первые сотни мс. */
export async function waitForTelegramInitData(ms = 2500): Promise<boolean> {
  if (initDataHeader()) return true
  const start = Date.now()
  while (Date.now() - start < ms) {
    await new Promise((r) => setTimeout(r, 50))
    if (initDataHeader()) return true
  }
  return Boolean(initDataHeader())
}

export async function pullRemoteSave(): Promise<{
  save: GameState | null
  cash: number
  lastActive: number
  syncRev: number
  ok: boolean
}> {
  const res = await fetchJson('/', { method: 'GET' })
  if (!res.ok) return { save: null, cash: 0, lastActive: 0, syncRev: 0, ok: false }
  const save = (res.body.save as GameState | null) ?? null
  const cash =
    typeof res.body.cash === 'number'
      ? Math.floor(res.body.cash)
      : Math.floor(save?.cash ?? 0)
  const lastActive =
    typeof res.body.lastActive === 'number'
      ? Math.floor(res.body.lastActive)
      : tsOf(save)
  const syncRev =
    typeof res.body.syncRev === 'number'
      ? Math.floor(res.body.syncRev)
      : revOf(save)
  return { save, cash, lastActive, syncRev, ok: true }
}

const KEEPALIVE_MAX = 60_000

export async function pushRemoteSave(
  state: GameState,
  opts?: { keepalive?: boolean },
): Promise<{
  ok: boolean
  remoteCash?: number
  reason?: string
}> {
  if (!state.onboarded) return { ok: false, reason: 'not_onboarded' }
  if (!state.lastActive) state.lastActive = Date.now()
  if (typeof state.syncRev !== 'number' || !Number.isFinite(state.syncRev)) {
    state.syncRev = 0
  }
  const body = JSON.stringify({ save: state })
  // keepalive лимит ~64KB — если сейв больше, шлём обычным fetch
  const keepalive = Boolean(opts?.keepalive) && body.length <= KEEPALIVE_MAX
  const res = await fetchJson(
    '/',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
    { keepalive },
  )
  if (res.status === 409) {
    return {
      ok: false,
      reason:
        typeof res.body.reason === 'string' ? res.body.reason : 'remote_ahead',
      remoteCash:
        typeof res.body.cash === 'number' ? Math.floor(res.body.cash) : undefined,
    }
  }
  if (!res.ok) return { ok: false, reason: 'http' }
  return {
    ok: true,
    remoteCash:
      typeof res.body.cash === 'number' ? Math.floor(res.body.cash) : undefined,
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushPending: GameState | null = null

export function scheduleRemoteSave(state: GameState): void {
  if (!isRemoteSyncConfigured() || !state.onboarded) return
  pushPending = state
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = null
    const pending = pushPending
    pushPending = null
    if (pending) void pushRemoteSave(pending)
  }, 350)
}

export async function flushRemoteSave(
  state: GameState,
  opts?: { keepalive?: boolean },
): Promise<boolean> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  pushPending = null
  const res = await pushRemoteSave(state, opts)
  return res.ok
}

export async function mergeRemoteSave(
  localHasBlob: boolean,
  local: GameState,
  applyCloudRaw: (raw: string) => GameState,
): Promise<RemoteSyncResult | null> {
  if (!isRemoteSyncConfigured()) return null
  await waitForTelegramInitData()
  if (!initDataHeader()) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      available: false,
      localCash: Math.floor(local.cash ?? 0),
      detail: 'Нет initData — открой игру из бота, не из браузера',
    }
  }

  const localCash = Math.max(0, Math.floor(local.cash ?? 0))
  const pulled = await pullRemoteSave()
  if (!pulled.ok) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      available: false,
      localCash,
      detail: 'Сервер синка не ответил — играем локально',
    }
  }

  if (!pulled.save) {
    let uploaded = false
    if (localHasBlob && local.onboarded) {
      const push = await pushRemoteSave(local)
      uploaded = push.ok
    }
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      available: true,
      localCash,
      remoteCash: 0,
      uploaded,
      detail: uploaded
        ? `сервер пуст → отправили ${localCash}₽`
        : localHasBlob
          ? `сервер пуст, отправка не удалась`
          : 'сервер пуст',
    }
  }

  const remoteCash = pulled.cash
  const remote = pulled.save

  if (!localHasBlob || !local.onboarded || remoteBeatsLocal(remote, local)) {
    return {
      state: applyCloudRaw(JSON.stringify(remote)),
      source: 'remote',
      available: true,
      localCash,
      remoteCash,
      detail: `с сервера ${remoteCash}₽ (rev ${revOf(remote)})`,
    }
  }

  // Локальный строго сильнее → пушим. Ничья — не затираем сервер просто так.
  if (local.onboarded && localBeatsRemote(local, remote)) {
    const push = await pushRemoteSave(local)
    return {
      state: local,
      source: 'local',
      available: true,
      localCash,
      remoteCash,
      uploaded: push.ok,
      detail: push.ok
        ? `местн. rev ${revOf(local)} → сервер ok`
        : push.reason === 'remote_ahead' || push.reason === 'remote_newer'
          ? `на сервере новее (rev выше)`
          : `местн. не приняли на сервер`,
    }
  }

  return {
    state: local,
    source: 'local',
    available: true,
    localCash,
    remoteCash,
    detail: `без изменений · местн./сервер ${localCash}₽/${remoteCash}₽`,
  }
}
