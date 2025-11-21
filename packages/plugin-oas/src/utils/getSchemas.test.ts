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

  it('should handle case-insensitive duplicate names within schemas', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          Variant: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
          variant: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas })
    const keys = Object.keys(result)
    
    // Both schemas should be present with unique names
    expect(keys).toHaveLength(2)
    expect(keys).toContain('Variant')
    expect(keys.some(key => key.startsWith('variant'))).toBe(true)
    
    // The second one should have a suffix
    expect(keys).toEqual(expect.arrayContaining(['Variant', 'variantSchema']))
  })

  it('should handle case-insensitive duplicates between schemas and responses', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          User: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
        responses: {
          user: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas, includes: ['schemas', 'responses'] })
    const keys = Object.keys(result)
    
    // Both should be present with unique names
    expect(keys).toHaveLength(2)
    expect(keys).toContain('User')
    expect(keys.some(key => key.toLowerCase().includes('user') && key !== 'User')).toBe(true)
  })

  it('should handle multiple case-insensitive duplicates with number suffixes', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          Item: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
          item: {
            type: 'object',
            properties: { name: { type: 'string' } },
          },
          ITEM: {
            type: 'object',
            properties: { value: { type: 'number' } },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas })
    const keys = Object.keys(result)
    
    // All three schemas should be present with unique names
    expect(keys).toHaveLength(3)
    expect(keys).toContain('Item')
    
    // Check that all names are unique (case-sensitive)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(3)
  })

  it('should handle case-insensitive duplicates across all sources', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {
        schemas: {
          Product: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
        },
        responses: {
          product: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
        },
        requestBodies: {
          PRODUCT: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { price: { type: 'number' } } },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const result = getSchemas({ oas, includes: ['schemas', 'responses', 'requestBodies'] })
    const keys = Object.keys(result)
    
    // All three should be present with unique names
    expect(keys).toHaveLength(3)
    expect(keys).toContain('Product')
    
    // Check that all names are unique
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(3)
  })
})
