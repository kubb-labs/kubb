import { toRegExpString } from './toRegExp.ts'

describe('toRegExpString', () => {
  test('advanced regex', () => {
    expect(toRegExpString('^.+/.+$', null)).toBe(String.raw`/^.+\/.+$/`)
    expect(toRegExpString('^data:image\\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$', null)).toBe(
      '/^data:image\\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/',
    )
    expect(toRegExpString('^data:image\\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$')).toBe(
      `new RegExp("^data:image\\\\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$")`,
    )
    expect(toRegExpString('^(AliceBlue|AntiqueWhite)$')).toBe(`new RegExp("^(AliceBlue|AntiqueWhite)$")`)
  })
})

describe('toRegExp', () => {
  test('String.raw', () => {
    expect(String.raw`\n`).toBe('\\n')
    expect(String.raw`\n`).toBe('\\n')

    expect(String.raw({ raw: ['\\n'] })).toBe('\\n')
  })
})
