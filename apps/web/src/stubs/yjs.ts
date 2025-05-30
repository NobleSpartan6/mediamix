type UpdateCallback = (update: Uint8Array) => void

export class Doc {
  maps: Record<string, Map<string, any>> = {}
  private listeners = new Set<UpdateCallback>()
  getMap<T = any>(name: string): Map<string, T> {
    if (!this.maps[name]) {
      this.maps[name] = new Map()
    }
    return this.maps[name] as Map<string, T>
  }
  on(event: 'update', cb: UpdateCallback) {
    if (event === 'update') this.listeners.add(cb)
  }
  off(event: 'update', cb: UpdateCallback) {
    if (event === 'update') this.listeners.delete(cb)
  }
  emit(update: Uint8Array) {
    this.listeners.forEach((cb) => cb(update))
  }
}

export function applyUpdate(doc: Doc, update: Uint8Array) {
  const text = new TextDecoder().decode(update)
  const data = JSON.parse(text || '{}') as Record<string, Record<string, any>>
  Object.entries(data).forEach(([mapName, entries]) => {
    const map = doc.getMap(mapName)
    Object.entries(entries).forEach(([k, v]) => {
      map.set(k, v)
    })
  })
  doc.emit(update)
}

export function encodeStateAsUpdate(doc: Doc): Uint8Array {
  const obj: Record<string, Record<string, any>> = {}
  Object.entries(doc.maps).forEach(([name, map]) => {
    obj[name] = Object.fromEntries(map.entries())
  })
  const json = JSON.stringify(obj)
  return new TextEncoder().encode(json)
}
