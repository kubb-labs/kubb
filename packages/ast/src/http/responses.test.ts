import { describe, expect, it } from 'vitest'
import type { ResponseNode, StatusCode } from '../nodes/response.ts'
import { createContent, createResponse, createSchema } from '../nodes/index.ts'
import { filterError, filterSuccess, findPrimary, getImportedNames } from './responses.ts'

// Like the adapter, a body-less response keeps one entry with an empty `contentType`.
function response(statusCode: StatusCode, withBody = false): ResponseNode {
  return { kind: 'Response', statusCode, content: [{ kind: 'Content', contentType: withBody ? 'application/json' : '' }] } as ResponseNode
}

describe('filterSuccess', () => {
  it('lists success responses', () => {
    expect(filterSuccess({ responses: [response('200'), response('404'), response('2xx')] }).map((r) => r.statusCode)).toEqual(['200', '2xx'])
  })
})

describe('filterError', () => {
  it('lists error responses', () => {
    expect(filterError({ responses: [response('200'), response('404'), response('5xx'), response('default')] }).map((r) => r.statusCode)).toEqual([
      '404',
      '5xx',
    ])
  })
})

describe('findPrimary', () => {
  it('prefers a body, then an exact code', () => {
    expect(findPrimary({ responses: [response('204'), response('2xx', true), response('201', true)] })?.statusCode).toBe('201')
    expect(findPrimary({ responses: [response('2xx'), response('204')] })?.statusCode).toBe('204')
    expect(findPrimary({ responses: [response('204'), response('200', true)] })?.statusCode).toBe('200')
    expect(findPrimary({ responses: [response('404')] })).toBeNull()
  })
})

describe('getImportedNames', () => {
  it('collects the ref names the response bodies import', () => {
    const pet = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })
    const error = createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' })
    const withSchema = (statusCode: StatusCode, schema: ReturnType<typeof createSchema>) =>
      createResponse({ statusCode, content: [createContent({ contentType: 'application/json', schema })] })

    expect(getImportedNames([withSchema('200', pet), response('204'), withSchema('404', error)])).toEqual(['Pet', 'Error'])
  })
})
