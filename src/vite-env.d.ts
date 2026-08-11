/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLAVOR?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_BASE?: string
  /** URL Cloudflare Worker для автосинка TG (без слэша в конце). */
  readonly VITE_TG_SYNC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
