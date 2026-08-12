/**
 * DeviceStorage (Bot API 9+) — локальный сейв на устройстве.
 * В отличие от localStorage в iOS WebView, не стирается при закрытии Mini App.
 */
import type { GameState } from '../game/state'
import { getTelegramWebApp, type TelegramCloudStorage } from './runtime'

const SAVE_KEY = 'li_device_save'
const TIMEOUT_MS = 2500

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

export function isTelegramDeviceSaveAvailable(): boolean {
  return device() !== null
}

export async function writeTelegramDeviceSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  const ds = device()
  if (!ds) return false
  try {
    const json = JSON.stringify(state)
    // DeviceStorage до ~5MB суммарно; один сейв обычно <100KB
    if (json.length > 500_000) return false
    return await withTimeout(
      new Promise<boolean>((resolve) => {
        try {
          ds.setItem(SAVE_KEY, json, (err, ok) => resolve(!err && ok !== false))
        } catch {
          resolve(false)
        }
      }),
      TIMEOUT_MS,
      false,
    )
  } catch {
    return false
  }
}

export async function readTelegramDeviceSaveRaw(): Promise<string | null> {
  const ds = device()
  if (!ds) return null
  return withTimeout(
    new Promise<string | null>((resolve) => {
      try {
        ds.getItem(SAVE_KEY, (err, value) => {
          if (err) resolve(null)
          else if (typeof value === 'string' && value.length > 2) resolve(value)
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
  }, 400)
}

export async function flushTelegramDeviceSave(state: GameState): Promise<boolean> {
  if (deviceTimer) {
    clearTimeout(deviceTimer)
    deviceTimer = null
  }
  devicePending = null
  return writeTelegramDeviceSave(state)
}
