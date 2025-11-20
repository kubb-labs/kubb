import path from 'node:path'
import type { OasTypes } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { getSchemas } from './getSchemas.ts'

describe('getSchemas', () => {
  it('should return schemas from components.schemas', async () => {
    const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

    const result = getSchemas({ oas })
    expect(result).toMatchSnapshot()
  })

  it('should include schemas from responses when enabled', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        responses: {
          GetUserResponse: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { id: { type: 'string' } } },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas, includes: ['responses'] })
    expect(result).toMatchSnapshot()
  })

  it('should include schemas from requestBodies when enabled', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        requestBodies: {
          CreateUserRequest: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { username: { type: 'string' } } },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas, includes: ['requestBodies'] })
    expect(result).toMatchSnapshot()
  })

  it('should use dependency order for schemas (Person before User)', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            allOf: [{ $ref: '#/components/schemas/Person' }, { type: 'object', properties: { username: { type: 'string' } } }],
          },
          Person: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas })
    const keys = Object.keys(result)
    expect(keys).toEqual(['Person', 'User'])

    expect(result).toMatchSnapshot()
  })

  it('should handle circular references gracefully', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          A: {
            properties: {
              b: { $ref: '#/components/schemas/B' },
            },
          },
          B: {
            properties: {
              a: { $ref: '#/components/schemas/A' },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas })
    const keys = Object.keys(result)
    expect(keys.sort()).toEqual(['A', 'B'])

    expect(result).toMatchSnapshot()
  })

  it('should respect custom contentType when multiple exist', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        responses: {
          TestResponse: {
            content: {
              'application/xml': {
                schema: { type: 'object', properties: { xml: { type: 'string' } } },
              },
              'application/json': {
                schema: { type: 'object', properties: { json: { type: 'boolean' } } },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({
      oas,
      includes: ['responses'],
      contentType: 'application/xml',
    })
    expect(Object.keys(result)).toEqual(['TestResponse'])
    expect(result).toMatchSnapshot()
  })

  it('should skip missing components', async () => {
    const oas = await parse({ openapi: '3.0.0', components: {} } as unknown as OasTypes.OASDocument)
    const result = getSchemas({ oas })

    expect(result).toEqual({})
  })

  it('should order schemas with oneOf circular dependencies correctly', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          TypeSchema: {
            oneOf: [{ $ref: '#/components/schemas/ObjectSchema' }, { $ref: '#/components/schemas/StringSchema' }],
            discriminator: {
              propertyName: 'type',
              mapping: {
                object: '#/components/schemas/ObjectSchema',
                string: '#/components/schemas/StringSchema',
              },
            },
          },
          ObjectSchema: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: {
                type: 'string',
                enum: ['object'],
              },
              value: {
                type: 'object',
                additionalProperties: {
                  $ref: '#/components/schemas/TypeSchema',
                },
              },
            },
          },
          StringSchema: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: {
                type: 'string',
                enum: ['string'],
              },
              value: {
                type: 'string',
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas })
    const keys = Object.keys(result)

    // TypeSchema should come AFTER ObjectSchema and StringSchema
    // because it references them in oneOf
    const typeSchemaIndex = keys.indexOf('TypeSchema')
    const objectSchemaIndex = keys.indexOf('ObjectSchema')
    const stringSchemaIndex = keys.indexOf('StringSchema')

    expect(typeSchemaIndex).toBeGreaterThan(objectSchemaIndex)
    expect(typeSchemaIndex).toBeGreaterThan(stringSchemaIndex)

    expect(result).toMatchSnapshot()
  })
})
