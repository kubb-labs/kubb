import { describe, expect, it } from 'vitest'
import { createFunctionParameter } from '../nodes/function.ts'
import { createOperation } from '../nodes/operation.ts'
import { createParameter } from '../nodes/parameter.ts'
import { createProperty } from '../nodes/property.ts'
import { createResponse } from '../nodes/response.ts'
import { createSchema } from '../nodes/schema.ts'
import type { OperationNode, ParameterNode } from '../types.ts'
import type { OperationParamsResolver } from './ast.ts'
import {
  caseParams,
  collectReferencedSchemaNames,
  collectUsedSchemaNames,
  containsCircularRef,
  createDiscriminantNode,
  createOperationParams,
  findCircularSchemas,
  isStringType,
  resolveRefName,
  syncSchemaRef,
} from './ast.ts'

const param = (name: string) =>
  createParameter({
    name,
    in: 'query',
    required: false,
    schema: createSchema({ type: 'string' }),
  })

describe('caseParams', () => {
  it('returns original array when casing is undefined', () => {
    const params = [param('pet_id'), param('order_status')]
    const result = caseParams(params, undefined)

    expect(result).toBe(params)
  })

  it('camelCases snake_case names', () => {
    const result = caseParams([param('pet_id'), param('order_status')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['petId', 'orderStatus'])
  })

  it('camelCases kebab-case names', () => {
    const result = caseParams([param('some-param'), param('another-one')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['someParam', 'anotherOne'])
  })

  it('leaves already-camelCased names unchanged', () => {
    const result = caseParams([param('petId'), param('limit')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['petId', 'limit'])
  })

  it('does not mutate the original params', () => {
    const original = [param('pet_id')]
    caseParams(original, 'camelcase')

    expect(original[0]!.name).toBe('pet_id')
  })

  it('preserves all other ParameterNode fields', () => {
    const original = param('pet_id')
    const [result] = caseParams([original], 'camelcase')

    expect(result).toMatchObject({
      kind: 'Parameter',
      in: 'query',
      required: false,
      name: 'petId',
    })
    expect(result!.schema).toBe(original.schema)
  })

  it('handles an empty params array', () => {
    expect(caseParams([], 'camelcase')).toStrictEqual([])
  })
})

describe('isStringType', () => {
  it('returns true for plain string-like schema types', () => {
    expect(isStringType(createSchema({ type: 'string' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'uuid' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'email' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'url' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'datetime' }))).toBe(true)
  })

  it('returns true for date/time with string representation', () => {
    expect(isStringType(createSchema({ type: 'date', representation: 'string' }))).toBe(true)
    expect(isStringType(createSchema({ type: 'time', representation: 'string' }))).toBe(true)
  })

  it('returns false for date/time with date representation and non-string scalars', () => {
    expect(isStringType(createSchema({ type: 'date', representation: 'date' }))).toBe(false)
    expect(isStringType(createSchema({ type: 'time', representation: 'date' }))).toBe(false)
    expect(isStringType(createSchema({ type: 'number' }))).toBe(false)
  })
})

describe('syncSchemaRef', () => {
  it('returns a merged schema for a ref node that has a resolved schema', () => {
    const resolved = createSchema({ type: 'object' })
    const ref = createSchema({
      type: 'ref',
      name: 'Pet',
      ref: '#/components/schemas/Pet',
      schema: resolved,
    })

    const merged = syncSchemaRef(ref)
    expect(merged).not.toBeNull()
    expect(merged?.type).toBe('object')
  })

  it('returns a merged schema with sibling overrides applied over the resolved schema', () => {
    const resolved = createSchema({ type: 'object', description: 'Original' })
    const ref = createSchema({
      type: 'ref',
      name: 'Pet',
      ref: '#/components/schemas/Pet',
      schema: resolved,
      description: 'Override',
      readOnly: true,
    })

    const merged = syncSchemaRef(ref)
    expect(merged?.description).toBe('Override')
    expect(merged?.readOnly).toBe(true)
    expect(merged?.type).toBe('object')
  })
})

describe('createDiscriminantNode', () => {
  it('creates an object with a single required enum property', () => {
    const node = createDiscriminantNode({ propertyName: 'type', value: 'cat' })

    expect(node.type).toBe('object')
    if (node.type !== 'object') return
    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('type')
    expect(node.properties?.[0]?.required).toBe(true)
    expect(node.properties?.[0]?.schema.type).toBe('enum')
  })

  it('enum has exactly one value matching the input', () => {
    const node = createDiscriminantNode({ propertyName: 'kind', value: 'dog' })

    if (node.type !== 'object') return
    const enumNode = node.properties?.[0]?.schema
    if (!enumNode || enumNode.type !== 'enum') return
    expect(enumNode.enumValues).toStrictEqual(['dog'])
  })
})

function makeOperation(overrides: Partial<Parameters<typeof createOperation>[0]> = {}) {
  return createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    ...overrides,
  })
}

function makePathParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'path',
    required: opts.required ?? true,
    schema: createSchema({ type: 'string' }),
  })
}

function makeQueryParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'query',
    required: opts.required ?? false,
    schema: createSchema({ type: 'string' }),
  })
}

function makeHeaderParam(name: string, opts: { required?: boolean } = {}) {
  return createParameter({
    name,
    in: 'header',
    required: opts.required ?? false,
    schema: createSchema({ type: 'string' }),
  })
}

function makeResolver(overrides: Partial<OperationParamsResolver> = {}): OperationParamsResolver {
  const resolveParamName = overrides.resolveParamName ?? ((_node: OperationNode, param: ParameterNode) => param.name)
  return {
    resolveParamName,
    resolveDataName: () => 'unknown',
    resolvePathParamsName: resolveParamName,
    resolveQueryParamsName: resolveParamName,
    resolveHeaderParamsName: resolveParamName,
    ...overrides,
  }
}

describe('createOperationParams', () => {
  describe('inline mode with inline path params', () => {
    it('produces inline path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `GetPetById["${param.name}"]`,
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: false,
            type: 'GetPetById["petId"]',
          },
        ],
      })
    })

    it('produces inline path params + data + query + headers + extra', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter'), makeHeaderParam('x-api-key')],
        requestBody: {
          required: true,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveDataName: () => 'CreatePetRequest',
        }),
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Partial<Cypress.RequestOptions>',
            default: '{}',
          }),
        ],
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: 'Types["petId"]',
        },
        {
          kind: 'FunctionParameter',
          name: 'data',
          optional: false,
          type: 'CreatePetRequest',
        },
        {
          kind: 'FunctionParameter',
          name: 'params',
          optional: true,
          type: {
            kind: 'TypeLiteral',
            members: [
              {
                name: 'filter',
                optional: true,
                type: 'Types["filter"]',
              },
            ],
          },
        },
        {
          kind: 'FunctionParameter',
          name: 'headers',
          optional: true,
          type: {
            kind: 'TypeLiteral',
            members: [
              {
                name: 'x-api-key',
                optional: true,
                type: 'Types["x-api-key"]',
              },
            ],
          },
        },
        {
          default: '{}',
          kind: 'FunctionParameter',
          name: 'options',
          optional: false,
          type: 'Partial<Cypress.RequestOptions>',
        },
      ])
    })

    it('handles optional path params with default', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: true,
            type: 'string',
          },
        ],
      })
    })
  })

  describe('inline mode with object path params', () => {
    it('produces destructured object for path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makePathParam('storeId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }, { name: 'storeId' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: 'string',
                },
                {
                  name: 'storeId',
                  optional: false,
                  type: 'string',
                },
              ],
            },
          },
        ],
      })
    })
  })

  describe('object mode', () => {
    it('wraps all params into a single destructured object', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true })],
        requestBody: {
          required: false,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveDataName: () => 'UpdatePetBody',
        }),
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Options',
            default: '{}',
          }),
        ],
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }, { name: 'data' }, { name: 'params' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: 'Types["petId"]',
                },
                {
                  name: 'data',
                  optional: true,
                  type: 'UpdatePetBody',
                },
                {
                  name: 'params',
                  optional: false,
                  type: {
                    kind: 'TypeLiteral',
                    members: [
                      {
                        name: 'status',
                        optional: false,
                        type: 'Types["status"]',
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: 'options',
            optional: false,
            type: 'Options',
          },
        ],
      })
    })

    it('adds default {} when all children are optional', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'params' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'params',
                  optional: true,
                  type: {
                    kind: 'TypeLiteral',
                    members: [
                      {
                        name: 'filter',
                        optional: true,
                        type: 'string',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      })
    })
  })

  describe('paramsCasing', () => {
    it('applies camelCase to parameter names', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      const pathParam = params.params[0]
      expect(pathParam).toBeDefined()
      expect(pathParam?.name).toBe('petId')
    })
  })

  describe('no parameters', () => {
    it('returns empty params when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [],
      })
    })

    it('returns only extraParams when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        extraParams: [
          createFunctionParameter({
            name: 'options',
            type: 'Options',
            default: '{}',
          }),
        ],
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            default: '{}',
            kind: 'FunctionParameter',
            name: 'options',
            optional: false,
            type: 'Options',
          },
        ],
      })
    })
  })

  describe('default type resolution', () => {
    it('uses schema primitive type when paramTypes is not provided', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
      })

      const pathParam = params.params[0]
      expect(pathParam?.type).toStrictEqual('string')
    })
  })

  describe('requestBody only', () => {
    it('produces data param when operation has only requestBody', () => {
      const node = makeOperation({
        requestBody: {
          required: true,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'unknown',
          resolveDataName: () => 'CreatePetRequest',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: false,
            type: 'CreatePetRequest',
          },
        ],
      })
    })

    it('produces optional data param when requestBody is not required', () => {
      const node = makeOperation({
        requestBody: {
          required: false,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'unknown',
          resolveDataName: () => 'UpdatePetRequest',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: true,
            type: 'UpdatePetRequest',
          },
        ],
      })
    })
  })

  describe('resolver with group methods (named group types)', () => {
    it('uses resolveQueryParamsName for query params in inline mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryParamsName: () => 'FindPetsQueryParams',
        }),
      })

      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam).toMatchObject({
        kind: 'FunctionParameter',
        name: 'params',
        optional: true,
        type: 'FindPetsQueryParams',
      })
    })

    it('uses resolveQueryParamsName for query params in object mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true })],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryParamsName: () => 'FindPetsQueryParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const queryChild = objParam.type.members.find((m) => m.name === 'params')
        expect(queryChild).toMatchObject({
          name: 'params',
          optional: false,
          type: 'FindPetsQueryParams',
        })
      }
    })

    it('falls back to inline types when resolveQueryParamsName is not provided', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
        }),
      })

      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toMatchObject({
        kind: 'TypeLiteral',
        members: expect.arrayContaining([expect.objectContaining({ name: 'filter' })]),
      })
    })

    it('uses resolveHeaderParamsName for header params in inline mode', () => {
      const node = makeOperation({
        parameters: [makeHeaderParam('x-api-key', { required: true })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'string',
          resolveHeaderParamsName: () => 'FindPetsHeaderParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'headers',
            optional: false,
            type: 'FindPetsHeaderParams',
          },
        ],
      })
    })

    it('uses resolveHeaderParamsName for headers in object mode', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeHeaderParam('x-api-key')],
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: () => 'string',
          resolveHeaderParamsName: () => 'HeaderParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const headerChild = objParam.type.members.find((m) => m.name === 'headers')
        expect(headerChild).toMatchObject({
          name: 'headers',
          optional: true,
          type: 'HeaderParams',
        })
      }
    })

    it('uses resolvePathParamsName for indexed access types on path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makePathParam('name', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `DeletePetPath${param.name}`,
          resolvePathParamsName: () => 'DeletePetPathParams',
        }),
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: {
            kind: 'IndexedAccessType',
            objectType: 'DeletePetPathParams',
            indexType: 'petId',
          },
        },
        {
          kind: 'FunctionParameter',
          name: 'name',
          optional: true,
          type: {
            kind: 'IndexedAccessType',
            objectType: 'DeletePetPathParams',
            indexType: 'name',
          },
        },
      ])
    })
  })

  describe('pathParamsDefault', () => {
    it('uses custom default value for path params', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
        pathParamsDefault: '[]',
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.default).toBe('[]')
    })

    it('uses fallback default when pathParamsDefault is undefined', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: false })],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
        pathParamsDefault: undefined,
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.default).toBe('{}')
    })
  })

  describe('vue-query style type wrapping', () => {
    it('supports MaybeRefOrGetter wrapping via resolver with group methods', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter')],
        requestBody: {
          required: false,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `MaybeRefOrGetter<Types["${param.name}"]>`,
          resolveDataName: () => 'MaybeRefOrGetter<CreatePetRequest>',
          resolveQueryParamsName: () => 'MaybeRefOrGetter<FindPetsQueryParams>',
        }),
      })

      expect(params.params).toMatchObject([
        {
          kind: 'FunctionParameter',
          name: 'petId',
          optional: false,
          type: 'MaybeRefOrGetter<Types["petId"]>',
        },
        {
          kind: 'FunctionParameter',
          name: 'data',
          optional: true,
          type: 'MaybeRefOrGetter<CreatePetRequest>',
        },
        {
          kind: 'FunctionParameter',
          name: 'params',
          optional: true,
          type: 'MaybeRefOrGetter<FindPetsQueryParams>',
        },
      ])
    })
  })

  describe('paramsCasing with query and header params', () => {
    it('applies camelCase to query param names', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('order_status'), makeQueryParam('pet_category')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'orderStatus',
                  optional: true,
                  type: 'Types["orderStatus"]',
                },
                {
                  name: 'petCategory',
                  optional: true,
                  type: 'Types["petCategory"]',
                },
              ],
            },
          },
        ],
      })
    })

    it('applies camelCase to path params with object path params type', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id'), makePathParam('store_name')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        paramsCasing: 'camelcase',
        resolver: makeResolver({ resolveParamName: () => 'string' }),
      })

      const pathGroup = params.params[0]
      expect(pathGroup).toBeDefined()
      expect(pathGroup?.name).toMatchObject({ kind: 'ObjectBindingPattern' })
      if (pathGroup?.name && typeof pathGroup.name === 'object' && pathGroup.name.kind === 'ObjectBindingPattern') {
        expect(pathGroup.name.elements.map((e) => e.name)).toStrictEqual(['petId', 'storeName'])
      }
    })
  })

  describe('client-plugin style (inline path + named query/header groups)', () => {
    it('covers the common client plugin scenario: path inline, query + header as named groups', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status'), makeHeaderParam('x-api-key')],
        requestBody: {
          required: true,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveDataName: () => 'CreatePetRequest',
          resolveQueryParamsName: () => 'GetPetQueryParams',
          resolveHeaderParamsName: () => 'GetPetHeaderParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: 'petId',
            optional: false,
            type: 'Types["petId"]',
          },
          {
            kind: 'FunctionParameter',
            name: 'data',
            optional: false,
            type: 'CreatePetRequest',
          },
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: 'GetPetQueryParams',
          },
          {
            kind: 'FunctionParameter',
            name: 'headers',
            optional: true,
            type: 'GetPetHeaderParams',
          },
        ],
      })
    })

    it('covers object paramsType with all param types: path + query + header + body', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true }), makeHeaderParam('x-api-key', { required: true })],
        requestBody: {
          required: false,
          content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }],
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveDataName: () => 'CreatePetRequest',
          resolveQueryParamsName: () => 'GetPetQueryParams',
          resolveHeaderParamsName: () => 'GetPetHeaderParams',
        }),
      })

      const objParam = params.params[0]
      expect(objParam?.kind).toBe('FunctionParameter')
      expect(objParam?.type).toMatchObject({ kind: 'TypeLiteral' })
      if (objParam?.type && typeof objParam.type === 'object' && objParam.type.kind === 'TypeLiteral') {
        const names = objParam.type.members.map((m) => m.name)
        expect(names).toContain('petId')
        expect(names).toContain('data')
        expect(names).toContain('params')
        expect(names).toContain('headers')
      }
    })
  })

  describe('react-query / solid-query / svelte-query style', () => {
    it('inline paramsType with object path params and named query group (QueryOptions style)', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId', { required: true }), makeQueryParam('limit'), makeQueryParam('offset')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'object',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `GetPetByIdPathParams["${param.name}"]`,
          resolvePathParamsName: () => 'GetPetByIdPathParams',
          resolveQueryParamsName: () => 'GetPetByIdQueryParams',
        }),
      })

      expect(params).toMatchObject({
        kind: 'FunctionParameters',
        params: [
          {
            kind: 'FunctionParameter',
            name: {
              kind: 'ObjectBindingPattern',
              elements: [{ name: 'petId' }],
            },
            optional: false,
            type: {
              kind: 'TypeLiteral',
              members: [
                {
                  name: 'petId',
                  optional: false,
                  type: {
                    kind: 'IndexedAccessType',
                    objectType: 'GetPetByIdPathParams',
                    indexType: 'petId',
                  },
                },
              ],
            },
          },
          {
            kind: 'FunctionParameter',
            name: 'params',
            optional: true,
            type: 'GetPetByIdQueryParams',
          },
        ],
      })
    })

    it('inline paramsType with paramsCasing and named query group', () => {
      const node = makeOperation({
        parameters: [makePathParam('pet_id', { required: true }), makeQueryParam('sort_order')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        paramsCasing: 'camelcase',
        resolver: makeResolver({
          resolveParamName: (_node, param) => `Types["${param.name}"]`,
          resolveQueryParamsName: () => 'ListPetsQueryParams',
        }),
      })

      const pathParam = params.params[0]
      expect(pathParam?.name).toBe('petId')
      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toStrictEqual('ListPetsQueryParams')
    })
  })
})

