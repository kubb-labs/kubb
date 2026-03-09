import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import yaml from '@stoplight/yaml'
import { describe, expect, test } from 'vitest'
import type { SchemaObject } from './types.ts'
import {
  collectRefs,
  extractSchemaFromContent,
  getSemanticSuffix,
  legacyResolve,
  merge,
  parse,
  parseFromConfig,
  resolveCollisions,
  type SchemaWithMetadata,
  sortSchemas,
} from './utils.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('utils', () => {
  test('merge of 2 oas documents', async () => {
    const documents = [
      `openapi: 3.0.0
info:
  title: Swagger PetStore
  version: 1.0.0
components:
  schemas:
    Point:
      type: object
      properties:
        x:
          type: number
        y:
          type: number
      required: [x, y]
`,
      `openapi: 3.0.0
info:
  title: Shapes
  version: 1.0.0
paths: {}
components:
  schemas:
    Square:
      type: object
      properties:
        topLeft:
          $ref: '#/components/schemas/Point'
        size:
          type: number
      required: [topLeft, size]`,
    ]
    const oas = await merge(documents)

    expect(oas).toBeDefined()
    expect(oas.document).toMatchSnapshot()
    expect(oas.api?.info.title).toBe('Shapes')
  })

  test('parse a simple oas document', async () => {
    const oas = await parse(
      `openapi: 3.0.0
info:
  title: Swagger PetStore
  version: 1.0.0
components:
  schemas:
    Point:
      type: object
      properties:
        x:
          type: number
        y:
          type: number
      required: [x, y]
`,
      { canBundle: false },
    )
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })
})

