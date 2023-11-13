import { hookFirst, hookParallel, hookSeq } from './executeStrategies.ts'
import { timeout } from './timeout.ts'

describe('executeStrategies', () => {
  test('hookSeq', async () => {
    expect(hookSeq).toBeDefined()

    const result = await hookSeq([
      () =>
        new Promise((resolve) => {
          timeout(100).then(() => {
            resolve(null)
          })
        }).then(() => {
          return 1
        }),
      () =>
        Promise.resolve(2).then(() => {
          return 2
        }),
    ])
    const firstResult = result[0]
    //     ^?

    expect(firstResult).toEqual(1)
    expect(result).toEqual([1, 2])
  })

  test('hookFirst', async () => {
    expect(hookFirst).toBeDefined()

    const result = await hookFirst([
      () =>
        new Promise((resolve) => {
          timeout(100).then(() => {
            resolve(null)
          })
        }).then(() => {
          return null
        }),
      () =>
        Promise.resolve(2).then(() => {
          return 2
        }),
    ])
    //     ^?

    expect(result).toEqual(2)
  })

  test('hookParallel', async () => {
    expect(hookParallel).toBeDefined()

    const results = await hookParallel([
      () =>
        new Promise((resolve) => {
          timeout(100).then(() => {
            resolve(null)
          })
        }).then(() => {
          return null
        }),
      () =>
        Promise.resolve(2).then(() => {
          return 2
        }),
    ])
    //     ^?

    expect(results.map(item => (item as any).value)).toEqual([
      null,
      2,
    ])
  })
})
