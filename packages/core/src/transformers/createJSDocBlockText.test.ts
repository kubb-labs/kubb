import { describe, expect, test } from 'vitest'
import { createJSDocBlockText } from './createJSDocBlockText.ts'

describe('jsdoc', () => {
  test('comments should be converted to JsDocs', () => {
    expect(createJSDocBlockText({ comments: [] })).toBe('')
    expect(createJSDocBlockText({ comments: ['test'] })).toBe('/**\n * test\n */')
  })
})
