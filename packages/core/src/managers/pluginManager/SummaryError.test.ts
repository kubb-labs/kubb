import { SummaryError } from './SummaryError.ts'

describe('SummaryError', () => {
  test('can create custom Error SummaryError', () => {
    const error = new SummaryError('message', { cause: new Error(), summary: ['test'] })

    expect(error).toBeDefined()
    expect(error.summary).toEqual(['test'])
  })
})