describe('typeWrapper option', () => {
  it('wraps path param types with the provided function', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveParamName: () => 'string' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const pathParam = params.params[0]
    expect(pathParam?.type).toStrictEqual('MaybeRefOrGetter<string>')
  })

  it('wraps body type with the provided function', () => {
    const node = makeOperation({
      requestBody: { required: true, content: [{ contentType: 'application/json', schema: createSchema({ type: 'object' }) }] },
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveDataName: () => 'CreatePetRequest' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const bodyParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'data')
    expect(bodyParam?.type).toStrictEqual('MaybeRefOrGetter<CreatePetRequest>')
  })

  it('wraps query group type with the provided function', () => {
    const node = makeOperation({
      parameters: [makeQueryParam('status')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({
        resolveQueryParamsName: () => 'ListPetsQueryParams',
      }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
    expect(queryParam?.type).toStrictEqual('MaybeRefOrGetter<ListPetsQueryParams>')
  })

  it('identity when typeWrapper is not provided', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveParamName: () => 'string' }),
    })

    const pathParam = params.params[0]
    expect(pathParam?.type).toStrictEqual('string')
  })
})

describe('pathParamsType: inlineSpread', () => {
  it('emits a single rest parameter for path params', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId'), makePathParam('storeId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({
        resolvePathParamsName: () => 'GetPetByIdPathParams',
      }),
    })

    expect(params.params).toHaveLength(1)
    const restParam = params.params[0]
    expect(restParam?.kind).toBe('FunctionParameter')
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.rest).toBe(true)
      expect(restParam.name).toBe('pathParams')
      expect(restParam.type).toStrictEqual('GetPetByIdPathParams')
    }
  })

  it('respects custom path param name via paramNames.path', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      paramNames: { path: 'args' },
      resolver: makeResolver({
        resolvePathParamsName: () => 'GetPetByIdPathParams',
      }),
    })

    const restParam = params.params[0]
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.name).toBe('args')
    }
  })

  it('applies typeWrapper to the spread type', () => {
    const node = makeOperation({
      parameters: [makePathParam('petId')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({
        resolvePathParamsName: () => 'GetPetByIdPathParams',
      }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const restParam = params.params[0]
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.type).toStrictEqual('MaybeRefOrGetter<GetPetByIdPathParams>')
    }
  })

  it('emits no path param when operation has no path parameters', () => {
    const node = makeOperation({
      parameters: [makeQueryParam('status')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inlineSpread',
      resolver: makeResolver({}),
    })

    const restParam = params.params.find((p) => p.kind === 'FunctionParameter' && (p as { rest?: boolean }).rest)
    expect(restParam).toBeUndefined()
  })
})

describe('findCircularSchemas', () => {
  it('returns empty set for acyclic schemas', () => {
    const Category = createSchema({ type: 'object', name: 'Category', properties: [] })
    const Pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
      ],
    })

    expect(findCircularSchemas([Category, Pet])).toStrictEqual(new Set())
  })

  it('detects direct self-reference (TreeNode → TreeNode)', () => {
    const TreeNode = createSchema({
      type: 'object',
      name: 'TreeNode',
      properties: [
        createProperty({ name: 'left', required: false, schema: createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }) }),
      ],
    })

    expect(findCircularSchemas([TreeNode])).toStrictEqual(new Set(['TreeNode']))
  })

  it('detects indirect cycle (Pet → Cat → Pet)', () => {
    const Pet = createSchema({
      type: 'union',
      name: 'Pet',
      members: [createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })],
    })
    const Cat = createSchema({
      type: 'object',
      name: 'Cat',
      properties: [
        createProperty({
          name: 'friends',
          required: false,
          schema: createSchema({ type: 'array', items: [createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })] }),
        }),
      ],
    })

    expect(findCircularSchemas([Pet, Cat])).toStrictEqual(new Set(['Pet', 'Cat']))
  })

  it('detects refs nested inside unions and arrays', () => {
    const A = createSchema({
      type: 'object',
      name: 'A',
      properties: [
        createProperty({
          name: 'next',
          required: false,
          schema: createSchema({
            type: 'union',
            members: [createSchema({ type: 'null' }), createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' })],
          }),
        }),
      ],
    })

    expect(findCircularSchemas([A])).toStrictEqual(new Set(['A']))
  })

  it('does not flag schemas that only reference cyclic schemas without participating', () => {
    // B → A → A, but A does not reference B.
    const A = createSchema({
      type: 'object',
      name: 'A',
      properties: [createProperty({ name: 'self', required: false, schema: createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' }) })],
    })
    const B = createSchema({
      type: 'object',
      name: 'B',
      properties: [createProperty({ name: 'a', required: false, schema: createSchema({ type: 'ref', name: 'A', ref: '#/components/schemas/A' }) })],
    })
    const result = findCircularSchemas([A, B])

    expect(result.has('A')).toBe(true)
    expect(result.has('B')).toBe(false)
  })

  it('skips unnamed schemas', () => {
    const anon = createSchema({ type: 'object' })
    expect(findCircularSchemas([anon])).toStrictEqual(new Set())
  })
})

describe('resolveRefName', () => {
  it('extracts the name from a $ref pointer', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('falls back to node.name when ref is missing', () => {
    const ref = createSchema({ type: 'ref', name: 'Pet' })

    expect(resolveRefName(ref)).toBe('Pet')
  })

  it('returns null for non-ref nodes', () => {
    expect(resolveRefName(createSchema({ type: 'string' }))).toBeNull()
    expect(resolveRefName(undefined)).toBeNull()
  })
})

describe('collectReferencedSchemaNames', () => {
  it('collects ref names nested in objects, arrays and unions', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'category', required: false, schema: createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }) }),
        createProperty({
          name: 'tags',
          required: false,
          schema: createSchema({ type: 'array', items: [createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' })] }),
        }),
        createProperty({
          name: 'owner',
          required: false,
          schema: createSchema({
            type: 'union',
            members: [createSchema({ type: 'null' }), createSchema({ type: 'ref', name: 'User', ref: '#/components/schemas/User' })],
          }),
        }),
      ],
    })

    expect(collectReferencedSchemaNames(schema)).toStrictEqual(new Set(['Category', 'Tag', 'User']))
  })

  it('returns an empty set for schemas without refs', () => {
    expect(collectReferencedSchemaNames(createSchema({ type: 'string' }))).toStrictEqual(new Set())
  })
})

