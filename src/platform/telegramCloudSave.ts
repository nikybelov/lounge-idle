/**
 * Кросс-девайс сейв через Telegram.WebApp.CloudStorage.
 * Телефон и Mac с одним аккаунтом делят прогресс без своего бэкенда.
 * Лимит Telegram: 4096 символов на ключ → чанки.
 */
import type { GameState } from '../game/state'
import {
  detectAppFlavor,
  getTelegramWebApp,
  type TelegramCloudStorage,
} from './runtime'

const META_KEY = 'li_save_meta'
const CHUNK_PREFIX = 'li_save_'
/** Запас под UTF-8 / старые клиенты (жёсткий лимит 4096). */
const CHUNK_SIZE = 3000
const CLOUD_DEBOUNCE_MS = 900

type CloudMeta = {
  v: 1
  n: number
  t: number
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null
let cloudPending: GameState | null = null
let cloudWriting = false

function cloud(): TelegramCloudStorage | null {
  if (detectAppFlavor() !== 'telegram') return null
  const wa = getTelegramWebApp()
  if (!wa?.CloudStorage) return null
  if (wa.isVersionAtLeast && !wa.isVersionAtLeast('6.9')) return null
  return wa.CloudStorage
}

function setItem(cs: TelegramCloudStorage, key: string, value: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      cs.setItem(key, value, (err, ok) => {
        resolve(!err && ok !== false)
      })
    } catch {
      resolve(false)
    }
  })
}

function getItem(cs: TelegramCloudStorage, key: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      cs.getItem(key, (err, value) => {
        if (err) resolve(null)
        else resolve(typeof value === 'string' ? value : null)
      })
    } catch {
      resolve(null)
    }
  })
}

function getItems(
  cs: TelegramCloudStorage,
  keys: string[],
): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    if (keys.length === 0) {
      resolve({})
      return
    }
    try {
      cs.getItems(keys, (err, values) => {
        if (err || !values) resolve({})
        else resolve(values)
      })
    } catch {
      resolve({})
    }
  })
}

function removeItems(cs: TelegramCloudStorage, keys: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (keys.length === 0) {
      resolve()
      return
    }
    try {
      if (typeof cs.removeItems === 'function') {
        cs.removeItems(keys, () => resolve())
        return
      }
      let left = keys.length
      for (const key of keys) {
        cs.removeItem(key, () => {
          left -= 1
          if (left <= 0) resolve()
        })
      }
    } catch {
      resolve()
    }
  })
}

function chunkPayload(raw: string): string[] {
  const out: string[] = []
  for (let i = 0; i < raw.length; i += CHUNK_SIZE) {
    out.push(raw.slice(i, i + CHUNK_SIZE))
  }
  return out.length > 0 ? out : ['']
}

function chunkKey(i: number): string {
  return `${CHUNK_PREFIX}${i}`
}

export function isTelegramCloudSaveAvailable(): boolean {
  return cloud() !== null
}

/** Прочитать сырой JSON сейва из облака (или null). */
export async function readTelegramCloudSaveRaw(): Promise<string | null> {
  const cs = cloud()
  if (!cs) return null

  const metaRaw = await getItem(cs, META_KEY)
  if (!metaRaw) return null

  let meta: CloudMeta
  try {
    meta = JSON.parse(metaRaw) as CloudMeta
  } catch {
    return null
  }
  if (meta.v !== 1 || !Number.isFinite(meta.n) || meta.n < 1) return null

  const keys = Array.from({ length: meta.n }, (_, i) => chunkKey(i))
  const values = await getItems(cs, keys)
  let raw = ''
  for (let i = 0; i < meta.n; i++) {
    const part = values[chunkKey(i)]
    if (typeof part !== 'string') return null
    raw += part
  }
  return raw.length > 0 ? raw : null
}

/** Записать JSON сейва в облако (чанки). */
export async function writeTelegramCloudSaveRaw(
  raw: string,
  lastActive: number,
): Promise<boolean> {
  const cs = cloud()
  if (!cs) return false

  const parts = chunkPayload(raw)
  const meta: CloudMeta = { v: 1, n: parts.length, t: lastActive }

  const okMeta = await setItem(cs, META_KEY, JSON.stringify(meta))
  if (!okMeta) return false

  for (let i = 0; i < parts.length; i++) {
    const ok = await setItem(cs, chunkKey(i), parts[i]!)
    if (!ok) return false
  }

  // Стереть хвост от более длинного старого сейва
  const stale: string[] = []
  for (let i = parts.length; i < parts.length + 32; i++) {
    stale.push(chunkKey(i))
  }
  await removeItems(cs, stale)
  return true
}

export async function writeTelegramCloudSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  try {
    const raw = JSON.stringify(state)
    return await writeTelegramCloudSaveRaw(raw, state.lastActive ?? Date.now())
  } catch (err) {
    console.warn('[telegram] cloud save failed', err)
    return false
  }
}

export async function clearTelegramCloudSave(): Promise<void> {
  const cs = cloud()
  if (!cs) return
  const metaRaw = await getItem(cs, META_KEY)
  let n = 0
  if (metaRaw) {
    try {
      const meta = JSON.parse(metaRaw) as CloudMeta
      if (Number.isFinite(meta.n)) n = Math.max(0, Math.floor(meta.n))
    } catch {
      /* ignore */
    }
  }
  const keys = [META_KEY, ...Array.from({ length: Math.max(n, 48) }, (_, i) => chunkKey(i))]
  await removeItems(cs, keys)
}

/**
 * Свести локальный и облачный сейв.
 * Нет локального blob → взять облако.
 * Облако новее по lastActive → перезаписать localStorage.
 * Локальный новее → догнать облако.
 */
export async function mergeTelegramCloudIntoLocal(
  localHasBlob: boolean,
  local: GameState,
  applyCloudRaw: (raw: string) => GameState,
): Promise<GameState> {
  const cloudRaw = await readTelegramCloudSaveRaw()
  if (!cloudRaw) {
    if (localHasBlob && local.onboarded) {
      void writeTelegramCloudSave(local)
    }
    return local
  }

  let cloudTs = 0
  try {
    const peek = JSON.parse(cloudRaw) as { lastActive?: number; v?: number }
    if (peek.v !== 1) return local
    cloudTs = typeof peek.lastActive === 'number' ? peek.lastActive : 0
  } catch {
    return local
  }

  if (!localHasBlob) {
    return applyCloudRaw(cloudRaw)
  }

  const localTs = local.lastActive ?? 0
  if (cloudTs > localTs) {
    return applyCloudRaw(cloudRaw)
  }

  if (local.onboarded && localTs > cloudTs) {
    void writeTelegramCloudSave(local)
  }
  return local
}

/** Debounce-пуш в облако после локального сейва. */
export function scheduleTelegramCloudSave(state: GameState): void {
  if (!cloud() || !state.onboarded) return
  cloudPending = state
  if (cloudTimer) clearTimeout(cloudTimer)
  cloudTimer = setTimeout(() => {
    cloudTimer = null
    const pending = cloudPending
    cloudPending = null
    if (pending) void flushTelegramCloudSave(pending)
  }, CLOUD_DEBOUNCE_MS)
}

export async function flushTelegramCloudSave(state: GameState): Promise<boolean> {
  if (!cloud() || !state.onboarded) return false
  if (cloudTimer) {
    clearTimeout(cloudTimer)
    cloudTimer = null
  }
  cloudPending = null
  if (cloudWriting) {
    scheduleTelegramCloudSave(state)
    return false
  }
  cloudWriting = true
  try {
    return await writeTelegramCloudSave(state)
  } finally {
    cloudWriting = false
  }
}
