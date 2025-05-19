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
    }
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}