describe('containsCircularRef', () => {
  it('returns true when a nested ref points to a circular schema', () => {
    const schema = createSchema({
      type: 'object',
      name: 'Cat',
      properties: [createProperty({ name: 'archEnemy', required: false, schema: createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }) })],
    })

    expect(containsCircularRef(schema, { circularSchemas: new Set(['Pet']) })).toBe(true)
  })

  it('returns false when excludeName matches the only circular ref', () => {
    const schema = createSchema({
      type: 'object',
      name: 'TreeNode',
      properties: [
        createProperty({ name: 'left', required: false, schema: createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }) }),
      ],
    })

    expect(containsCircularRef(schema, { circularSchemas: new Set(['TreeNode']), excludeName: 'TreeNode' })).toBe(false)
  })

  it('returns false when there are no refs', () => {
    expect(containsCircularRef(createSchema({ type: 'string' }), { circularSchemas: new Set(['Pet']) })).toBe(false)
  })

  it('short-circuits when the circular set is empty', () => {
    const schema = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })

    expect(containsCircularRef(schema, { circularSchemas: new Set() })).toBe(false)
  })
})

describe('collectUsedSchemaNames', () => {
  const itemStatusSchema = createSchema({ type: 'enum', name: 'ItemStatus', enumValues: ['ACTIVE', 'INACTIVE'] })
  const orderStatusSchema = createSchema({ type: 'enum', name: 'OrderStatus', enumValues: ['NEW', 'SHIPPED'] })
  const itemsResponseSchema = createSchema({
    type: 'object',
    name: 'ItemsResponse',
    properties: [createProperty({ name: 'items', required: false, schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }) })],
  })
  const ordersResponseSchema = createSchema({ type: 'object', name: 'OrdersResponse', properties: [] })

  const schemas = [itemStatusSchema, orderStatusSchema, itemsResponseSchema, ordersResponseSchema]

  const getItemsOp = createOperation({
    operationId: 'getItems',
    method: 'GET',
    path: '/items',
    tags: ['items'],
    parameters: [
      createParameter({
        name: 'status',
        in: 'query',
        required: false,
        schema: createSchema({ type: 'ref', name: 'ItemStatus', ref: '#/components/schemas/ItemStatus' }),
      }),
    ],
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'ItemsResponse', ref: '#/components/schemas/ItemsResponse' }) })],
  })

  const getOrdersOp = createOperation({
    operationId: 'getOrders',
    method: 'GET',
    path: '/orders',
    tags: ['orders'],
    parameters: [
      createParameter({
        name: 'status',
        in: 'query',
        required: false,
        schema: createSchema({ type: 'ref', name: 'OrderStatus', ref: '#/components/schemas/OrderStatus' }),
      }),
    ],
    responses: [
      createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'OrdersResponse', ref: '#/components/schemas/OrdersResponse' }) }),
    ],
  })

  it('collects schema names referenced by parameters and responses, and excludes unreachable schemas', () => {
    const result = collectUsedSchemaNames([getItemsOp], schemas)

    expect(result).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse']))
    expect(result.has('OrderStatus')).toBe(false)
    expect(result.has('OrdersResponse')).toBe(false)
  })

  it('collects schema names from multiple operations', () => {
    const result = collectUsedSchemaNames([getItemsOp, getOrdersOp], schemas)

    expect(result).toStrictEqual(new Set(['ItemStatus', 'ItemsResponse', 'OrderStatus', 'OrdersResponse']))
  })

  it('returns an empty set when the operations list is empty', () => {
    expect(collectUsedSchemaNames([], schemas)).toStrictEqual(new Set())
  })

  it('follows transitive schema references', () => {
    const tagSchema = createSchema({ type: 'enum', name: 'Tag', enumValues: ['tech', 'health'] })
    const itemSchema = createSchema({
      type: 'object',
      name: 'Item',
      properties: [createProperty({ name: 'tag', required: false, schema: createSchema({ type: 'ref', name: 'Tag', ref: '#/components/schemas/Tag' }) })],
    })
    const responseSchema = createSchema({
      type: 'object',
      name: 'ItemDetail',
      properties: [createProperty({ name: 'item', required: false, schema: createSchema({ type: 'ref', name: 'Item', ref: '#/components/schemas/Item' }) })],
    })
    const detailOp = createOperation({
      operationId: 'getItemDetail',
      method: 'GET',
      path: '/items/{id}',
      tags: ['items'],
      parameters: [],
      responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'ItemDetail', ref: '#/components/schemas/ItemDetail' }) })],
    })

    const result = collectUsedSchemaNames([detailOp], [tagSchema, itemSchema, responseSchema])

    expect(result).toStrictEqual(new Set(['ItemDetail', 'Item', 'Tag']))
  })

  it('collects schemas referenced in request body content', () => {
    const bodySchema = createSchema({ type: 'object', name: 'CreateItemBody', properties: [] })
    const createItemOp = createOperation({
      operationId: 'createItem',
      method: 'POST',
      path: '/items',
      tags: ['items'],
      parameters: [],
      requestBody: {
        required: true,
        content: [
          { contentType: 'application/json', schema: createSchema({ type: 'ref', name: 'CreateItemBody', ref: '#/components/schemas/CreateItemBody' }) },
        ],
      },
      responses: [],
    })

    const result = collectUsedSchemaNames([createItemOp], [bodySchema])

    expect(result).toStrictEqual(new Set(['CreateItemBody']))
  })
})
