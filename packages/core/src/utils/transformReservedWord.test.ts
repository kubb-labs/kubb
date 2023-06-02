import { transformReservedWord } from './transformReservedWord.js'

describe('transformReservedWord', () => {
  test('template rendering', async () => {
    expect(transformReservedWord('delete')).toBe('_delete')
  })
})
