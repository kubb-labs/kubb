import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { camelCasePathParams, getOperationId, getOperations, getParameters, type Operation, parseOperation } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { createRefs } from './refs.ts'
import type { Document, ParameterObject } from './types.ts'

function documentWith(paths: Record<string, unknown>, components: Record<string, unknown> = {}): Document {
  return { openapi: '3.2.0', info: { title: 'Test', version: '1.0.0' }, paths, components } as Document
}

function parseOperations(document: Document): Array<ast.OperationNode> {
  const refs = createRefs(document)
  const parseSchema = createSchemaParser({ document, refs })
  return getOperations(document, refs).map((operation) => parseOperation({ operation, document, refs, options: DEFAULT_PARSER_OPTIONS, parseSchema }))
}

const responses = { '200': { description: 'OK' } }

describe('getOperationId', () => {
  it.each([
    { label: 'the declared operationId', operationId: 'listPets', path: '/pets', method: 'get', expected: 'listPets' },
    { label: 'the method and path without one', operationId: undefined, path: '/pets', method: 'get', expected: 'get_pets' },
    { label: 'the method and path for an empty one', operationId: '', path: '/pets', method: 'post', expected: 'post_pets' },
    { label: 'the method and path for a non-string one', operationId: 42, path: '/pets', method: 'get', expected: 'get_pets' },
    { label: 'a slugified, lowercased path', operationId: undefined, path: '/Pets/{petId}/Photos', method: 'put', expected: 'put_pets-petid-photos' },
    { label: 'collapsed separators', operationId: undefined, path: '/a//b--c/', method: 'get', expected: 'get_a-b-c' },
  ])('returns $label', ({ operationId, path, method, expected }) => {
    const operation = { path, method, schema: { operationId, responses }, pathItem: {} } as unknown as Operation

    expect(getOperationId(operation)).toBe(expected)
  })
})

describe('getParameters', () => {
  const limit = { name: 'limit', in: 'query', schema: { type: 'integer' } }
  const petId = { name: 'petId', in: 'path', required: true, schema: { type: 'string' } }

  it.each([
    {
      label: 'path-item parameters first, then operation ones',
      pathParameters: [petId],
      operationParameters: [limit],
      expected: [
        { name: 'petId', in: 'path', pointer: '#/paths/~1pets~1{petId}/parameters/0' },
        { name: 'limit', in: 'query', pointer: '#/paths/~1pets~1{petId}/get/parameters/0' },
      ],
    },
    {
      label: 'the operation parameter over a path-item one with the same name and in',
      pathParameters: [{ ...limit, description: 'path item' }],
      operationParameters: [{ ...limit, description: 'operation' }],
      expected: [{ name: 'limit', in: 'query', description: 'operation', pointer: '#/paths/~1pets~1{petId}/get/parameters/0' }],
    },
    {
      label: 'both parameters when the name matches but in differs',
      pathParameters: [{ name: 'id', in: 'header', schema: { type: 'string' } }],
      operationParameters: [{ name: 'id', in: 'query', schema: { type: 'string' } }],
      expected: [
        { name: 'id', in: 'header' },
        { name: 'id', in: 'query' },
      ],
    },
    {
      label: 'a $ref parameter resolved, pointing at the entry that declares it',
      pathParameters: [],
      operationParameters: [{ $ref: '#/components/parameters/Limit' }],
      expected: [{ name: 'limit', in: 'query', pointer: '#/paths/~1pets~1{petId}/get/parameters/0' }],
    },
    {
      label: 'no entry for a parameter without name or in',
      pathParameters: [{ name: 'broken' }],
      operationParameters: [{ in: 'query' }],
      expected: [],
    },
  ])('returns $label', ({ pathParameters, operationParameters, expected }) => {
    const document = documentWith(
      { '/pets/{petId}': { parameters: pathParameters, get: { parameters: operationParameters, responses } } },
      { parameters: { Limit: limit } },
    )
    const refs = createRefs(document)
    const [operation] = getOperations(document, refs)

    const parameters = getParameters({ operation: operation!, refs }).map(({ param, pointer }) => ({ ...param, pointer }))

    expect(parameters).toMatchObject(expected)
    expect(parameters).toHaveLength(expected.length)
  })
})

