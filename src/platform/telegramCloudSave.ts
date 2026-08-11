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
const CHUNK_SIZE = 2800
const CLOUD_DEBOUNCE_MS = 600
const CLOUD_OP_TIMEOUT_MS = 8000

type CloudMeta = {
  v: 1
  n: number
  t: number
}

export type CloudMergeResult = {
  state: GameState
  /** Откуда взяли итоговый сейв */
  source: 'local' | 'cloud' | 'none'
  /** Облако вообще ответило / доступно */
  cloudAvailable: boolean
  cloudHadSave: boolean
  error?: string
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null
let cloudPending: GameState | null = null
let cloudWriting = false
let lastCloudWriteOk: boolean | null = null

function cloud(): TelegramCloudStorage | null {
  if (detectAppFlavor() !== 'telegram') return null
  const wa = getTelegramWebApp()
  if (!wa?.CloudStorage) return null
  // Не отсекаем по isVersionAtLeast — на части клиентов строка версии врёт.
  return wa.CloudStorage
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

function setItem(cs: TelegramCloudStorage, key: string, value: string): Promise<boolean> {
  return withTimeout(
    new Promise((resolve) => {
      try {
        cs.setItem(key, value, (err, ok) => {
          // success: err null/undefined, ok true или undefined
          resolve(!err && ok !== false)
        })
      } catch {
        resolve(false)
      }
    }),
    CLOUD_OP_TIMEOUT_MS,
    false,
  )
}

function getItem(cs: TelegramCloudStorage, key: string): Promise<string | null> {
  return withTimeout(
    new Promise((resolve) => {
      try {
        cs.getItem(key, (err, value) => {
          if (err) resolve(null)
          else if (typeof value === 'string' && value.length > 0) resolve(value)
          else resolve(null)
        })
      } catch {
        resolve(null)
      }
    }),
    CLOUD_OP_TIMEOUT_MS,
    null,
  )
}

function getItems(
  cs: TelegramCloudStorage,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return Promise.resolve({})
  return withTimeout(
    new Promise((resolve) => {
      try {
        cs.getItems(keys, (err, values) => {
          if (err || !values) resolve({})
          else resolve(values)
        })
      } catch {
        resolve({})
      }
    }),
    CLOUD_OP_TIMEOUT_MS,
    {},
  )
}

function removeItems(cs: TelegramCloudStorage, keys: string[]): Promise<void> {
  return withTimeout(
    new Promise<void>((resolve) => {
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
    }),
    CLOUD_OP_TIMEOUT_MS,
    undefined,
  ).then(() => undefined)
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

/** Грубый «вес» прогресса — без lastActive (иначе свежий Mac с 72₽ бьёт телефон с 1500₽). */
export function saveProgressScore(raw: {
  onboarded?: boolean
  cash?: number
  lastActive?: number
  taskDone?: Record<string, number>
  phase?: string
}): number {
  if (!raw.onboarded) return 0
  let tasks = 0
  if (raw.taskDone) {
    for (const v of Object.values(raw.taskDone)) {
      if (typeof v === 'number' && v > 0) tasks += v
    }
  }
  const phaseBonus =
    raw.phase === 'ownOnly' ? 50_000 : raw.phase === 'dual' ? 20_000 : 0
  return Math.max(0, Math.floor(raw.cash ?? 0)) + tasks * 500 + phaseBonus
}

export function isTelegramCloudSaveAvailable(): boolean {
  return cloud() !== null
}

export function lastTelegramCloudWriteOk(): boolean | null {
  return lastCloudWriteOk
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
  if (meta.v !== 1 || !Number.isFinite(meta.n) || meta.n < 1 || meta.n > 200) {
    return null
  }

  const keys = Array.from({ length: meta.n }, (_, i) => chunkKey(i))
  let values = await getItems(cs, keys)

  // Fallback: getItems на части клиентов пустой — читаем по одному
  const missing = keys.filter((k) => typeof values[k] !== 'string' || !values[k])
  if (missing.length > 0) {
    const next = { ...values }
    for (const k of missing) {
      const v = await getItem(cs, k)
      if (v != null) next[k] = v
    }
    values = next
  }

  let raw = ''
  for (let i = 0; i < meta.n; i++) {
    const part = values[chunkKey(i)]
    if (typeof part !== 'string') return null
    raw += part
  }
  return raw.length > 0 ? raw : null
}

/** Записать JSON сейва в облако (чанки). Сначала чанки, потом meta — атомарнее. */
export async function writeTelegramCloudSaveRaw(
  raw: string,
  lastActive: number,
): Promise<boolean> {
  const cs = cloud()
  if (!cs) return false

  const parts = chunkPayload(raw)
  const meta: CloudMeta = { v: 1, n: parts.length, t: lastActive }

  for (let i = 0; i < parts.length; i++) {
    const ok = await setItem(cs, chunkKey(i), parts[i]!)
    if (!ok) {
      lastCloudWriteOk = false
      return false
    }
  }

  const okMeta = await setItem(cs, META_KEY, JSON.stringify(meta))
  if (!okMeta) {
    lastCloudWriteOk = false
    return false
  }

  const stale: string[] = []
  for (let i = parts.length; i < parts.length + 16; i++) {
    stale.push(chunkKey(i))
  }
  await removeItems(cs, stale)
  lastCloudWriteOk = true
  return true
}

export async function writeTelegramCloudSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  try {
    const raw = JSON.stringify(state)
    return await writeTelegramCloudSaveRaw(raw, state.lastActive ?? Date.now())
  } catch (err) {
    console.warn('[telegram] cloud save failed', err)
    lastCloudWriteOk = false
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
 * Берём тот, у кого больше прогресс (не только lastActive — иначе пустой Mac побеждает).
 */
export async function mergeTelegramCloudIntoLocal(
  localHasBlob: boolean,
  local: GameState,
  applyCloudRaw: (raw: string) => GameState,
): Promise<CloudMergeResult> {
  const cs = cloud()
  if (!cs) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      error: 'CloudStorage недоступен на этом клиенте',
    }
  }

  // Проверка, что set/get реально работают (иначе Mac молча «пустой»)
  const probeKey = 'li_probe'
  const probeVal = `p${Date.now()}`
  const probeOk = await setItem(cs, probeKey, probeVal)
  if (!probeOk) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      error: 'Облако не пишет (клиент Telegram?)',
    }
  }
  const probeRead = await getItem(cs, probeKey)
  if (probeRead !== probeVal) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      error: 'Облако не читает обратно',
    }
  }

  let cloudRaw: string | null = null
  try {
    cloudRaw = await readTelegramCloudSaveRaw()
  } catch (err) {
    console.warn('[telegram] cloud read failed', err)
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: false,
      error: 'Не удалось прочитать облако',
    }
  }

  if (!cloudRaw) {
    if (localHasBlob && local.onboarded) {
      void writeTelegramCloudSave(local)
    }
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: false,
    }
  }

  let cloudPeek: {
    onboarded?: boolean
    cash?: number
    lastActive?: number
    taskDone?: Record<string, number>
    phase?: string
    v?: number
  }
  try {
    cloudPeek = JSON.parse(cloudRaw) as typeof cloudPeek
    if (cloudPeek.v !== 1) {
      return {
        state: local,
        source: localHasBlob ? 'local' : 'none',
        cloudAvailable: true,
        cloudHadSave: true,
        error: 'Облачный сейв другой версии',
      }
    }
  } catch {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: true,
      error: 'Облачный сейв битый',
    }
  }

  if (!localHasBlob) {
    return {
      state: applyCloudRaw(cloudRaw),
      source: 'cloud',
      cloudAvailable: true,
      cloudHadSave: true,
    }
  }

  const localScore = saveProgressScore(local)
  const cloudScore = saveProgressScore(cloudPeek)

  // lastActive — только тай-брейкер при одинаковом прогрессе
  const cloudTs = cloudPeek.lastActive ?? 0
  const localTs = local.lastActive ?? 0
  const preferCloud =
    cloudScore > localScore ||
    (cloudScore === localScore && cloudTs > localTs) ||
    (!local.onboarded && !!cloudPeek.onboarded)

  if (preferCloud) {
    return {
      state: applyCloudRaw(cloudRaw),
      source: 'cloud',
      cloudAvailable: true,
      cloudHadSave: true,
    }
  }

  if (local.onboarded && localScore >= cloudScore) {
    void writeTelegramCloudSave(local)
  }

  return {
    state: local,
    source: 'local',
    cloudAvailable: true,
    cloudHadSave: true,
  }
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
