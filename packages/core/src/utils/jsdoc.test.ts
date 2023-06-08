import { createJSDocBlockText } from './jsdoc.ts'

describe('jsdoc', () => {
  test('comments should be converted to jsdocs', async () => {
    expect(createJSDocBlockText({ comments: [] })).toBe('')
    expect(createJSDocBlockText({ comments: ['test'] })).toBe('/**\n* test\n*/')
  })
})
