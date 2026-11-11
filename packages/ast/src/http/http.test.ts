import { describe, expect, it } from 'vitest'
import type { ResponseNode, StatusCode } from '../nodes/response.ts'
import { baseURL, responses, status } from './index.ts'

function response(statusCode: StatusCode, withBody = false): ResponseNode {
  return { kind: 'Response', statusCode, ...(withBody ? { content: [{ kind: 'Content', contentType: 'application/json' }] } : {}) } as ResponseNode
}

describe('http.status', () => {
  it.each([
    ['201', 2],
    ['2xx', 2],
    [404, 4],
    ['default', null],
  ] as const)('class(%s) is %s', (code, expected) => {
    expect(status.class(code)).toBe(expected)
  })

  it('tells successes from errors', () => {
    expect(status.isSuccess('2xx')).toBe(true)
    expect(status.isError('5xx')).toBe(true)
    expect(status.isError('default')).toBe(false)
    expect(status.isSuccess('default')).toBe(false)
  })
})

describe('http.responses', () => {
  it('lists success responses', () => {
    expect(responses.success({ responses: [response('200'), response('404'), response('2xx')] }).map((r) => r.statusCode)).toEqual(['200', '2xx'])
  })

  it('prefers a body, then an exact code', () => {
    expect(responses.primary({ responses: [response('204'), response('2xx', true), response('201', true)] })?.statusCode).toBe('201')
    expect(responses.primary({ responses: [response('2xx'), response('204')] })?.statusCode).toBe('204')
    expect(responses.primary({ responses: [response('404')] })).toBeNull()
  })
})

describe('http.baseURL', () => {
  it('keeps only absolute, untemplated URLs', () => {
    expect(baseURL({ url: 'https://api.example.com/v2' })).toBe('https://api.example.com/v2')
    expect(baseURL({ url: '/v2' })).toBeUndefined()
    expect(baseURL({ url: 'https://{env}.example.com' })).toBeUndefined()
    expect(baseURL({ url: 'https://dev.example.com', variables: { env: { default: 'dev' } } })).toBeUndefined()
    expect(baseURL(undefined)).toBeUndefined()
  })
})
