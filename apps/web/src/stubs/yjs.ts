export class Doc {
  maps: Record<string, Map<string, any>> = {}
  getMap<T = any>(name: string): Map<string, T> {
    if (!this.maps[name]) {
      this.maps[name] = new Map()
    }
    return this.maps[name] as Map<string, T>
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
}

export function encodeStateAsUpdate(doc: Doc): Uint8Array {
  const obj: Record<string, Record<string, any>> = {}
  Object.entries(doc.maps).forEach(([name, map]) => {
    obj[name] = Object.fromEntries(map.entries())
  })
  const json = JSON.stringify(obj)
  return new TextEncoder().encode(json)
}
