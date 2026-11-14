import { describe, expect, it } from 'vitest'
import type { ParameterNode } from '../nodes/parameter.ts'
import { createContent, createRequestBody, createSchema } from '../nodes/index.ts'
import { getBaseURL, groupParameters, requestBody } from './index.ts'

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
