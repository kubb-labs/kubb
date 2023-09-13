import { getEncodedText } from './getEncodedText.ts'

describe('getEncodedText', () => {
  test('return encoded text', () => {
    expect(getEncodedText()).toBe('')
    expect(getEncodedText('`test')).toBe('\\`test')
  })
})
