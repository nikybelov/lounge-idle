/**
 * CloudStorage v2: один gzip+base64 blob (или короткие куски).
 * Старые чанки v1 на Desktop часто не читаются — Mac видит meta, но не body.
 */
import type { GameState } from '../game/state'
import {
  detectAppFlavor,
  getTelegramWebApp,
  type TelegramCloudStorage,
} from './runtime'

const META_KEY = 'li_meta2'
const CASH_KEY = 'li_cash'
const BLOB_PREFIX = 'li_b'
const LEGACY_META = 'li_save_meta'
const CHUNK_SIZE = 3500
const CLOUD_DEBOUNCE_MS = 500
const CLOUD_OP_TIMEOUT_MS = 15000

type CloudMeta = {
  v: 2
  n: number
  t: number
  cash: number
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
  return getTelegramWebApp()?.CloudStorage ?? null
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
        cs.setItem(key, value, (err, ok) => resolve(!err && ok !== false))
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

function blobKey(i: number): string {
  return `${BLOB_PREFIX}${i}`
}

async function gzipToBase64(text: string): Promise<string | null> {
  try {
    if (typeof CompressionStream === 'undefined') return null
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
    const buf = await new Response(stream).arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(bin)
  } catch {
    return null
  }
}

async function gunzipFromBase64(b64: string): Promise<string | null> {
  try {
    if (typeof DecompressionStream === 'undefined') return null
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'))
    return await new Response(stream).text()
  } catch {
    return null
  }
}

function splitBlob(b64: string): string[] {
  const out: string[] = []
  for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
    out.push(b64.slice(i, i + CHUNK_SIZE))
  }
  return out.length ? out : ['']
}

export function isTelegramCloudSaveAvailable(): boolean {
  return cloud() !== null
}

export function lastTelegramCloudWriteOk(): boolean | null {
  return lastCloudWriteOk
}

export async function peekTelegramCloudCash(): Promise<number | null> {
  const cs = cloud()
  if (!cs) return null
  const raw = await getItem(cs, CASH_KEY)
  if (raw != null && Number.isFinite(Number(raw))) {
    return Math.max(0, Math.floor(Number(raw)))
  }
  const metaRaw = await getItem(cs, META_KEY)
  if (!metaRaw) return null
  try {
    const meta = JSON.parse(metaRaw) as CloudMeta
    if (typeof meta.cash === 'number') return Math.max(0, Math.floor(meta.cash))
  } catch {
    /* ignore */
  }
  return null
}

async function readCloudJson(cs: TelegramCloudStorage): Promise<string | null> {
  const metaRaw = await getItem(cs, META_KEY)
  if (!metaRaw) return null
  let meta: CloudMeta
  try {
    meta = JSON.parse(metaRaw) as CloudMeta
  } catch {
    return null
  }
  if (meta.v !== 2 || !Number.isFinite(meta.n) || meta.n < 1 || meta.n > 64) {
    return null
  }

  let b64 = ''
  for (let i = 0; i < meta.n; i++) {
    let part: string | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      part = await getItem(cs, blobKey(i))
      if (part != null) break
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)))
    }
    if (part == null) return null
    b64 += part
  }

  return gunzipFromBase64(b64)
}

export async function readTelegramCloudSaveRaw(): Promise<string | null> {
  const cs = cloud()
  if (!cs) return null
  return readCloudJson(cs)
}

export async function writeTelegramCloudSave(state: GameState): Promise<boolean> {
  if (!state.onboarded) return false
  const cs = cloud()
  if (!cs) return false
  try {
    const json = JSON.stringify(state)
    const b64 = await gzipToBase64(json)
    if (!b64) {
      lastCloudWriteOk = false
      return false
    }
    const parts = splitBlob(b64)
    const cash = Math.max(0, Math.floor(state.cash ?? 0))
    const meta: CloudMeta = {
      v: 2,
      n: parts.length,
      t: state.lastActive ?? Date.now(),
      cash,
    }

    for (let i = 0; i < parts.length; i++) {
      if (!(await setItem(cs, blobKey(i), parts[i]!))) {
        lastCloudWriteOk = false
        return false
      }
    }
    if (!(await setItem(cs, CASH_KEY, String(cash)))) {
      lastCloudWriteOk = false
      return false
    }
    if (!(await setItem(cs, META_KEY, JSON.stringify(meta)))) {
      lastCloudWriteOk = false
      return false
    }
    // подчистить хвост
    for (let i = parts.length; i < parts.length + 8; i++) {
      await new Promise<void>((resolve) => {
        try {
          cs.removeItem(blobKey(i), () => resolve())
        } catch {
          resolve()
        }
      })
    }
    lastCloudWriteOk = true
    return true
  } catch (err) {
    console.warn('[telegram] cloud v2 write failed', err)
    lastCloudWriteOk = false
    return false
  }
}

