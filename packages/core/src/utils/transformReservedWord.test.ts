import { transformReservedWord } from './transformReservedWord.ts'

describe('transformReservedWord', () => {
  test('template rendering', () => {
    expect(transformReservedWord('delete')).toBe('_delete')
  })
})
