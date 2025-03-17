import { toRegExp, toRegExpString } from './toRegExp.ts'

describe('toRegExpString', () => {
  test('advanced regex', () => {
    expect(toRegExpString('^.+/.+$', null)).toBe(String.raw`/^.+\/.+$/`)
    expect(toRegExpString('^.+/.+$')).toBe("new RegExp('^.+/.+$')")
  })
})

describe('toRegExp', () => {
  test('String.raw', () => {
    expect(String.raw`\n`).toBe('\\n')
    expect(String.raw`\n`).toBe('\\n')

    expect(String.raw({ raw: ['\\n'] })).toBe('\\n')
  })

  test('simple regex', () => {
    const source = String.raw`\w+`

    expect(new RegExp(/\w+/).source).toBe(source)
    expect(toRegExp(/\w+/).source).toBe(source)
    expect(toRegExp('\\w+').source).toBe(source)
    expect(toRegExp('"\\w+"').source).toBe(source)
  })

  test('node_modules regex', () => {
    const source = String.raw`node_modules`

    expect(new RegExp(/node_modules/).source).toBe(source)
    expect(toRegExp(/node_modules/).source).toBe(source)
    expect(toRegExp('/node_modules/').source).toBe(source)
    expect(toRegExp('"/node_modules/"').source).toBe(source)

    expect(toRegExp('/node_modules/').test('/node_modules/test')).toBeTruthy()
    expect(toRegExp(/node_modules/).test('/node_modules/test')).toBeTruthy()
    expect(toRegExp(/node_modules/).test('/node_modules/test')).toBeTruthy()
  })

  test('advanced regex', () => {
    const source = String.raw`^[a-z0-9-]{1,63}$`

    expect(new RegExp(/^[a-z0-9-]{1,63}$/).source).toBe(source)
    expect(toRegExp(/^[a-z0-9-]{1,63}$/).source).toBe(source)
    expect(toRegExp('^[a-z0-9-]{1,63}$').source).toBe(source)

    expect(toRegExp('^[a-z0-9-]{1,63}$').test('123-45-6789')).toBeTruthy()
  })
})
