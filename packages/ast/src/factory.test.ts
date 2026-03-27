import type { OperationParamsResolver } from './factory.ts'
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  createDiscriminantNode,
  createFunctionParameter,
  createFunctionParameters,
  createObjectBindingParameter,
  createOperation,
  createOperationParams,
  createParameter,
  createProperty,
  createResponse,
  createRoot,
  createSchema,
} from './factory.ts'
import type { ObjectSchemaNode, StringSchemaNode } from './nodes/schema.ts'

describe('createRoot', () => {
  it('creates a RootNode with default empty arrays', () => {
    const node = createRoot()

    expect(node.kind).toBe('Root')
    expect(node.schemas).toEqual([])
    expect(node.operations).toEqual([])
  })

  it('accepts overrides', () => {
    const schema = createSchema({ type: 'string' })
    const node = createRoot({ schemas: [schema] })

    expect(node.schemas).toHaveLength(1)
    expect(node.operations).toEqual([])
  })

  it('always sets kind to Root', () => {
    // @ts-expect-error — kind should be overridden back to 'Root'
    const node = createRoot({ kind: 'Operation' })

    expect(node.kind).toBe('Root')
  })
})

describe('createOperation', () => {
  it('creates an OperationNode with required fields', () => {
    const node = createOperation({ operationId: 'getPets', method: 'GET', path: '/pets' })

    expect(node.kind).toBe('Operation')
    expect(node.operationId).toBe('getPets')
    expect(node.method).toBe('GET')
    expect(node.path).toBe('/pets')
    expect(node.tags).toEqual([])
    expect(node.parameters).toEqual([])
    expect(node.responses).toEqual([])
  })

  it('accepts optional fields', () => {
    const node = createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      summary: 'Create a pet',
      deprecated: true,
      tags: ['pets'],
    })

    expect(node.summary).toBe('Create a pet')
    expect(node.deprecated).toBe(true)
    expect(node.tags).toEqual(['pets'])
  })
})

describe('createSchema', () => {
  it('creates a SchemaNode with a type', () => {
    const node = createSchema({ type: 'string' })

    expect(node.kind).toBe('Schema')
    expect(node.type).toBe('string')
  })

  it('accepts nullable and description', () => {
    const node = createSchema({ type: 'number', nullable: true, description: 'An age value' })

    expect(node.nullable).toBe(true)
    expect(node.description).toBe('An age value')
  })

  it('creates an object schema with properties', () => {
    const prop = createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) })
    const node = createSchema({ type: 'object', properties: [prop] })

    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('id')
  })

  it('creates a ref schema', () => {
    const node = createSchema({ type: 'ref', name: 'Pet' })

    expect(node.name).toBe('Pet')
  })

  it('narrows return type to StringSchemaNode for type "string"', () => {
    expectTypeOf(createSchema({ type: 'string' })).toMatchTypeOf<StringSchemaNode & { kind: 'Schema' }>()
  })

  it('narrows return type to ObjectSchemaNode for type "object"', () => {
    expectTypeOf(createSchema({ type: 'object' })).toMatchTypeOf<ObjectSchemaNode & { kind: 'Schema' }>()
  })
})

describe('createProperty', () => {
  it('defaults required to false', () => {
    const node = createProperty({ name: 'name', schema: createSchema({ type: 'string' }) })

    expect(node.kind).toBe('Property')
    expect(node.required).toBe(false)
  })

  it('accepts required: true', () => {
    const node = createProperty({
      name: 'id',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.required).toBe(true)
    expect(node.schema.optional).toBeFalsy()
    expect(node.schema.nullable).toBeFalsy()
    expect(node.schema.nullish).toBeFalsy()
  })
})

describe('createParameter', () => {
  it('creates a path parameter', () => {
    const node = createParameter({
      name: 'petId',
      in: 'path',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.kind).toBe('Parameter')
    expect(node.in).toBe('path')
    expect(node.required).toBe(true)
  })

  it('defaults required to false', () => {
    const node = createParameter({
      name: 'limit',
      in: 'query',
      schema: createSchema({ type: 'integer' }),
    })

    expect(node.required).toBe(false)
  })
})

describe('createResponse', () => {
  it('creates a response with just a status code', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({
        type: 'string',
      }),
    })

    expect(node.kind).toBe('Response')
    expect(node.statusCode).toBe('200')
  })

  it('accepts a schema and description', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({ type: 'object' }),
      description: 'Success',
    })

    expect(node.schema?.type).toBe('object')
    expect(node.description).toBe('Success')
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

