/**
 * Автосинк сейва через наш Worker (телефон ↔ Mac).
 * Побеждает больший прогресс (инструменты/апгрейды), не касса:
 * после покупок cash падает, а lastActive на фоне часто «новее» без прогресса.
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
  // 1 уровень инструмента >> любой разумный cash
  return (
    shop * 1_000_000_000 +
    owned * 10_000_000 +
    staff * 1_000_000 +
    flags * 100_000 +
    tasks * 100 +
    cash
  )
}

function remoteBeatsLocal(
  remote: GameState,
  local: GameState,
): boolean {
  const rs = progressScore(remote)
  const ls = progressScore(local)
  if (rs !== ls) return rs > ls
  return tsOf(remote) > tsOf(local)
}

async function fetchJson(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const base = syncUrl()
  const initData = initDataHeader()
  if (!base || !initData) return { ok: false, status: 0, body: {} }

  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: ctrl.signal,
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
    clearTimeout(t)
  }
}

export async function pullRemoteSave(): Promise<{
  save: GameState | null
  cash: number
  lastActive: number
  ok: boolean
}> {
  const res = await fetchJson('/', { method: 'GET' })
  if (!res.ok) return { save: null, cash: 0, lastActive: 0, ok: false }
  const save = (res.body.save as GameState | null) ?? null
  const cash =
    typeof res.body.cash === 'number'
      ? Math.floor(res.body.cash)
      : Math.floor(save?.cash ?? 0)
  const lastActive =
    typeof res.body.lastActive === 'number'
      ? Math.floor(res.body.lastActive)
      : tsOf(save)
  return { save, cash, lastActive, ok: true }
}

export async function pushRemoteSave(state: GameState): Promise<{
  ok: boolean
  remoteCash?: number
  reason?: string
}> {
  if (!state.onboarded) return { ok: false, reason: 'not_onboarded' }
  if (!state.lastActive) state.lastActive = Date.now()
  const res = await fetchJson('/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ save: state }),
  })
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
  }, 900)
}

export async function flushRemoteSave(state: GameState): Promise<boolean> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  pushPending = null
  const res = await pushRemoteSave(state)
  return res.ok
}

export async function mergeRemoteSave(
  localHasBlob: boolean,
  local: GameState,
  applyCloudRaw: (raw: string) => GameState,
): Promise<RemoteSyncResult | null> {
  if (!isRemoteSyncConfigured()) return null
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
    // Не пушим вслепую — можем затереть чужой прогресс при сетевом сбое GET
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
      detail: `с сервера ${remoteCash}₽ (больше прогресса)`,
    }
  }

  // Локальный прогресс сильнее или равный + новее → пушим
  if (local.onboarded) {
    const push = await pushRemoteSave(local)
    return {
      state: local,
      source: 'local',
      available: true,
      localCash,
      remoteCash,
      uploaded: push.ok,
      detail: push.ok
        ? `местн. прогресс → сервер ok (${localCash}₽)`
        : push.reason === 'remote_ahead' || push.reason === 'remote_newer'
          ? `на сервере сильнее прогресс (${push.remoteCash ?? remoteCash}₽)`
          : `местн. ${localCash}₽, сервер не принял`,
    }
  }

  return {
    state: local,
    source: 'local',
    available: true,
    localCash,
    remoteCash,
    detail: `местн. ${localCash}₽ / сервер ${remoteCash}₽`,
  }
}
