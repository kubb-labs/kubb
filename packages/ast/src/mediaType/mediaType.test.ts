import { describe, expect, it } from 'vitest'
import { getBase, getKind, isJson, isStream } from './index.ts'

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
})

describe('mediaType with a content entry', () => {
  it('reads the media type from the entry', () => {
    expect(getBase({ contentType: 'Text/Plain; charset=utf-8' })).toBe('text/plain')
    expect(isJson({ contentType: 'application/problem+json' })).toBe(true)
    expect(isStream({ contentType: 'application/jsonl' })).toBe(true)
  })
})

describe('mediaType.getKind', () => {
  it.each([
    ['application/json', 'json'],
    ['application/problem+json', 'json'],
    ['multipart/form-data', 'form'],
    ['application/x-www-form-urlencoded', 'urlencoded'],
    ['text/event-stream', 'eventStream'],
    ['text/plain', 'text'],
    ['image/png', 'binary'],
    ['application/xml', null],
    ['', null],
  ] as const)('%s is %s', (contentType, expected) => {
    expect(getKind(contentType)).toBe(expected)
  })

  it('reads the entry: a stream of JSON lines, a blob schema', () => {
    expect(getKind({ contentType: 'application/jsonl', stream: {} })).toBe('lineStream')
    expect(getKind({ contentType: 'application/jsonl' })).toBe(null)
    expect(getKind({ contentType: 'application/xml', schema: { type: 'blob' } })).toBe('binary')
  })
})
