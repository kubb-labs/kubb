import { transformReservedWord } from './transformReservedWord.ts'

describe('transformReservedWord', () => {
  test('template rendering', () => {
    expect(transformReservedWord('delete')).toBe('_delete')
    expect(transformReservedWord('this')).toBe('_this')
    expect(transformReservedWord('var')).toBe('_var')
    expect(transformReservedWord('1test')).toBe('_1test')
  })
})
