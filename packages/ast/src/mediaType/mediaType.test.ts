import { describe, expect, it } from 'vitest'
import { base, isForm, isJson, isStream } from './index.ts'

describe('mediaType', () => {
  it('drops parameters and lowercases', () => {
    expect(base('Text/Plain; charset=utf-8')).toBe('text/plain')
  })

  it.each([
    ['application/json', true],
    ['text/json', true],
    ['application/problem+json; charset=utf-8', true],
    ['application/xml', false],
  ])('isJson(%s) is %s', (mediaType, expected) => {
    expect(isJson(mediaType)).toBe(expected)
  })

  it.each([
    ['text/event-stream', true],
    ['application/x-ndjson', true],
    ['application/geo+json-seq', true],
    ['application/vnd.custom+json-seq', true],
    ['multipart/mixed', false],
    ['application/json', false],
  ])('isStream(%s) is %s', (mediaType, expected) => {
    expect(isStream(mediaType)).toBe(expected)
  })

  it.each([
    ['multipart/form-data; boundary=x', true],
    ['application/x-www-form-urlencoded', true],
    ['multipart/mixed', false],
  ])('isForm(%s) is %s', (mediaType, expected) => {
    expect(isForm(mediaType)).toBe(expected)
  })
})
