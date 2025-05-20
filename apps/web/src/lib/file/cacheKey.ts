export function cacheKeyForFile(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}
