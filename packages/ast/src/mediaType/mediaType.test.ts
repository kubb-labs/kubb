import { describe, expect, it } from 'vitest'
import { getBase, isJson } from './index.ts'

describe('mediaType', () => {
  it('drops parameters and lowercases', () => {
    expect(getBase('Text/Plain; charset=utf-8')).toBe('text/plain')
  })

  it.each([
    ['application/json', true],
    ['text/json', true],
    ['application/problem+json; charset=utf-8', true],
    ['application/xml', false],
  ])('isJson(%s) is %s', (mediaType, expected) => {
    expect(isJson(mediaType)).toBe(expected)
  })
})

describe('mediaType with a content entry', () => {
  it('reads the media type from the entry', () => {
    expect(getBase({ contentType: 'Text/Plain; charset=utf-8' })).toBe('text/plain')
    expect(isJson({ contentType: 'application/problem+json' })).toBe(true)
  })
})
