import type { PluginCache } from '../types.ts'

export interface Cache<TStore extends object = object> {
  delete(id: keyof TStore): boolean
  get(id: keyof TStore): TStore[keyof TStore] | null
  has(id: keyof TStore): boolean
  set(id: keyof TStore, value: unknown): void
}

export function createPluginCache<TStore extends PluginCache>(Store: TStore = Object.create(null) as TStore): Cache<TStore> {
  return {
    set(id, value): void {
      Store[id] = [0, value] as TStore[keyof TStore]
    },
    get(id): TStore[keyof TStore] | null {
      const item = Store[id]
      if (!item) {
        return null
      }
      item[0] = 0
      return item[1] as TStore[keyof TStore]
    },
    has(id): boolean {
      const item = Store[id]
      if (!item) {
        return false
      }
      item[0] = 0
      return true
    },
    delete(id: keyof TStore): boolean {
      return delete Store[id]
    },
  }
}
