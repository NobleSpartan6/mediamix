export function nanoid(size = 21): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  let id = ''
  const array = new Uint32Array(size)
  crypto.getRandomValues(array)
  for (let i = 0; i < size; i += 1) {
    id += chars[array[i] % chars.length]
  }
  return id
}
