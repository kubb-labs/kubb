import { buildJSDoc } from './buildJSDoc'

describe('buildJSDoc', () => {
  test('should return fallback when no comments', () => {
    expect(buildJSDoc([])).toBe('  ')
  })

  test('should return custom fallback when specified', () => {
    expect(buildJSDoc([], { fallback: '' })).toBe('')
  })

  test('should build JSDoc with single comment', () => {
    const result = buildJSDoc(['test comment'])
    expect(result).toBe('/**\n   * test comment\n   */\n  ')
  })

  test('should build JSDoc with multiple comments', () => {
    const result = buildJSDoc(['first comment', 'second comment'])
    expect(result).toBe('/**\n   * first comment\n   * second comment\n   */\n  ')
  })

  test('should use custom indent', () => {
    const result = buildJSDoc(['test'], { indent: ' * ' })
    expect(result).toBe('/**\n * test\n   */\n  ')
  })

  test('should use custom suffix', () => {
    const result = buildJSDoc(['test'], { suffix: '' })
    expect(result).toBe('/**\n   * test\n   */')
  })

  test('should combine all custom options', () => {
    const result = buildJSDoc(['test'], {
      indent: '  * ',
      suffix: '\n',
      fallback: 'empty',
    })
    expect(result).toBe('/**\n  * test\n   */\n')
  })
})
