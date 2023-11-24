import { createJSDocBlockText } from './createJSDocBlockText.ts'

describe('jsdoc', () => {
  test('comments should be converted to jsdocs', () => {
    expect(createJSDocBlockText({ comments: [] })).toBe('')
    expect(createJSDocBlockText({ comments: ['test'] })).toBe('/**\n * test\n */')
  })
})
