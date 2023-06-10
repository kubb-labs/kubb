import { getStackTrace } from './getStackTrace.ts'

describe('isURL', () => {
  test('return back a stackTrace', async () => {
    expect(getStackTrace()).toBeDefined()
  })
})
