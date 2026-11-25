export type ProductLayout = 'grid' | 'list'

const STORAGE_KEY = 'dujiao_classic_product_layout'
const TTL_MS = 30 * 24 * 60 * 60 * 1000

export function readProductLayoutPreference(): ProductLayout | null {
  try {
    const storage = window.localStorage
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) return null

    const saved = JSON.parse(raw)
    if (
      (saved?.layout === 'grid' || saved?.layout === 'list') &&
      Number.isFinite(saved.expires_at) &&
      saved.expires_at > Date.now()
    ) {
      return saved.layout
    }

    storage.removeItem(STORAGE_KEY)
  } catch {
    // 存储受限或记录无效时使用页面默认布局。
  }
  return null
}

export function saveProductLayoutPreference(layout: ProductLayout): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      layout,
      expires_at: Date.now() + TTL_MS,
    }))
  } catch {
    // 存储受限时，当前页面上的布局切换仍然生效。
  }
}
