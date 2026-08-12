/**
 * DeviceStorage (Bot API 9+) — локальный сейв на устройстве.
 * В отличие от localStorage в iOS WebView, не стирается при закрытии Mini App.
 * Если клиент режет длинные values — пишем чанками как CloudStorage.
 */
import type { GameState } from '../game/state'
import { getTelegramWebApp, type TelegramCloudStorage } from './runtime'

const SAVE_KEY = 'li_device_save'
const META_KEY = 'li_device_meta'
const CHUNK_PREFIX = 'li_d'
const CHUNK_SIZE = 3500
const TIMEOUT_MS = 5000

function device(): TelegramCloudStorage | null {
  const wa = getTelegramWebApp()
  return wa?.DeviceStorage ?? null
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false
    const t = setTimeout(() => {
      if (!done) {
        done = true
        resolve(fallback)
      }
    }, ms)
    p.then((v) => {
      if (!done) {
        done = true
        clearTimeout(t)
        resolve(v)
      }
    }).catch(() => {
      if (!done) {
        done = true
        clearTimeout(t)
        resolve(fallback)
      }
    })
  })
}

function setItem(ds: TelegramCloudStorage, key: string, value: string): Promise<boolean> {
  return withTimeout(
    new Promise((resolve) => {
      try {
        ds.setItem(key, value, (err, ok) => resolve(!err && ok !== false))
      } catch {
        resolve(false)
      }
    }),
    TIMEOUT_MS,
    false,
  )
}

function getItem(ds: TelegramCloudStorage, key: string): Promise<string | null> {
  return withTimeout(
    new Promise((resolve) => {
      try {
        ds.getItem(key, (err, value) => {
          if (err) resolve(null)
          else if (typeof value === 'string' && value.length > 0) resolve(value)
          else resolve(null)
        })
      } catch {
        resolve(null)
      }
    }),
    TIMEOUT_MS,
    null,
  )
}

export function isTelegramDeviceSaveAvailable(): boolean {
  return device() !== null
}

export async function writeTelegramDeviceSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  const ds = device()
  if (!ds) return false
  try {
    const json = JSON.stringify(state)
    // Сначала пробуем одним ключом (DeviceStorage до 5MB)
    if (json.length <= 4000) {
      return await setItem(ds, SAVE_KEY, json)
    }
    if (json.length <= 480_000) {
      const ok = await setItem(ds, SAVE_KEY, json)
      if (ok) {
        await setItem(ds, META_KEY, JSON.stringify({ v: 1, n: 0 }))
        return true
      }
    }
    // Чанки, если клиент режет длинные values
    const parts: string[] = []
    for (let i = 0; i < json.length; i += CHUNK_SIZE) {
      parts.push(json.slice(i, i + CHUNK_SIZE))
    }
    for (let i = 0; i < parts.length; i++) {
      if (!(await setItem(ds, `${CHUNK_PREFIX}${i}`, parts[i]!))) return false
    }
    return await setItem(
      ds,
      META_KEY,
      JSON.stringify({
        v: 1,
        n: parts.length,
        syncRev: state.syncRev ?? 0,
        t: state.lastActive ?? Date.now(),
      }),
    )
  } catch {
    return false
  }
}

export async function readTelegramDeviceSaveRaw(): Promise<string | null> {
  const ds = device()
  if (!ds) return null
  const direct = await getItem(ds, SAVE_KEY)
  if (direct && direct.length > 2) {
    try {
      const parsed = JSON.parse(direct) as { v?: number }
      if (parsed?.v === 1) return direct
    } catch {
      /* try chunks */
    }
  }
  const metaRaw = await getItem(ds, META_KEY)
  if (!metaRaw) return direct && direct.length > 2 ? direct : null
  try {
    const meta = JSON.parse(metaRaw) as { v?: number; n?: number }
    if (meta.v !== 1 || !meta.n || meta.n < 1 || meta.n > 64) {
      return direct && direct.length > 2 ? direct : null
    }
    let json = ''
    for (let i = 0; i < meta.n; i++) {
      const part = await getItem(ds, `${CHUNK_PREFIX}${i}`)
      if (part == null) return null
      json += part
    }
    return json.length > 2 ? json : null
  } catch {
    return direct && direct.length > 2 ? direct : null
  }
}

let deviceTimer: ReturnType<typeof setTimeout> | null = null
let devicePending: GameState | null = null

export function scheduleTelegramDeviceSave(state: GameState): void {
  if (!device() || !state.onboarded) return
  devicePending = state
  if (deviceTimer) clearTimeout(deviceTimer)
  deviceTimer = setTimeout(() => {
    deviceTimer = null
    const pending = devicePending
    devicePending = null
    if (pending) void writeTelegramDeviceSave(pending)
  }, 300)
}

export async function flushTelegramDeviceSave(state: GameState): Promise<boolean> {
  if (deviceTimer) {
    clearTimeout(deviceTimer)
    deviceTimer = null
  }
  devicePending = null
  return writeTelegramDeviceSave(state)
}
