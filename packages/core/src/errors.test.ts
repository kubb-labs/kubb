import { Warning } from './errors.ts'

describe('Warning', () => {
  test('can create custom Error Warning', () => {
    const error = new Warning('message', { cause: new Error() })

    expect(error).toBeDefined()
  })
})
