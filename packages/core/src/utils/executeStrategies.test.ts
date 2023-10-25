import { hookSeq } from './executeStrategies.ts'
import { timeout } from './timeout.ts'

describe('executeStrategies', () => {
  test('hookSeq', async () => {
    const values: number[] = []

    const promises = [
      () =>
        new Promise((resolve) => {
          timeout(100).then(() => {
            resolve(1)
          })
        }).then(() => {
          values.push(1)
          return 1
        }),
      () =>
        Promise.resolve(2).then(() => {
          values.push(2)

          return 2
        }),
    ]

    expect(hookSeq).toBeDefined()
    const result = await hookSeq(promises)

    expect(result).toEqual([1, 2])
    expect(values).toEqual([1, 2])
  })
})
