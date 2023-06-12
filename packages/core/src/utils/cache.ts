export interface Cache<T extends object = object> {
  delete(id: keyof T): boolean
  get(id: keyof T): T[keyof T] | null
  has(id: keyof T): boolean
  set(id: keyof T, value: unknown): void
}

export function createPluginCache<T extends Record<string, [number, unknown]>>(cache: T): Cache<T> {
  return {
    delete(id: keyof T) {
      return delete cache[id]
    },
    get(id) {
      const item = cache[id]
      if (!item) {
        return null
      }
      item[0] = 0
      return item[1] as T[keyof T]
    },
    has(id) {
      const item = cache[id]
      if (!item) {
        return false
      }
      item[0] = 0
      return true
    },
    set(id, value) {
      cache[id] = [0, value] as T[keyof T]
    },
  }
}