describe('parseOperation querystring', () => {
  const tags = { type: 'array', items: { type: 'string' } }

  it.each([
    {
      label: 'spreads a form-encoded object into required query parameters only where both are required',
      param: {
        name: 'q',
        in: 'querystring',
        required: true,
        content: { 'application/x-www-form-urlencoded': { schema: { type: 'object', required: ['term'], properties: { term: { type: 'string' }, tags } } } },
      },
      expected: [
        { name: 'term', in: 'query', required: true },
        { name: 'tags', in: 'query', required: false },
      ],
    },
    {
      label: 'spreads a form-encoded object with a charset and keeps the encoding of each property',
      param: {
        name: 'q',
        in: 'querystring',
        content: {
          'application/x-www-form-urlencoded; charset=utf-8': {
            schema: { type: 'object', properties: { tags } },
            encoding: { tags: { style: 'pipeDelimited', explode: true, allowReserved: true } },
          },
        },
      },
      expected: [{ name: 'tags', in: 'query', style: 'pipeDelimited', explode: true, allowReserved: true }],
    },
    {
      label: 'spreads an object from a querystring schema without content',
      param: { name: 'q', in: 'querystring', schema: { type: 'object', properties: { page: { type: 'integer' } } } },
      expected: [{ name: 'page', in: 'query' }],
    },
    {
      label: 'keeps a form-encoded querystring that is not an object whole',
      param: { name: 'q', in: 'querystring', content: { 'application/x-www-form-urlencoded': { schema: { type: 'string' } } } },
      expected: [{ name: 'q', in: 'querystring', contentType: 'application/x-www-form-urlencoded' }],
    },
    {
      label: 'leaves a query parameter as it is',
      param: { name: 'q', in: 'query', schema: { type: 'object', properties: { page: { type: 'integer' } } } },
      expected: [{ name: 'q', in: 'query' }],
    },
  ])('$label', ({ param, expected }) => {
    const [operation] = parseOperations(documentWith({ '/search': { get: { operationId: 'search', parameters: [param], responses } } }))

    expect(operation!.parameters).toMatchObject(expected)
    expect(operation!.parameters).toHaveLength(expected.length)
  })
})

describe('camelCasePathParams', () => {
  const parameter = (param: Partial<ParameterObject> & { name: string; in: ast.ParameterNode['in'] }) =>
    ast.factory.createParameter({ schema: ast.factory.createSchema({ type: 'string' }), required: param.in === 'path', ...param } as ast.ParameterNode)

  it.each([
    {
      label: 'renames snake_case path parameters and their placeholders',
      path: '/pets/{pet_id}/photos/{photo_id}',
      parameters: [parameter({ name: 'pet_id', in: 'path' }), parameter({ name: 'photo_id', in: 'path' })],
      expected: { path: '/pets/{petId}/photos/{photoId}', names: ['petId', 'photoId'] },
    },
    {
      label: 'leaves a query parameter with a path parameter name alone',
      path: '/pets/{pet_id}',
      parameters: [parameter({ name: 'pet_id', in: 'path' }), parameter({ name: 'pet_id', in: 'query' })],
      expected: { path: '/pets/{petId}', names: ['petId', 'pet_id'] },
    },
    {
      label: 'keeps a path with a matrix parameter unchanged',
      path: '/pets/{pet_id}',
      parameters: [parameter({ name: 'pet_id', in: 'path', style: 'matrix' })],
      expected: { path: '/pets/{pet_id}', names: ['pet_id'] },
    },
    {
      label: 'keeps camelCase names as they are',
      path: '/pets/{petId}',
      parameters: [parameter({ name: 'petId', in: 'path' })],
      expected: { path: '/pets/{petId}', names: ['petId'] },
    },
  ])('$label', ({ path, parameters, expected }) => {
    const node = camelCasePathParams(ast.factory.createOperation({ operationId: 'op', method: 'GET', path, parameters }))

    expect({ path: node.path, names: node.parameters.map((param) => param.name) }).toStrictEqual(expected)
  })
})
