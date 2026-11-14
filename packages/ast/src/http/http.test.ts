import { describe, expect, it } from 'vitest'
import type { ResponseNode, StatusCode } from '../nodes/response.ts'
import type { ParameterNode } from '../nodes/parameter.ts'
import { createContent, createRequestBody, createResponse, createSchema } from '../nodes/index.ts'
import { getBaseURL, groupParameters, requestBody, responses, status } from './index.ts'

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
    expect(status.getClass(code)).toBe(expected)
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
    expect(responses.filterSuccess({ responses: [response('200'), response('404'), response('2xx')] }).map((r) => r.statusCode)).toEqual(['200', '2xx'])
  })

  it('prefers a body, then an exact code', () => {
    expect(responses.findPrimary({ responses: [response('204'), response('2xx', true), response('201', true)] })?.statusCode).toBe('201')
    expect(responses.findPrimary({ responses: [response('2xx'), response('204')] })?.statusCode).toBe('204')
    expect(responses.findPrimary({ responses: [response('204'), response('200', true)] })?.statusCode).toBe('200')
    expect(responses.findPrimary({ responses: [response('404')] })).toBeNull()
  })

  it('lists error responses', () => {
    expect(responses.filterError({ responses: [response('200'), response('404'), response('5xx'), response('default')] }).map((r) => r.statusCode)).toEqual([
      '404',
      '5xx',
    ])
  })

  it('collects the ref names the response bodies import', () => {
    const pet = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })
    const error = createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' })
    const withSchema = (statusCode: StatusCode, schema: ReturnType<typeof createSchema>) =>
      createResponse({ statusCode, content: [createContent({ contentType: 'application/json', schema })] })

    expect(responses.getImportedNames([withSchema('200', pet), response('204'), withSchema('404', error)])).toEqual(['Pet', 'Error'])
  })
})

describe('http.requestBody', () => {
  it('gives the first entry schema, or undefined without a body', () => {
    const schema = createSchema({ type: 'string' })
    const body = createRequestBody({ content: [createContent({ contentType: 'text/plain', schema })] })

    expect(requestBody.getSchema({ requestBody: body })).toBe(schema)
    expect(requestBody.getSchema({ requestBody: undefined })).toBeUndefined()
  })
})

describe('http.getBaseURL', () => {
  it('keeps only absolute, untemplated URLs', () => {
    expect(getBaseURL({ url: 'https://api.example.com/v2' })).toBe('https://api.example.com/v2')
    expect(getBaseURL({ url: '/v2' })).toBeUndefined()
    expect(getBaseURL({ url: 'https://{env}.example.com' })).toBeUndefined()
    expect(getBaseURL({ url: 'https://dev.example.com', variables: { env: { default: 'dev' } } })).toBeUndefined()
    expect(getBaseURL(undefined)).toBeUndefined()
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

describe('http.groupParameters', () => {
  it('groups by location and keeps the first of a repeated name', () => {
    const param = (name: string, location: ParameterNode['in']) => ({ kind: 'Parameter', name, in: location }) as ParameterNode
    const groups = groupParameters({ parameters: [param('id', 'path'), param('q', 'query'), param('q', 'query'), param('x', 'header'), param('s', 'cookie')] })
    expect(Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, list.map((p) => p.name)]))).toEqual({
      path: ['id'],
      query: ['q'],
      header: ['x'],
      cookie: ['s'],
    })
  })

  it('builds the groups once per node', () => {
    const node = { parameters: [{ kind: 'Parameter', name: 'id', in: 'path' } as ParameterNode] }
    expect(groupParameters(node)).toBe(groupParameters(node))
  })
})

describe('http.groupParameters querystring', () => {
  it('puts a whole querystring parameter in the query group after the query parameters', () => {
    const param = (name: string, location: ParameterNode['in']) => ({ kind: 'Parameter', name, in: location }) as ParameterNode
    expect(
      groupParameters({ parameters: [param('filter', 'querystring'), param('page', 'query'), param('page', 'querystring')] }).query.map((p) => p.name),
    ).toEqual(['page', 'filter'])
  })
})

describe('http.status with a response', () => {
  it('reads the status code from the response', () => {
    expect(status.isSuccess({ statusCode: '201' })).toBe(true)
    expect(status.isError({ statusCode: '4xx' })).toBe(true)
    expect(status.toCode({ statusCode: 'default' })).toBe(200)
  })
})
