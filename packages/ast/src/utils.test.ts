import { describe, expect, it } from 'vitest'
import { createFunctionParameter, createOperation, createParameter, createSchema, createTypeExpression } from './factory.ts'
import type { OperationNode, ParameterNode } from './types.ts'
import type { OperationParamsResolver } from './utils.ts'
import { caseParams, createDiscriminantNode, createOperationParams, isStringType, syncSchemaRef } from './utils.ts'

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

describe('syncSchemaRef', () => {
  it('returns a merged schema for a ref node that has a resolved schema', () => {
    const resolved = createSchema({ type: 'object' })
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema: resolved })

    const merged = syncSchemaRef(ref)
    expect(merged).not.toBeNull()
    expect(merged?.type).toBe('object')
  })

  it('returns a merged schema with sibling overrides applied over the resolved schema', () => {
    const resolved = createSchema({ type: 'object', description: 'Original' })
    const ref = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema: resolved, description: 'Override', readOnly: true })

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
                  "type": {
                    "kind": "Type",
                    "name": "GetPetById["petId"]",
                    "variant": "reference",
                  },
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
        extraParams: [
          createFunctionParameter({ name: 'options', type: createTypeExpression({ variant: 'reference', name: 'Partial<Cypress.RequestOptions>' }), default: '{}' }),
        ],
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
                "type": {
                  "kind": "Type",
                  "name": "Types["petId"]",
                  "variant": "reference",
                },
              },
            ],
          },
          {
            "kind": "FunctionParameter",
            "name": "data",
            "optional": false,
            "type": {
              "kind": "Type",
              "name": "CreatePetRequest",
              "variant": "reference",
            },
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
                  "type": {
                    "kind": "Type",
                    "name": "Types["filter"]",
                    "variant": "reference",
                  },
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
                  "type": {
                    "kind": "Type",
                    "name": "Types["x-api-key"]",
                    "variant": "reference",
                  },
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
            "type": {
              "kind": "Type",
              "name": "Partial<Cypress.RequestOptions>",
              "variant": "reference",
            },
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
                  "type": {
                    "kind": "Type",
                    "name": "string",
                    "variant": "reference",
                  },
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
                  "type": {
                    "kind": "Type",
                    "name": "string",
                    "variant": "reference",
                  },
                },
                {
                  "kind": "FunctionParameter",
                  "name": "storeId",
                  "optional": false,
                  "type": {
                    "kind": "Type",
                    "name": "string",
                    "variant": "reference",
                  },
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
        extraParams: [createFunctionParameter({ name: 'options', type: createTypeExpression({ variant: 'reference', name: 'Options' }), default: '{}' })],
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
                  "type": {
                    "kind": "Type",
                    "name": "Types["petId"]",
                    "variant": "reference",
                  },
                },
                {
                  "kind": "FunctionParameter",
                  "name": "data",
                  "optional": true,
                  "type": {
                    "kind": "Type",
                    "name": "UpdatePetBody",
                    "variant": "reference",
                  },
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
                        "type": {
                          "kind": "Type",
                          "name": "Types["status"]",
                          "variant": "reference",
                        },
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
              "type": {
                "kind": "Type",
                "name": "Options",
                "variant": "reference",
              },
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
                        "type": {
                          "kind": "Type",
                          "name": "string",
                          "variant": "reference",
                        },
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
        extraParams: [createFunctionParameter({ name: 'options', type: createTypeExpression({ variant: 'reference', name: 'Options' }), default: '{}' })],
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
              "type": {
                "kind": "Type",
                "name": "Options",
                "variant": "reference",
              },
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
        expect(pathGroup.properties[0]?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'string' })
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
              "type": {
                "kind": "Type",
                "name": "CreatePetRequest",
                "variant": "reference",
              },
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
              "type": {
                "kind": "Type",
                "name": "UpdatePetRequest",
                "variant": "reference",
              },
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
          "type": {
            "kind": "Type",
            "name": "FindPetsQueryParams",
            "variant": "reference",
          },
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
            "type": {
              "kind": "Type",
              "name": "FindPetsQueryParams",
              "variant": "reference",
            },
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
              "type": {
                "kind": "Type",
                "name": "FindPetsHeaderParams",
                "variant": "reference",
              },
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
            "type": {
              "kind": "Type",
              "name": "HeaderParams",
              "variant": "reference",
            },
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
                "type": {
                  "kind": "Type",
                  "name": "MaybeRefOrGetter<Types["petId"]>",
                  "variant": "reference",
                },
              },
            ],
          },
          {
            "kind": "FunctionParameter",
            "name": "data",
            "optional": true,
            "type": {
              "kind": "Type",
              "name": "MaybeRefOrGetter<CreatePetRequest>",
              "variant": "reference",
            },
          },
          {
            "kind": "FunctionParameter",
            "name": "params",
            "optional": true,
            "type": {
              "kind": "Type",
              "name": "MaybeRefOrGetter<FindPetsQueryParams>",
              "variant": "reference",
            },
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
                    "type": {
                      "kind": "Type",
                      "name": "Types["orderStatus"]",
                      "variant": "reference",
                    },
                  },
                  {
                    "name": "petCategory",
                    "optional": true,
                    "type": {
                      "kind": "Type",
                      "name": "Types["petCategory"]",
                      "variant": "reference",
                    },
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
                  "type": {
                    "kind": "Type",
                    "name": "Types["petId"]",
                    "variant": "reference",
                  },
                },
              ],
            },
            {
              "kind": "FunctionParameter",
              "name": "data",
              "optional": false,
              "type": {
                "kind": "Type",
                "name": "CreatePetRequest",
                "variant": "reference",
              },
            },
            {
              "kind": "FunctionParameter",
              "name": "params",
              "optional": true,
              "type": {
                "kind": "Type",
                "name": "GetPetQueryParams",
                "variant": "reference",
              },
            },
            {
              "kind": "FunctionParameter",
              "name": "headers",
              "optional": true,
              "type": {
                "kind": "Type",
                "name": "GetPetHeaderParams",
                "variant": "reference",
              },
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
              "type": {
                "kind": "Type",
                "name": "GetPetByIdQueryParams",
                "variant": "reference",
              },
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
      expect(queryParam?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'ListPetsQueryParams' })
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

    const group = params.params[0]
    if (group?.kind === 'ParameterGroup') {
      expect(group.properties[0]?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'MaybeRefOrGetter<string>' })
    }
  })

  it('wraps body type with the provided function', () => {
    const node = makeOperation({
      requestBody: { schema: createSchema({ type: 'object' }), required: true },
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveDataName: () => 'CreatePetRequest' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const bodyParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'data')
    expect(bodyParam?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'MaybeRefOrGetter<CreatePetRequest>' })
  })

  it('wraps query group type with the provided function', () => {
    const node = makeOperation({
      parameters: [makeQueryParam('status')],
    })

    const params = createOperationParams(node, {
      paramsType: 'inline',
      pathParamsType: 'inline',
      resolver: makeResolver({ resolveQueryParamsName: () => 'ListPetsQueryParams' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const queryParam = params.params.find((p) => p.kind === 'FunctionParameter' && p.name === 'params')
    expect(queryParam?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'MaybeRefOrGetter<ListPetsQueryParams>' })
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

    const group = params.params[0]
    if (group?.kind === 'ParameterGroup') {
      expect(group.properties[0]?.type).toEqual({ kind: 'Type', variant: 'reference', name: 'string' })
    }
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
      resolver: makeResolver({ resolvePathParamsName: () => 'GetPetByIdPathParams' }),
    })

    expect(params.params).toHaveLength(1)
    const restParam = params.params[0]
    expect(restParam?.kind).toBe('FunctionParameter')
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.rest).toBe(true)
      expect(restParam.name).toBe('pathParams')
      expect(restParam.type).toEqual({ kind: 'Type', variant: 'reference', name: 'GetPetByIdPathParams' })
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
      resolver: makeResolver({ resolvePathParamsName: () => 'GetPetByIdPathParams' }),
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
      resolver: makeResolver({ resolvePathParamsName: () => 'GetPetByIdPathParams' }),
      typeWrapper: (t) => `MaybeRefOrGetter<${t}>`,
    })

    const restParam = params.params[0]
    if (restParam?.kind === 'FunctionParameter') {
      expect(restParam.type).toEqual({ kind: 'Type', variant: 'reference', name: 'MaybeRefOrGetter<GetPetByIdPathParams>' })
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

import { createExport, createImport, createSource } from './factory.ts'
import { combineExports, combineImports, combineSources } from './utils.ts'

describe('combineSources', () => {
  it('deduplicates sources with the same name', () => {
    const src = createSource({ name: 'Pet', value: 'export type Pet = {}' })
    const result = combineSources([src, src])

    expect(result).toHaveLength(1)
  })

  it('keeps sources with different names', () => {
    const a = createSource({ name: 'Pet', value: 'export type Pet = {}' })
    const b = createSource({ name: 'Order', value: 'export type Order = {}' })
    const result = combineSources([a, b])

    expect(result).toHaveLength(2)
  })

  it('deduplicates by value when name is absent', () => {
    const src = createSource({ value: 'const x = 1' })
    const result = combineSources([src, src])

    expect(result).toHaveLength(1)
  })

  it('treats sources with the same name but different isExportable as distinct', () => {
    const a = createSource({ name: 'Pet', value: 'export type Pet = {}', isExportable: true })
    const b = createSource({ name: 'Pet', value: 'export type Pet = {}', isExportable: false })
    const result = combineSources([a, b])

    expect(result).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(combineSources([])).toEqual([])
  })
})

describe('combineExports', () => {
  it('deduplicates identical named exports from the same path', () => {
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const result = combineExports([exp, exp])

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toEqual(['Pet'])
  })

  it('merges named exports from the same path into one entry', () => {
    const a = createExport({ name: ['Pet'], path: './models' })
    const b = createExport({ name: ['Order'], path: './models' })
    const result = combineExports([a, b])

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toContain('Pet')
    expect(result[0]!.name).toContain('Order')
  })

  it('keeps type-only and value exports from the same path separate', () => {
    const value = createExport({ name: ['Pet'], path: './Pet', isTypeOnly: false })
    const typeOnly = createExport({ name: ['Pet'], path: './Pet', isTypeOnly: true })
    const result = combineExports([value, typeOnly])

    expect(result).toHaveLength(2)
  })

  it('keeps wildcard and named exports from the same path separate', () => {
    const wildcard = createExport({ path: './utils' })
    const named = createExport({ name: ['helper'], path: './utils' })
    const result = combineExports([wildcard, named])

    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty array for empty input', () => {
    expect(combineExports([])).toEqual([])
  })
})

describe('combineImports', () => {
  it('keeps imports whose names appear in the source', () => {
    const imp = createImport({ name: ['z'], path: 'zod' })
    const result = combineImports([imp], [], 'const schema = z.string()')

    expect(result).toHaveLength(1)
    expect(result[0]!.path).toBe('zod')
  })

  it('filters out imports whose names do not appear in the source', () => {
    const imp = createImport({ name: ['unused'], path: 'lodash' })
    const result = combineImports([imp], [], 'const x = 1')

    expect(result).toHaveLength(0)
  })

  it('retains imports that are re-exported', () => {
    const imp = createImport({ name: ['Pet'], path: './Pet' })
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const result = combineImports([imp], [exp], '')

    expect(result).toHaveLength(1)
  })

  it('merges named imports from the same path with the same isTypeOnly', () => {
    const a = createImport({ name: ['Pet'], path: './models' })
    const b = createImport({ name: ['Order'], path: './models' })
    const result = combineImports([a, b], [], 'Pet Order')

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toContain('Pet')
    expect(result[0]!.name).toContain('Order')
  })

  it('keeps value and type-only imports from the same path separate', () => {
    const value = createImport({ name: ['Pet'], path: './models', isTypeOnly: false })
    const typeOnly = createImport({ name: ['Pet'], path: './models', isTypeOnly: true })
    const result = combineImports([value, typeOnly], [], 'Pet')

    expect(result).toHaveLength(2)
  })

  it('skips an import when path equals root', () => {
    const imp = createImport({ name: ['self'], path: 'src/pet.ts', root: 'src/pet.ts' })
    const result = combineImports([imp], [], 'self')

    expect(result).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(combineImports([], [], '')).toEqual([])
  })
})
