import { describe, expect, it } from 'vitest'
import type { ResponseNode, StatusCode } from '../nodes/response.ts'
import type { ParameterNode } from '../nodes/parameter.ts'
import { baseURL, parameters, responses, status } from './index.ts'

// Like the adapter, a body-less response keeps one entry with an empty `contentType`.
function response(statusCode: StatusCode, withBody = false): ResponseNode {
  return { kind: 'Response', statusCode, content: [{ kind: 'Content', contentType: withBody ? 'application/json' : '' }] } as ResponseNode
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
    expect(responses.primary({ responses: [response('204'), response('200', true)] })?.statusCode).toBe('200')
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

describe('http.status.toCode', () => {
  it.each([
    ['2xx', 200],
    ['4xx', 400],
    ['default', 200],
    ['201', 201],
  ] as const)('toCode(%s) is %s', (code, expected) => {
    expect(status.toCode(code)).toBe(expected)
  })
})

describe('http.parameters', () => {
  it('groups by location and keeps the first of a repeated name', () => {
    const param = (name: string, location: ParameterNode['in']) => ({ kind: 'Parameter', name, in: location }) as ParameterNode
    const groups = parameters({ parameters: [param('id', 'path'), param('q', 'query'), param('q', 'query'), param('x', 'header'), param('s', 'cookie')] })
    expect(Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, list.map((p) => p.name)]))).toEqual({
      path: ['id'],
      query: ['q'],
      header: ['x'],
      cookie: ['s'],
    })
  })
})
