/** Перенос сейва через буфер обмена (когда CloudStorage на Desktop не читается). */

const PREFIX = 'DI_SAVE_v1:'

export function encodeSaveTransfer(rawJson: string): string {
  const bytes = new TextEncoder().encode(rawJson)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return PREFIX + btoa(bin)
}

export function decodeSaveTransfer(code: string): string | null {
  const trimmed = code.trim().replace(/\s+/g, '')
  if (!trimmed.startsWith(PREFIX)) return null
  try {
    const bin = atob(trimmed.slice(PREFIX.length))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const json = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(json) as { v?: number }
    if (parsed.v !== 1) return null
    return json
  } catch {
    return null
  }
}

export async function copySaveToClipboard(rawJson: string): Promise<boolean> {
  const text = encodeSaveTransfer(rawJson)
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const ok = window.prompt('Скопируй код сейва целиком:', text)
    return ok != null
  } catch {
    return false
  }
}

export async function pasteSaveFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText()
      const decoded = decodeSaveTransfer(text)
      if (decoded) return decoded
    }
  } catch {
    /* fall through */
  }
  const pasted = window.prompt('Вставь код сейва с телефона:')
  if (!pasted) return null
  return decodeSaveTransfer(pasted)
}
