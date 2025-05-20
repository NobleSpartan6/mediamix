export const initCache = async (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') {
    return null
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('media-cache', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      const names = Array.from(db.objectStoreNames as any)
      if (!names.includes('chunks')) {
        db.createObjectStore('chunks')
      }
      if (!names.includes('analysis')) {
        db.createObjectStore('analysis')
      }
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

let dbPromise: Promise<IDBDatabase | null> | null = null

const getDb = () => {
  if (!dbPromise) {
    dbPromise = initCache()
  }
  return dbPromise
}

export async function getCachedAnalysis<T>(key: string): Promise<T | null> {
  const db = await getDb()
  if (!db) return null
  return new Promise((resolve, reject) => {
    const tx = db.transaction('analysis', 'readonly')
    const store = tx.objectStore('analysis')
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function setCachedAnalysis<T>(
  key: string,
  value: T,
): Promise<void> {
  const db = await getDb()
  if (!db) return
  return new Promise((resolve, reject) => {
    const tx = db.transaction('analysis', 'readwrite')
    const store = tx.objectStore('analysis')
    const req = store.put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
