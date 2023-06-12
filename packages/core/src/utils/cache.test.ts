import { createPluginCache } from './cache.ts'

describe('cache', () => {
  const store = Object.create(null)
  const cache = createPluginCache(store)

  test('set id', () => {
    cache.set('hello', 'world')
    expect(store['hello']).toEqual([0, 'world'])
  })

  test('get id', () => {
    expect(cache.get('empty')).toBeNull()
    expect(cache.get('hello')).toEqual('world')
    expect(store['hello']).toEqual([0, 'world'])
  })

  test('has id', () => {
    expect(cache.has('empty')).toBeFalsy()
    expect(cache.has('hello')).toBeTruthy()
  })

  test('delete id', () => {
    cache.delete('hello')

    expect(store['hello']).toBeUndefined()
  })
})
