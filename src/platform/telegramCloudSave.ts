/**
 * Кросс-девайс сейв через Telegram.WebApp.CloudStorage.
 * Важно: при ошибке чтения Mac НЕ должен затирать облако слабым локальным сейвом.
 */
import type { GameState } from '../game/state'
import {
  detectAppFlavor,
  getTelegramWebApp,
  type TelegramCloudStorage,
} from './runtime'

const META_KEY = 'li_save_meta'
const CASH_KEY = 'li_cash'
const CHUNK_PREFIX = 'li_save_'
/** Запас под UTF-8 (лимит Telegram 4096). */
const CHUNK_SIZE = 2800
const CLOUD_DEBOUNCE_MS = 600
const CLOUD_OP_TIMEOUT_MS = 12000

type CloudMeta = {
  v: 1
  n: number
  t: number
  cash?: number
}

export type CloudMergeResult = {
  state: GameState
  source: 'local' | 'cloud' | 'none'
  cloudAvailable: boolean
  cloudHadSave: boolean
  error?: string
  localCash?: number
  cloudCash?: number
  uploaded?: boolean
  detail?: string
}

let cloudTimer: ReturnType<typeof setTimeout> | null = null
let cloudPending: GameState | null = null
let cloudWriting = false
let lastCloudWriteOk: boolean | null = null

function cloud(): TelegramCloudStorage | null {
  if (detectAppFlavor() !== 'telegram') return null
  const wa = getTelegramWebApp()
  if (!wa?.CloudStorage) return null
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

export function saveProgressScore(raw: {
  onboarded?: boolean
  cash?: number
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

/** Только sequential getItem — getItems на Desktop часто врёт. */
async function readChunks(
  cs: TelegramCloudStorage,
  n: number,
): Promise<string | null> {
  let raw = ''
  for (let i = 0; i < n; i++) {
    let part: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      part = await getItem(cs, chunkKey(i))
      if (part != null) break
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)))
    }
    if (part == null) return null
    raw += part
  }
  return raw.length > 0 ? raw : null
}

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

  return readChunks(cs, meta.n)
}

export async function peekTelegramCloudMeta(): Promise<CloudMeta | null> {
  const cs = cloud()
  if (!cs) return null
  const metaRaw = await getItem(cs, META_KEY)
  if (!metaRaw) return null
  try {
    const meta = JSON.parse(metaRaw) as CloudMeta
    if (meta.v !== 1) return null
    return meta
  } catch {
    return null
  }
}

export async function peekTelegramCloudCash(): Promise<number | null> {
  const cs = cloud()
  if (!cs) return null
  const fromKey = await getItem(cs, CASH_KEY)
  if (fromKey != null && Number.isFinite(Number(fromKey))) {
    return Math.max(0, Math.floor(Number(fromKey)))
  }
  const meta = await peekTelegramCloudMeta()
  if (meta && typeof meta.cash === 'number') return Math.max(0, Math.floor(meta.cash))
  return null
}

export async function writeTelegramCloudSaveRaw(
  raw: string,
  lastActive: number,
  cash: number,
): Promise<boolean> {
  const cs = cloud()
  if (!cs) return false

  const parts = chunkPayload(raw)
  const meta: CloudMeta = {
    v: 1,
    n: parts.length,
    t: lastActive,
    cash: Math.max(0, Math.floor(cash)),
  }

  // Сначала чанки, потом cash/meta — meta последней = «сейв готов»
  for (let i = 0; i < parts.length; i++) {
    const ok = await setItem(cs, chunkKey(i), parts[i]!)
    if (!ok) {
      lastCloudWriteOk = false
      return false
    }
  }

  const okCash = await setItem(cs, CASH_KEY, String(meta.cash))
  if (!okCash) {
    lastCloudWriteOk = false
    return false
  }

  const okMeta = await setItem(cs, META_KEY, JSON.stringify(meta))
  if (!okMeta) {
    lastCloudWriteOk = false
    return false
  }

  lastCloudWriteOk = true
  return true
}

export async function writeTelegramCloudSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  try {
    const raw = JSON.stringify(state)
    return await writeTelegramCloudSaveRaw(
      raw,
      state.lastActive ?? Date.now(),
      state.cash ?? 0,
    )
  } catch (err) {
    console.warn('[telegram] cloud save failed', err)
    lastCloudWriteOk = false
    return false
  }
}

export async function clearTelegramCloudSave(): Promise<void> {
  const cs = cloud()
  if (!cs) return
  const meta = await peekTelegramCloudMeta()
  const n = meta && Number.isFinite(meta.n) ? Math.max(0, Math.floor(meta.n)) : 48
  const keys = [
    META_KEY,
    CASH_KEY,
    ...Array.from({ length: Math.max(n, 48) }, (_, i) => chunkKey(i)),
  ]
  for (const key of keys) {
    await new Promise<void>((resolve) => {
      try {
        cs.removeItem(key, () => resolve())
      } catch {
        resolve()
      }
    })
  }
}

