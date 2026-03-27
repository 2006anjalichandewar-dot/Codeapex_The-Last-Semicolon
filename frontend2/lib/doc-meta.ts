export interface DocMeta {
  thresholdRequired: number
  totalCollaborators: number
}

const KEY = "zt_doc_meta"

export function getDocMetaMap(): Record<string, DocMeta> {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function setDocMeta(id: string, meta: DocMeta): void {
  if (typeof window === "undefined") return
  const map = getDocMetaMap()
  map[id] = meta
  localStorage.setItem(KEY, JSON.stringify(map))
}

export function getDocMeta(id: string): DocMeta | null {
  const map = getDocMetaMap()
  return map[id] || null
}
