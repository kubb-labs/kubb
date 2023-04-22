import { transformReservedWord } from './transformReservedWord'

describe('transformReservedWord', () => {
  test('template rendering', async () => {
    expect(transformReservedWord('delete')).toBe('_delete')
  })
})
