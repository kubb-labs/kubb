/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */

export interface Cache<TCache = any> {
  delete(id: string): boolean
  get<T = TCache>(id: string): T
  has(id: string): boolean
  set<T = TCache>(id: string, value: T): void
}

export function createPluginCache(cache: any): Cache {
  return {
    delete(id: string) {
      return delete cache[id]
    },
    get(id: string) {
      const item = cache[id]
      if (!item) return
      item[0] = 0
      return item[1]
    },
    has(id: string) {
      const item = cache[id]
      if (!item) return false
      item[0] = 0
      return true
    },
    set(id: string, value: any) {
      cache[id] = [0, value]
    },
  }
}
