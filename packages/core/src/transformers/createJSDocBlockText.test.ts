import { createJSDocBlockText } from './createJSDocBlockText.ts'

describe('jsdoc', () => {
  test('comments should be converted to jsdocs', () => {
    expect(createJSDocBlockText({ comments: [] })).toBe('')
    expect(createJSDocBlockText({ comments: ['test'], newLine: false })).toBe('/**\n * test\n */')
    expect(createJSDocBlockText({ comments: ['test'], newLine: true })).toBe('/**\n * test\n */\n')
  })
})