export async function clearTelegramCloudSave(): Promise<void> {
  const cs = cloud()
  if (!cs) return
  const keys = [META_KEY, CASH_KEY, LEGACY_META]
  for (let i = 0; i < 48; i++) {
    keys.push(blobKey(i))
    keys.push(`li_save_${i}`)
  }
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
      error: 'CloudStorage недоступен',
      detail: 'CloudStorage нет — перенеси сейв через Настройки → копировать',
    }
  }

  const probe = `p${Date.now()}`
  if (!(await setItem(cs, 'li_probe', probe)) || (await getItem(cs, 'li_probe')) !== probe) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: false,
      cloudHadSave: false,
      localCash,
      detail: 'Облако не отвечает — копируй сейв в Настройках',
    }
  }

  const hintCash = await peekTelegramCloudCash()
  const metaRaw = await getItem(cs, META_KEY)
  const legacyMeta = !metaRaw ? await getItem(cs, LEGACY_META) : null

  if (!metaRaw && !legacyMeta) {
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
        ? `облако пусто → записали ${localCash}₽ (v2)`
        : localHasBlob
          ? `облако пусто, запись не удалась`
          : 'облако пусто',
    }
  }

  // Старый v1 meta без читаемого body — не затираем, просим копипаст
  if (!metaRaw && legacyMeta) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash: hintCash ?? 0,
      detail: `старый формат облака (~${hintCash ?? '?'}₽) — на телефоне открой игру ещё раз, или копируй сейв`,
      error: 'legacy_cloud',
    }
  }

  const cloudRaw = await readCloudJson(cs)
  if (!cloudRaw) {
    return {
      state: local,
      source: localHasBlob ? 'local' : 'none',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash: hintCash ?? 0,
      detail: `облако ~${hintCash ?? '?'}₽ не прочиталось — Настройки → копировать с телефона`,
      error: 'cloud_read_failed',
    }
  }

  let cloudPeek: { cash?: number; onboarded?: boolean; lastActive?: number; v?: number }
  try {
    cloudPeek = JSON.parse(cloudRaw) as typeof cloudPeek
    if (cloudPeek.v !== 1) {
      return {
        state: local,
        source: 'local',
        cloudAvailable: true,
        cloudHadSave: true,
        localCash,
        error: 'bad cloud version',
      }
    }
  } catch {
    return {
      state: local,
      source: 'local',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash: hintCash ?? 0,
      detail: 'облако битое — копируй сейв с телефона',
      error: 'cloud_corrupt',
    }
  }

  const cloudCash = Math.max(0, Math.floor(cloudPeek.cash ?? hintCash ?? 0))

  if (!localHasBlob || cloudCash > localCash || (!local.onboarded && cloudPeek.onboarded)) {
    return {
      state: applyCloudRaw(cloudRaw),
      source: 'cloud',
      cloudAvailable: true,
      cloudHadSave: true,
      localCash,
      cloudCash,
      detail: `взяли облако ${cloudCash}₽`,
    }
  }

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
      uploaded: !!ok,
      detail: ok
        ? `местн. ${localCash}₽ → облако ok`
        : `местн. ${localCash}₽, облако не приняло — копируй вручную`,
    }
  }

  return {
    state: local,
    source: 'local',
    cloudAvailable: true,
    cloudHadSave: true,
    localCash,
    cloudCash,
    detail: `местн. ${localCash}₽ / облако ${cloudCash}₽`,
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
    const cloudCash = await peekTelegramCloudCash()
    const localCash = Math.max(0, Math.floor(state.cash ?? 0))
    if (cloudCash != null && cloudCash > localCash) return false
    return await writeTelegramCloudSave(state)
  } finally {
    cloudWriting = false
  }
}
