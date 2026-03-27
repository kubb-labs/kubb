import { describe, expect, it } from 'vitest'
import { createFunctionParameter, createOperation, createParameter, createSchema } from './factory.ts'
import type { OperationNode, ParameterNode } from './types.ts'
import type { OperationParamsResolver } from './utils.ts'
import { caseParams, createDiscriminantNode, createOperationParams, isStringType } from './utils.ts'

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

    expect(result.map((p) => p.name)).toEqual(['petId', 'orderStatus'])
  })

  it('camelCases kebab-case names', () => {
    const result = caseParams([param('some-param'), param('another-one')], 'camelcase')

    expect(result.map((p) => p.name)).toEqual(['someParam', 'anotherOne'])
  })

  it('leaves already-camelCased names unchanged', () => {
    const result = caseParams([param('petId'), param('limit')], 'camelcase')

    expect(result.map((p) => p.name)).toEqual(['petId', 'limit'])
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
    expect(caseParams([], 'camelcase')).toEqual([])
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
    expect(enumNode.enumValues).toEqual(['dog'])
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
        resolver: makeResolver({ resolveParamName: (_node, param) => `GetPetById["${param.name}"]` }),
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": undefined,
              "inline": true,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": false,
                  "type": "GetPetById["petId"]",
                },
              ],
            },
          ],
        }
      `)
    })

    it('produces inline path params + data + query + headers + extra', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter'), makeHeaderParam('x-api-key')],
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: true,
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: (_node, param) => `Types["${param.name}"]`, resolveDataName: () => 'CreatePetRequest' }),
        extraParams: [createFunctionParameter({ name: 'options', type: 'Partial<Cypress.RequestOptions>', default: '{}' })],
      })

      expect(params.params).toMatchInlineSnapshot(`
        [
          {
            "default": undefined,
            "inline": true,
            "kind": "ParameterGroup",
            "properties": [
              {
                "kind": "FunctionParameter",
                "name": "petId",
                "optional": false,
                "type": "Types["petId"]",
              },
            ],
          },
          {
            "kind": "FunctionParameter",
            "name": "data",
            "optional": false,
            "type": "CreatePetRequest",
          },
          {
            "kind": "FunctionParameter",
            "name": "params",
            "optional": true,
            "type": {
              "kind": "Type",
              "properties": [
                {
                  "name": "filter",
                  "optional": true,
                  "type": "Types["filter"]",
                },
              ],
              "variant": "struct",
            },
          },
          {
            "kind": "FunctionParameter",
            "name": "headers",
            "optional": true,
            "type": {
              "kind": "Type",
              "properties": [
                {
                  "name": "x-api-key",
                  "optional": true,
                  "type": "Types["x-api-key"]",
                },
              ],
              "variant": "struct",
            },
          },
          {
            "default": "{}",
            "kind": "FunctionParameter",
            "name": "options",
            "optional": false,
            "type": "Partial<Cypress.RequestOptions>",
          },
        ]
      `)
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": "{}",
              "inline": true,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": true,
                  "type": "string",
                },
              ],
            },
          ],
        }
      `)
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": undefined,
              "inline": false,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": false,
                  "type": "string",
                },
                {
                  "kind": "FunctionParameter",
                  "name": "storeId",
                  "optional": false,
                  "type": "string",
                },
              ],
            },
          ],
        }
      `)
    })
  })

  describe('object mode', () => {
    it('wraps all params into a single destructured object', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true })],
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: false,
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'object',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: (_node, param) => `Types["${param.name}"]`, resolveDataName: () => 'UpdatePetBody' }),
        extraParams: [createFunctionParameter({ name: 'options', type: 'Options', default: '{}' })],
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": undefined,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": false,
                  "type": "Types["petId"]",
                },
                {
                  "kind": "FunctionParameter",
                  "name": "data",
                  "optional": true,
                  "type": "UpdatePetBody",
                },
                {
                  "kind": "FunctionParameter",
                  "name": "params",
                  "optional": false,
                  "type": {
                    "kind": "Type",
                    "properties": [
                      {
                        "name": "status",
                        "optional": false,
                        "type": "Types["status"]",
                      },
                    ],
                    "variant": "struct",
                  },
                },
              ],
            },
            {
              "default": "{}",
              "kind": "FunctionParameter",
              "name": "options",
              "optional": false,
              "type": "Options",
            },
          ],
        }
      `)
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": "{}",
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "params",
                  "optional": true,
                  "type": {
                    "kind": "Type",
                    "properties": [
                      {
                        "name": "filter",
                        "optional": true,
                        "type": "string",
                      },
                    ],
                    "variant": "struct",
                  },
                },
              ],
            },
          ],
        }
      `)
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
      if (pathParam && pathParam.kind === 'ParameterGroup') {
        expect(pathParam.properties[0]?.name).toBe('petId')
      }
    })
  })

  describe('no parameters', () => {
    it('returns empty params when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [],
        }
      `)
    })

    it('returns only extraParams when operation has no parameters', () => {
      const node = makeOperation()

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        extraParams: [createFunctionParameter({ name: 'options', type: 'Options', default: '{}' })],
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": "{}",
              "kind": "FunctionParameter",
              "name": "options",
              "optional": false,
              "type": "Options",
            },
          ],
        }
      `)
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

      const pathGroup = params.params[0]
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.properties[0]?.type).toBe('unknown')
      }
    })
  })

  describe('requestBody only', () => {
    it('produces data param when operation has only requestBody', () => {
      const node = makeOperation({
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: true,
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'unknown', resolveDataName: () => 'CreatePetRequest' }),
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "kind": "FunctionParameter",
              "name": "data",
              "optional": false,
              "type": "CreatePetRequest",
            },
          ],
        }
      `)
    })

    it('produces optional data param when requestBody is not required', () => {
      const node = makeOperation({
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: false,
        },
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: () => 'unknown', resolveDataName: () => 'UpdatePetRequest' }),
      })

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "kind": "FunctionParameter",
              "name": "data",
              "optional": true,
              "type": "UpdatePetRequest",
            },
          ],
        }
      `)
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
      expect(queryParam).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameter",
          "name": "params",
          "optional": true,
          "type": "FindPetsQueryParams",
        }
      `)
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
      if (objParam && objParam.kind === 'ParameterGroup') {
        const queryChild = objParam.properties.find((p) => p.name === 'params')
        expect(queryChild).toMatchInlineSnapshot(`
          {
            "kind": "FunctionParameter",
            "name": "params",
            "optional": false,
            "type": "FindPetsQueryParams",
          }
        `)
      }
    })

    it('falls back to inline types when resolveQueryParamsName is not provided', () => {
      const node = makeOperation({
        parameters: [makeQueryParam('filter')],
      })

      const params = createOperationParams(node, {
        paramsType: 'inline',
        pathParamsType: 'inline',
        resolver: makeResolver({ resolveParamName: (_node, param) => `Types["${param.name}"]` }),
      })

      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toMatchObject({
        kind: 'Type',
        variant: 'struct',
        properties: expect.arrayContaining([expect.objectContaining({ name: 'filter' })]),
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "kind": "FunctionParameter",
              "name": "headers",
              "optional": false,
              "type": "FindPetsHeaderParams",
            },
          ],
        }
      `)
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
      if (objParam && objParam.kind === 'ParameterGroup') {
        const headerChild = objParam.properties.find((p) => p.name === 'headers')
        expect(headerChild).toMatchInlineSnapshot(`
          {
            "kind": "FunctionParameter",
            "name": "headers",
            "optional": true,
            "type": "HeaderParams",
          }
        `)
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

      const pathGroup = params.params[0]
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.properties).toMatchInlineSnapshot(`
          [
            {
              "kind": "FunctionParameter",
              "name": "petId",
              "optional": false,
              "type": {
                "base": "DeletePetPathParams",
                "key": "petId",
                "kind": "Type",
                "variant": "member",
              },
            },
            {
              "kind": "FunctionParameter",
              "name": "name",
              "optional": true,
              "type": {
                "base": "DeletePetPathParams",
                "key": "name",
                "kind": "Type",
                "variant": "member",
              },
            },
          ]
        `)
      }
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
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.default).toBe('[]')
      }
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
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.default).toBe('{}')
      }
    })
  })

  describe('vue-query style type wrapping', () => {
    it('supports MaybeRefOrGetter wrapping via resolver with group methods', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('filter')],
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: false,
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

      expect(params.params).toMatchInlineSnapshot(`
        [
          {
            "default": undefined,
            "inline": true,
            "kind": "ParameterGroup",
            "properties": [
              {
                "kind": "FunctionParameter",
                "name": "petId",
                "optional": false,
                "type": "MaybeRefOrGetter<Types["petId"]>",
              },
            ],
          },
          {
            "kind": "FunctionParameter",
            "name": "data",
            "optional": true,
            "type": "MaybeRefOrGetter<CreatePetRequest>",
          },
          {
            "kind": "FunctionParameter",
            "name": "params",
            "optional": true,
            "type": "MaybeRefOrGetter<FindPetsQueryParams>",
          },
        ]
      `)
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "kind": "FunctionParameter",
              "name": "params",
              "optional": true,
              "type": {
                "kind": "Type",
                "properties": [
                  {
                    "name": "orderStatus",
                    "optional": true,
                    "type": "Types["orderStatus"]",
                  },
                  {
                    "name": "petCategory",
                    "optional": true,
                    "type": "Types["petCategory"]",
                  },
                ],
                "variant": "struct",
              },
            },
          ],
        }
      `)
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
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.properties.map((p) => p.name)).toEqual(['petId', 'storeName'])
      }
    })
  })

  describe('client-plugin style (inline path + named query/header groups)', () => {
    it('covers the common client plugin scenario: path inline, query + header as named groups', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status'), makeHeaderParam('x-api-key')],
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: true,
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": undefined,
              "inline": true,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": false,
                  "type": "Types["petId"]",
                },
              ],
            },
            {
              "kind": "FunctionParameter",
              "name": "data",
              "optional": false,
              "type": "CreatePetRequest",
            },
            {
              "kind": "FunctionParameter",
              "name": "params",
              "optional": true,
              "type": "GetPetQueryParams",
            },
            {
              "kind": "FunctionParameter",
              "name": "headers",
              "optional": true,
              "type": "GetPetHeaderParams",
            },
          ],
        }
      `)
    })

    it('covers object paramsType with all param types: path + query + header + body', () => {
      const node = makeOperation({
        parameters: [makePathParam('petId'), makeQueryParam('status', { required: true }), makeHeaderParam('x-api-key', { required: true })],
        requestBody: {
          schema: createSchema({ type: 'object' }),
          required: false,
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
      expect(objParam?.kind).toBe('ParameterGroup')
      if (objParam && objParam.kind === 'ParameterGroup') {
        const names = objParam.properties.map((p) => p.name)
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

      expect(params).toMatchInlineSnapshot(`
        {
          "kind": "FunctionParameters",
          "params": [
            {
              "default": undefined,
              "inline": false,
              "kind": "ParameterGroup",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "petId",
                  "optional": false,
                  "type": {
                    "base": "GetPetByIdPathParams",
                    "key": "petId",
                    "kind": "Type",
                    "variant": "member",
                  },
                },
              ],
            },
            {
              "kind": "FunctionParameter",
              "name": "params",
              "optional": true,
              "type": "GetPetByIdQueryParams",
            },
          ],
        }
      `)
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

      const pathGroup = params.params[0]
      if (pathGroup && pathGroup.kind === 'ParameterGroup') {
        expect(pathGroup.properties[0]?.name).toBe('petId')
      }
      const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
      expect(queryParam?.type).toBe('ListPetsQueryParams')
    })
  })
})
