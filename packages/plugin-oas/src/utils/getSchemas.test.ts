import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { OasTypes } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { describe, expect, it } from 'vitest'
import { getSchemas } from './getSchemas.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('getSchemas', () => {
  it('should return schemas from components.schemas', async () => {
    const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

    const { schemas: result } = getSchemas({ oas })
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
                schema: {
                  type: 'object',
                  properties: { id: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const { schemas: result } = getSchemas({ oas, includes: ['responses'] })
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
                schema: {
                  type: 'object',
                  properties: { username: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const { schemas: result } = getSchemas({ oas, includes: ['requestBodies'] })
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

    const { schemas: result } = getSchemas({ oas })
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

    const { schemas: result } = getSchemas({ oas })
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
                schema: {
                  type: 'object',
                  properties: { xml: { type: 'string' } },
                },
              },
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { json: { type: 'boolean' } },
                },
              },
            },
          },
        },
      },
    } as unknown as OasTypes.OASDocument)

    const { schemas: result } = getSchemas({
      oas,
      includes: ['responses'],
      contentType: 'application/xml',
    })
    expect(Object.keys(result)).toEqual(['TestResponse'])
    expect(result).toMatchSnapshot()
  })

  it('should skip missing components', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      components: {},
    } as unknown as OasTypes.OASDocument)
    const { schemas: result } = getSchemas({ oas })

    expect(result).toEqual({})
  })

  describe('collision detection', () => {
    it('should handle same-component case-insensitive collisions with numeric suffixes', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            Variant: {
              type: 'object',
              properties: { id: { type: 'string' }, type: { type: 'string' } },
            },
            variant: {
              type: 'object',
              properties: { id: { type: 'string' }, label: { type: 'string' } },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result)

      // First occurrence keeps original name, second gets numeric suffix
      expect(keys).toEqual(['Variant', 'variant2'])
      expect(result.Variant).toBeDefined()
      expect(result.variant2).toBeDefined()
      expect(result.Variant!.properties).toHaveProperty('type')
      expect(result.variant2!.properties).toHaveProperty('label')
    })

    it('should handle cross-component collisions with semantic suffixes', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            Product: {
              type: 'object',
              properties: { id: { type: 'string' }, price: { type: 'number' } },
            },
          },
          responses: {
            Product: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { productId: { type: 'string' }, stock: { type: 'integer' } },
                  },
                },
              },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result).sort()

      expect(keys).toEqual(['ProductResponse', 'ProductSchema'])
      expect(result.ProductSchema).toBeDefined()
      expect(result.ProductResponse).toBeDefined()
      expect(result.ProductSchema!.properties).toHaveProperty('price')
      expect(result.ProductResponse!.properties).toHaveProperty('stock')
    })

    it('should handle schema + requestBody collision with semantic suffixes', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            Order: {
              type: 'object',
              properties: { id: { type: 'string' }, items: { type: 'array' } },
            },
          },
          requestBodies: {
            Order: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { userId: { type: 'string' }, productIds: { type: 'array' } },
                  },
                },
              },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result).sort()

      expect(keys).toEqual(['OrderRequest', 'OrderSchema'])
      expect(result.OrderSchema!.properties).toHaveProperty('items')
      expect(result.OrderRequest!.properties).toHaveProperty('productIds')
    })

    it('should handle three-way collision (schemas + responses + requestBodies)', async () => {
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
            User: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { userId: { type: 'string' } },
                  },
                },
              },
            },
          },
          requestBodies: {
            User: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { username: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result).sort()

      expect(keys).toEqual(['UserRequest', 'UserResponse', 'UserSchema'])
      expect(result.UserSchema!.properties).toHaveProperty('id')
      expect(result.UserResponse!.properties).toHaveProperty('userId')
      expect(result.UserRequest!.properties).toHaveProperty('username')
    })

    it('should handle multiple same-component collisions with incremental suffixes', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            user: {
              type: 'object',
              properties: { a: { type: 'string' } },
            },
            User: {
              type: 'object',
              properties: { b: { type: 'string' } },
            },
            USER: {
              type: 'object',
              properties: { c: { type: 'string' } },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result)

      // "user" and "User" both normalize to "User" in PascalCase
      // "USER" normalizes to "USER" (preserveConsecutiveUppercase)
      // So only "user" and "User" collide
      expect(keys).toEqual(['user', 'User2', 'USER'])
      expect(result.user!.properties).toHaveProperty('a')
      expect(result.User2!.properties).toHaveProperty('b')
      expect(result.USER!.properties).toHaveProperty('c')
    })

    it('should not collide when casing produces different PascalCase results', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            item: {
              type: 'object',
              properties: { a: { type: 'string' } },
            },
            // ITEM preserves consecutive uppercase, so it becomes "ITEM" not "Item"
            ITEM: {
              type: 'object',
              properties: { b: { type: 'string' } },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result).sort()

      // "item" → "Item", "ITEM" → "ITEM" (different PascalCase results, no collision)
      expect(keys).toEqual(['ITEM', 'item'])
      expect(result.item).toBeDefined()
      expect(result.ITEM).toBeDefined()
    })

    it('should not add suffixes when no collision exists', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: { id: { type: 'string' } },
            },
            Product: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result).sort()

      expect(keys).toEqual(['Product', 'User'])
      // No suffixes added
      expect(result.User).toBeDefined()
      expect(result.Product).toBeDefined()
    })

    it('should handle collision with empty content in response', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            Error: {
              type: 'object',
              properties: { message: { type: 'string' } },
            },
          },
          responses: {
            Error: {
              description: 'Error response without content',
            },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })

      // Only schema should be present since response has no content
      expect(Object.keys(result)).toEqual(['Error'])
      expect(result.Error!.properties).toHaveProperty('message')
    })

    it('should preserve spec order for deterministic output', async () => {
      const oas = await parse({
        openapi: '3.0.0',
        components: {
          schemas: {
            Zebra: { type: 'object' },
            apple: { type: 'object' },
            Banana: { type: 'object' },
          },
        },
      } as unknown as OasTypes.OASDocument)

      const { schemas: result } = getSchemas({ oas })
      const keys = Object.keys(result)

      // Preserves original order from spec, not alphabetical
      expect(keys).toEqual(['Zebra', 'apple', 'Banana'])
    })
  })
})