describe('parseFromConfig', () => {
  const petStoreV3 = path.resolve(__dirname, '../mocks/petStore.yaml')
  const petStoreV2 = path.resolve(__dirname, '../mocks/petStoreV2.json')

  const yamlPetStoreString = `
openapi: 3.0.0
info:
  title: Swagger PetStore
  version: 1.0.0
paths:
  /users/{userId}:
    get:
      tags:
        - Users
      summary: Get public user details
      operationId: getUser
      parameters:
        - $ref: "#/components/parameters/userId"
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: User details retrieved successfully
                  user:
                    type: object
                    properties:
                      userId:
                        type: string
                        example: 1234343434343
components:
  parameters:
    userId:
      name: userId
      in: path
      description: Executes the action in the context of the specified user.
      required: true
      schema:
        type: string
        example: 1234343434343
  `

  const petStoreObject = yaml.parse(yamlPetStoreString)

  test('check if oas and title is defined based on a Swagger(v3) file', async () => {
    const oas = await parse(petStoreV3)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore - OpenAPI 3.0')
  })

  test('check if oas and title is defined based on a Swagger(v2) file', async () => {
    const oas = await parse(petStoreV2)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON import', async () => {
    const data = await import(petStoreV2)

    const oas = await parseFromConfig({
      root: process.cwd(),
      input: {
        data,
      },
    } as Config)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON string', async () => {
    const oas = await parseFromConfig({
      root: process.cwd(),
      input: {
        data: JSON.stringify(petStoreObject),
      },
    } as Config)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })

  test('check if oas and title is defined based on a Swagger(v3) JSON object', async () => {
    const oas = await parseFromConfig({
      root: process.cwd(),
      input: {
        data: petStoreObject,
      },
    } as Config)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })

  test('check if oas and title is defined based on a Swagger(v3) YAML', async () => {
    const oas = await parseFromConfig({
      root: process.cwd(),
      input: {
        data: yamlPetStoreString,
      },
    } as Config)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger PetStore')
  })

  describe('collectRefs', () => {
    test('should collect $ref from schema', () => {
      const schema = {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          role: { $ref: '#/components/schemas/Role' },
        },
      }
      const refs = collectRefs(schema)
      expect(refs).toEqual(new Set(['User', 'Role']))
    })

    test('should collect nested $refs', () => {
      const schema = {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            properties: {
              child: { $ref: '#/components/schemas/Child' },
            },
          },
        ],
      }
      const refs = collectRefs(schema)
      expect(refs).toEqual(new Set(['Base', 'Child']))
    })

    test('should handle arrays', () => {
      const schema = {
        type: 'array',
        items: [{ $ref: '#/components/schemas/Item1' }, { $ref: '#/components/schemas/Item2' }],
      }
      const refs = collectRefs(schema)
      expect(refs).toEqual(new Set(['Item1', 'Item2']))
    })

    test('should ignore non-component $refs', () => {
      const schema = {
        properties: {
          external: { $ref: 'http://example.com/schema' },
          internal: { $ref: '#/components/schemas/Internal' },
        },
      }
      const refs = collectRefs(schema)
      expect(refs).toEqual(new Set(['Internal']))
    })
  })

  describe('sortSchemas', () => {
    test('should sort schemas by dependencies', () => {
      const schemas: Record<string, SchemaObject> = {
        Parent: {
          type: 'object',
          properties: {
            child: { $ref: '#/components/schemas/Child' },
          },
        },
        Child: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      }

      const sorted = sortSchemas(schemas)
      const keys = Object.keys(sorted)

      // Child should come before Parent
      expect(keys.indexOf('Child')).toBeLessThan(keys.indexOf('Parent'))
    })

    test('should handle circular dependencies', () => {
      const schemas: Record<string, SchemaObject> = {
        A: {
          type: 'object',
          properties: {
            b: { $ref: '#/components/schemas/B' },
          },
        },
        B: {
          type: 'object',
          properties: {
            a: { $ref: '#/components/schemas/A' },
          },
        },
      }

      // Should not throw
      const sorted = sortSchemas(schemas)
      expect(Object.keys(sorted)).toHaveLength(2)
    })
  })

  describe('extractSchemaFromContent', () => {
    test('should extract schema from application/json content', () => {
      const content = {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      }

      const schema = extractSchemaFromContent(content)
      expect(schema).toEqual({
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      })
    })

    test('should use preferred content type', () => {
      const content = {
        'application/json': {
          schema: { type: 'string' },
        },
        'application/xml': {
          schema: { type: 'number' },
        },
      }

      const schema = extractSchemaFromContent(content, 'application/xml')
      expect(schema).toEqual({ type: 'number' })
    })

    test('should return null for $ref schemas', () => {
      const content = {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/User',
          },
        },
      }

      const schema = extractSchemaFromContent(content)
      expect(schema).toBeNull()
    })

    test('should return null for undefined content', () => {
      const schema = extractSchemaFromContent(undefined)
      expect(schema).toBeNull()
    })
  })

  describe('getSemanticSuffix', () => {
    test('should return correct suffix for schemas', () => {
      expect(getSemanticSuffix('schemas')).toBe('Schema')
    })

    test('should return correct suffix for responses', () => {
      expect(getSemanticSuffix('responses')).toBe('Response')
    })

    test('should return correct suffix for requestBodies', () => {
      expect(getSemanticSuffix('requestBodies')).toBe('Request')
    })
  })

  describe('legacyResolve', () => {
    test('should use original names without collision detection', () => {
      const schemasWithMeta: SchemaWithMetadata[] = [
        {
          schema: { type: 'object' },
          source: 'schemas',
          originalName: 'User',
        },
        {
          schema: { type: 'object' },
          source: 'responses',
          originalName: 'User',
        },
      ]

      const result = legacyResolve(schemasWithMeta)

      // Last one wins (overwrites)
      expect(Object.keys(result.schemas)).toEqual(['User'])
      expect(result.nameMapping.get('#/components/responses/User')).toBe('User')
    })
  })

  describe('resolveCollisions', () => {
    test('should handle no collisions', () => {
      const schemasWithMeta: SchemaWithMetadata[] = [
        {
          schema: { type: 'object' },
          source: 'schemas',
          originalName: 'User',
        },
        {
          schema: { type: 'object' },
          source: 'schemas',
          originalName: 'Product',
        },
      ]

      const result = resolveCollisions(schemasWithMeta)

      expect(Object.keys(result.schemas)).toEqual(['User', 'Product'])
      expect(result.nameMapping.get('#/components/schemas/User')).toBe('User')
      expect(result.nameMapping.get('#/components/schemas/Product')).toBe('Product')
    })

    test('should add semantic suffixes for cross-component collisions', () => {
      const schemasWithMeta: SchemaWithMetadata[] = [
        {
          schema: { type: 'object', properties: { id: { type: 'string' } } },
          source: 'schemas',
          originalName: 'Order',
        },
        {
          schema: { type: 'object', properties: { items: { type: 'array' } } },
          source: 'requestBodies',
          originalName: 'Order',
        },
      ]

      const result = resolveCollisions(schemasWithMeta)

      expect(Object.keys(result.schemas)).toEqual(['OrderSchema', 'OrderRequest'])
      expect(result.nameMapping.get('#/components/schemas/Order')).toBe('OrderSchema')
      expect(result.nameMapping.get('#/components/requestBodies/Order')).toBe('OrderRequest')
    })

    test('should add numeric suffixes for same-component collisions', () => {
      const schemasWithMeta: SchemaWithMetadata[] = [
        {
          schema: { type: 'string', enum: ['A', 'B'] },
          source: 'schemas',
          originalName: 'Variant',
        },
        {
          schema: { type: 'string', enum: ['X', 'Y'] },
          source: 'schemas',
          originalName: 'variant',
        },
      ]

      const result = resolveCollisions(schemasWithMeta)

      expect(Object.keys(result.schemas)).toEqual(['Variant', 'variant2'])
      expect(result.nameMapping.get('#/components/schemas/Variant')).toBe('Variant')
      expect(result.nameMapping.get('#/components/schemas/variant')).toBe('variant2')
    })

    test('should handle case-insensitive collisions', () => {
      const schemasWithMeta: SchemaWithMetadata[] = [
        {
          schema: { type: 'object', description: 'first' },
          source: 'schemas',
          originalName: 'User',
        },
        {
          schema: { type: 'object', description: 'second' },
          source: 'schemas',
          originalName: 'user',
        },
      ]

      const result = resolveCollisions(schemasWithMeta)

      // Should detect as collision and add numeric suffixes
      expect(Object.keys(result.schemas)).toEqual(['User', 'user2'])
      expect(result.schemas['User']).toBeDefined()
      expect(result.schemas['user2']).toBeDefined()
    })
  })
})
