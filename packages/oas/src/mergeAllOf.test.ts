import type { OpenAPIV3 } from 'openapi-types'
import { describe, expect, test } from 'vitest'
import { mergeAllOf } from './mergeAllOf.ts'

describe('mergeAllOf', () => {
  test('returns ReferenceObject unchanged', () => {
    const refSchema: OpenAPIV3.ReferenceObject = {
      $ref: '#/components/schemas/Pet',
    }

    const result = mergeAllOf(refSchema)

    expect(result).toEqual(refSchema)
    expect(result).toBe(refSchema) // Should be the same object
  })

  test('returns schema without allOf unchanged (except recursive processing)', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    }

    const result = mergeAllOf(schema)

    expect(result).toEqual(schema)
  })

  test('merges Box Shared link example from issue (three allOf entries)', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string', example: '12345' },
            url: { type: 'string', format: 'uri' },
            access: { type: 'string', enum: ['open', 'company', 'collaborators'] },
          },
          required: ['id', 'url'],
        },
        {
          description: 'A shared link for a Box file or folder',
        },
        {
          nullable: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.allOf).toBeUndefined()
    expect(result.type).toBe('object')
    expect(result.description).toBe('A shared link for a Box file or folder')
    expect(result.nullable).toBe(true)
    expect(result.properties).toEqual({
      id: { type: 'string', example: '12345' },
      url: { type: 'string', format: 'uri' },
      access: { type: 'string', enum: ['open', 'company', 'collaborators'] },
    })
    expect(result.required).toEqual(['id', 'url'])
  })

  test('merges properties with later entries overriding earlier ones', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
        },
        {
          properties: {
            name: { type: 'string', minLength: 3 }, // Override name property
            age: { type: 'number' },
          },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.allOf).toBeUndefined()
    expect(result.properties).toEqual({
      id: { type: 'string' },
      name: { type: 'string', minLength: 3 }, // Later entry won
      age: { type: 'number' },
    })
  })

  test('unions required arrays and deduplicates', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
          },
          required: ['id', 'name'],
        },
        {
          required: ['name', 'email'], // 'name' is duplicate
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.required).toEqual(expect.arrayContaining(['id', 'name', 'email']))
    expect(result.required?.length).toBe(3)
  })

  test('merges type with later entry taking precedence', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
        },
        {
          type: 'object', // Same type
          properties: { id: { type: 'string' } },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.type).toBe('object')
  })

  test('root schema type takes precedence over allOf', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      allOf: [
        {
          properties: { id: { type: 'string' } },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.type).toBe('object')
  })

  test('merges descriptions from allOf when root has no description', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
        },
        {
          description: 'This is a description',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.description).toBe('This is a description')
  })

  test('root description takes precedence', () => {
    const schema: OpenAPIV3.SchemaObject = {
      description: 'Root description',
      allOf: [
        {
          description: 'AllOf description',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.description).toBe('Root description')
  })

  test('nullable set to true if any allOf entry has nullable true', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          nullable: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.nullable).toBe(true)
  })

  test('root nullable overrides allOf nullable', () => {
    const schema: OpenAPIV3.SchemaObject = {
      nullable: false,
      allOf: [
        {
          nullable: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.nullable).toBe(false)
  })

  test('merges deprecated flag', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          deprecated: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.deprecated).toBe(true)
  })

  test('merges readOnly flag', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
          readOnly: true,
        },
        {
          description: 'A read-only field',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.readOnly).toBe(true)
  })

  test('merges writeOnly flag', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          writeOnly: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.writeOnly).toBe(true)
  })

  test('root example takes precedence', () => {
    const schema: OpenAPIV3.SchemaObject = {
      example: 'root example',
      allOf: [
        {
          example: 'allOf example',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.example).toBe('root example')
  })

  test('uses last non-empty example from allOf when no root example', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          example: 'first example',
        },
        {
          example: 'second example',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.example).toBe('second example')
  })

  test('unions enum arrays and deduplicates', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
          enum: ['red', 'green'],
        },
        {
          enum: ['green', 'blue'], // 'green' is duplicate
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.enum).toEqual(expect.arrayContaining(['red', 'green', 'blue']))
    expect(result.enum?.length).toBe(3)
  })

  test('additionalProperties false takes precedence', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
          additionalProperties: true,
        },
        {
          additionalProperties: false,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.additionalProperties).toBe(false)
  })

  test('additionalProperties as schema - later overrides', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
        {
          additionalProperties: { type: 'number' },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.additionalProperties).toEqual({ type: 'number' })
  })

  test('merges items for array schemas', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'array',
        },
        {
          items: { type: 'string' },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.items).toEqual({ type: 'string' })
  })

  test('later items override earlier items', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'array',
          items: { type: 'string' },
        },
        {
          items: { type: 'number' },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.items).toEqual({ type: 'number' })
  })

  test('recursively merges nested allOf in properties', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        user: {
          allOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
            {
              properties: {
                name: { type: 'string' },
              },
            },
          ],
        },
      },
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.properties?.user).toBeDefined()
    const userProp = result.properties?.user as OpenAPIV3.SchemaObject
    expect(userProp.allOf).toBeUndefined()
    expect(userProp.properties).toEqual({
      id: { type: 'string' },
      name: { type: 'string' },
    })
  })

  test('recursively merges nested allOf in array items', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'array',
      items: {
        allOf: [
          {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          {
            properties: {
              name: { type: 'string' },
            },
          },
        ],
      },
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.items).toBeDefined()
    const items = result.items as OpenAPIV3.SchemaObject
    expect(items.allOf).toBeUndefined()
    expect(items.properties).toEqual({
      id: { type: 'string' },
      name: { type: 'string' },
    })
  })

  test('handles references in allOf by skipping them', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          $ref: '#/components/schemas/Base',
        } as OpenAPIV3.ReferenceObject,
        {
          type: 'object',
          properties: {
            extra: { type: 'string' },
          },
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    // Reference is skipped, only the second schema is merged
    expect(result.allOf).toBeUndefined()
    expect(result.properties).toEqual({
      extra: { type: 'string' },
    })
  })

  test('merges format property', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          format: 'email',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.format).toBe('email')
  })

  test('merges pattern property', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          pattern: '^[a-z]+$',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.pattern).toBe('^[a-z]+$')
  })

  test('merges numeric constraints', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'number',
          minimum: 0,
        },
        {
          maximum: 100,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.minimum).toBe(0)
    expect(result.maximum).toBe(100)
  })

  test('merges string constraints', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
          minLength: 1,
        },
        {
          maxLength: 100,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.minLength).toBe(1)
    expect(result.maxLength).toBe(100)
  })

  test('merges array constraints', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'array',
          minItems: 1,
        },
        {
          maxItems: 10,
          uniqueItems: true,
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.minItems).toBe(1)
    expect(result.maxItems).toBe(10)
    expect(result.uniqueItems).toBe(true)
  })

  test('merges default values', () => {
    const schema: OpenAPIV3.SchemaObject = {
      allOf: [
        {
          type: 'string',
        },
        {
          default: 'default value',
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.default).toBe('default value')
  })

  test('complex nested schema with multiple levels of allOf', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        metadata: {
          allOf: [
            {
              type: 'object',
              properties: {
                created: { type: 'string', format: 'date-time' },
              },
            },
            {
              properties: {
                updated: { type: 'string', format: 'date-time' },
                tags: {
                  allOf: [{ type: 'array' }, { items: { type: 'string' } }],
                },
              },
            },
          ],
        },
      },
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    const metadata = result.properties?.metadata as OpenAPIV3.SchemaObject
    expect(metadata.allOf).toBeUndefined()
    expect(metadata.properties?.created).toEqual({ type: 'string', format: 'date-time' })
    expect(metadata.properties?.updated).toEqual({ type: 'string', format: 'date-time' })

    const tags = metadata.properties?.tags as OpenAPIV3.SchemaObject
    expect(tags.allOf).toBeUndefined()
    expect(tags.type).toBe('array')
    expect(tags.items).toEqual({ type: 'string' })
  })

  test('empty allOf array', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      allOf: [],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.allOf).toBeUndefined()
    expect(result.type).toBe('object')
  })

  test('root schema with properties merged with allOf', () => {
    const schema: OpenAPIV3.SchemaObject = {
      type: 'object',
      properties: {
        rootProp: { type: 'string' },
      },
      required: ['rootProp'],
      allOf: [
        {
          properties: {
            allOfProp: { type: 'number' },
          },
          required: ['allOfProp'],
        },
      ],
    }

    const result = mergeAllOf(schema) as OpenAPIV3.SchemaObject

    expect(result.allOf).toBeUndefined()
    expect(result.properties).toEqual({
      allOfProp: { type: 'number' },
      rootProp: { type: 'string' }, // Root takes precedence
    })
    expect(result.required).toEqual(expect.arrayContaining(['rootProp', 'allOfProp']))
  })
})