/**
 * Свести локальный и облачный сейв.
 * Никогда не затираем облако, если оно не прочиталось или там больше кассы.
 */
export async function mergeTelegramCloudIntoLocal(
  localHasBlob: boolean,
  local: GameState,
  applyCloudRaw: (raw: string) => GameState,
): Promise<CloudMergeResult> {
  const localCash = Math.max(0, Math.floor(local.cash ?? 0))
  const cs = cloud()
  if (!cs) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      localCash,
      error: 'CloudStorage недоступен на этом клиенте',
    }
  }

  const probeKey = 'li_probe'
  const probeVal = `p${Date.now()}`
  if (!(await setItem(cs, probeKey, probeVal))) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      localCash,
      error: 'Облако не пишет (клиент Telegram?)',
    }
  }
  if ((await getItem(cs, probeKey)) !== probeVal) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      localCash,
      error: 'Облако не читает обратно',
    }
  }

  const meta = await peekTelegramCloudMeta()
  const hintCash = await peekTelegramCloudCash()

  if (!meta) {
    // Правда пусто — можно залить локальный
    let uploaded = false
    if (localHasBlob && local.onboarded) {
      uploaded = await writeTelegramCloudSave(local)
    }
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: false,
      localCash,
      cloudCash: 0,
      uploaded,
      detail: uploaded
        ? `облако было пусто → записали ${localCash}₽`
        : localHasBlob
          ? `облако пусто, запись не удалась (местн. ${localCash}₽)`
          : 'облако пусто, локального сейва нет',
    }
  }

  const cloudHint = hintCash ?? meta.cash ?? 0
  const cloudRaw = await readChunks(cs, meta.n)

  if (!cloudRaw) {
    // Облако ЕСТЬ, но Mac/клиент не вытащил чанки — НЕ затираем
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash: cloudHint,
      uploaded: false,
      detail: `облако ~${cloudHint}₽ не прочиталось на этом устройстве (не затираем)`,
      error: 'cloud_read_failed',
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
        localCash,
        cloudCash: cloudHint,
        error: 'Облачный сейв другой версии',
      }
    }
  } catch {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash: cloudHint,
      detail: `облако битое, hint ${cloudHint}₽ — не затираем`,
      error: 'cloud_corrupt',
    }
  }

  const cloudCash = Math.max(0, Math.floor(cloudPeek.cash ?? cloudHint))

  if (!localHasBlob) {
    return {
      state: applyCloudRaw(cloudRaw),
      source: 'cloud',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash: 0,
      cloudCash,
      detail: `взяли облако ${cloudCash}₽`,
    }
  }

  const preferCloud =
    cloudCash > localCash ||
    (cloudCash === localCash &&
      saveProgressScore(cloudPeek) > saveProgressScore(local)) ||
    (cloudCash === localCash &&
      saveProgressScore(cloudPeek) === saveProgressScore(local) &&
      (cloudPeek.lastActive ?? 0) > (local.lastActive ?? 0)) ||
    (!local.onboarded && !!cloudPeek.onboarded)

  if (preferCloud) {
    return {
      state: applyCloudRaw(cloudRaw),
      source: 'cloud',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash,
      detail: `облако ${cloudCash}₽ > местн. ${localCash}₽`,
    }
  }

  // Локальный богаче — пишем в облако, но только если реально больше
  if (local.onboarded && localCash >= cloudCash) {
    const uploaded = await writeTelegramCloudSave(local)
    const verified = uploaded ? await peekTelegramCloudCash() : null
    const ok = uploaded && verified === localCash
    return {
      state: local,
      source: 'local',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash,
      uploaded: ok,
      detail: ok
        ? `местн. ${localCash}₽ записали в облако (было ${cloudCash}₽)`
        : `местн. ${localCash}₽, облако не подтвердило (там ${verified ?? '—'}₽)`,
    }
  }

  return {
    state: local,
    source: 'local',
    cloudAvailable: true,
    cloudHadSave: true,
    localCash,
    cloudCash,
    detail: `оставили местн. ${localCash}₽ (облако ${cloudCash}₽)`,
  }
}

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
    // Не затирать облако более бедной кассой
    const cloudCash = await peekTelegramCloudCash()
    const localCash = Math.max(0, Math.floor(state.cash ?? 0))
    if (cloudCash != null && cloudCash > localCash) {
      lastCloudWriteOk = false
      return false
    }
    return await writeTelegramCloudSave(state)
  } finally {
    cloudWriting = false
  }
}
