import { isURL } from './isURL.ts'

describe('isURL', () => {
  test('input should be an URL', async () => {
    expect(isURL('randomstring')).toBeFalsy()
    expect(isURL('https://google.com')).toBeTruthy()
    expect(isURL('c://windows')).toBeTruthy()
    expect(isURL('e:\\dev')).toBeTruthy()
  })
})