describe('createFunctionParameter', () => {
  it('defaults optional to false', () => {
    const node = createFunctionParameter({ name: 'petId', type: 'string' })

    expect(node.kind).toBe('FunctionParameter')
    expect(node.name).toBe('petId')
    expect(node.type).toBe('string')
    expect(node.optional).toBe(false)
  })

  it('supports optional true without default', () => {
    const node = createFunctionParameter({ name: 'query', type: 'Query', optional: true })

    expect(node.optional).toBe(true)
    expect(node.default).toBeUndefined()
  })

  it('supports default value with optional false/omitted', () => {
    const node = createFunctionParameter({ name: 'config', type: 'RequestConfig', default: '{}' })

    expect(node.optional).toBe(false)
    expect(node.default).toBe('{}')
  })
})

describe('createObjectBindingParameter', () => {
  it('creates object binding parameter with properties', () => {
    const props = [createFunctionParameter({ name: 'id', type: 'string' })]
    const node = createObjectBindingParameter({ properties: props })

    expect(node.kind).toBe('ObjectBindingParameter')
    expect(node.properties).toEqual(props)
  })

  it('accepts inline and default options', () => {
    const node = createObjectBindingParameter({
      properties: [createFunctionParameter({ name: 'id', type: 'string' })],
      inline: true,
      default: '{}',
    })

    expect(node.inline).toBe(true)
    expect(node.default).toBe('{}')
  })
})

describe('createFunctionParameters', () => {
  it('defaults params to empty array', () => {
    const node = createFunctionParameters()

    expect(node.kind).toBe('FunctionParameters')
    expect(node.params).toEqual([])
  })

  it('accepts params override', () => {
    const params = [createFunctionParameter({ name: 'petId', type: 'string' })]
    const node = createFunctionParameters({ params })

    expect(node.params).toEqual(params)
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
  return {
    resolveParamName: (_node, param) => param.name,
    resolveDataName: () => 'unknown',
    resolvePathParamsName: (_node, param) => param.name,
    resolveQueryParamsName: (_node, param) => param.name,
    resolveHeaderParamsName: (_node, param) => param.name,
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
              "kind": "ObjectBindingParameter",
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
            "kind": "ObjectBindingParameter",
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
            "type": "{ filter?: Types["filter"] }",
          },
          {
            "kind": "FunctionParameter",
            "name": "headers",
            "optional": true,
            "type": "{ x-api-key?: Types["x-api-key"] }",
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
              "kind": "ObjectBindingParameter",
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
              "kind": "ObjectBindingParameter",
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
              "kind": "ObjectBindingParameter",
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
                  "type": "{ status: Types["status"] }",
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
              "kind": "ObjectBindingParameter",
              "properties": [
                {
                  "kind": "FunctionParameter",
                  "name": "params",
                  "optional": true,
                  "type": "{ filter?: string }",
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
      if (pathParam && pathParam.kind === 'ObjectBindingParameter') {
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
      if (pathGroup && pathGroup.kind === 'ObjectBindingParameter') {
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
      if (objParam && objParam.kind === 'ObjectBindingParameter') {
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
      expect(queryParam?.type).toContain('filter')
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
      if (objParam && objParam.kind === 'ObjectBindingParameter') {
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
      if (pathGroup && pathGroup.kind === 'ObjectBindingParameter') {
        expect(pathGroup.properties).toMatchInlineSnapshot(`
          [
            {
              "kind": "FunctionParameter",
              "name": "petId",
              "optional": false,
              "type": "DeletePetPathParams['petId']",
            },
            {
              "kind": "FunctionParameter",
              "name": "name",
              "optional": true,
              "type": "DeletePetPathParams['name']",
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
      if (pathGroup && pathGroup.kind === 'ObjectBindingParameter') {
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
      if (pathGroup && pathGroup.kind === 'ObjectBindingParameter') {
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
            "kind": "ObjectBindingParameter",
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
})
