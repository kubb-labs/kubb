import { transformReservedWord } from './transformReservedWord.ts'

describe('transformReservedWord', () => {
  test('template rendering', async () => {
    expect(transformReservedWord('delete')).toBe('_delete')
  })
})
