import { getStackTrace } from './getStackTrace.ts'

describe('isURL', () => {
  test('return back a stackTrace', () => {
    expect(getStackTrace()).toBeDefined()
  })
})
