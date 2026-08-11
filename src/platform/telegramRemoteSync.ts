/**
 * Автосинк сейва через наш Worker (телефон ↔ Mac).
 * Требует VITE_TG_SYNC_URL и настоящий initData из Telegram.
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
  ok: boolean
}> {
  const res = await fetchJson('/', { method: 'GET' })
  if (!res.ok) return { save: null, cash: 0, ok: false }
  const save = (res.body.save as GameState | null) ?? null
  const cash =
    typeof res.body.cash === 'number'
      ? Math.floor(res.body.cash)
      : Math.floor(save?.cash ?? 0)
  return { save, cash, ok: true }
}

export async function pushRemoteSave(state: GameState): Promise<{
  ok: boolean
  remoteCash?: number
  reason?: string
}> {
  if (!state.onboarded) return { ok: false, reason: 'not_onboarded' }
  const res = await fetchJson('/', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ save: state }),
  })
  if (res.status === 409) {
    return {
      ok: false,
      reason: 'remote_richer',
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
    // Сервер недоступен — не мешаем игре
    if (localHasBlob && local.onboarded) {
      void pushRemoteSave(local)
    }
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
  if (!localHasBlob || remoteCash > localCash || (!local.onboarded && pulled.save.onboarded)) {
    return {
      state: applyCloudRaw(JSON.stringify(pulled.save)),
      source: 'remote',
      available: true,
      localCash,
      remoteCash,
      detail: `с сервера ${remoteCash}₽ (было местн. ${localCash}₽)`,
    }
  }

  if (local.onboarded && localCash >= remoteCash) {
    const push = await pushRemoteSave(local)
    return {
      state: local,
      source: 'local',
      available: true,
      localCash,
      remoteCash,
      uploaded: push.ok,
      detail: push.ok
        ? `местн. ${localCash}₽ → сервер ok`
        : push.reason === 'remote_richer'
          ? `на сервере уже ${push.remoteCash}₽`
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
