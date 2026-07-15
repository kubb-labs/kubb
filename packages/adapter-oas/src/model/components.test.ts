import { describe, expect, it } from 'vitest'
import { createRefs } from '../refs.ts'
import type { Document } from '../types.ts'
import { extractSchemaFromContent, getSchemas, sortSchemas } from './components.ts'

describe('extractSchemaFromContent', () => {
  it('returns null when content is undefined', () => {
    expect(extractSchemaFromContent(undefined)).toBeNull()
  })

  it('returns null when content is empty', () => {
    expect(extractSchemaFromContent({})).toBeNull()
  })

  it('returns the schema for the preferred content type', () => {
    const schema = { type: 'object' as const }
    const content = {
      'application/json': { schema },
      'application/xml': { schema: { type: 'string' as const } },
    }

    expect(extractSchemaFromContent(content, 'application/json')).toBe(schema)
  })

  it('falls back to the first content type when no preference is given', () => {
    const schema = { type: 'object' as const }
    const content = { 'application/json': { schema } }

    expect(extractSchemaFromContent(content)).toBe(schema)
  })

  it('returns null when the schema is a $ref', () => {
    const content = {
      'application/json': { schema: { $ref: '#/components/schemas/Pet' } },
    }

    expect(extractSchemaFromContent(content, 'application/json')).toBeNull()
  })

  it('returns null when the preferred content type is absent', () => {
    const content = {
      'application/xml': { schema: { type: 'string' as const } },
    }

    expect(extractSchemaFromContent(content, 'application/json')).toBeNull()
  })
})

describe('sortSchemas', () => {
  it('returns an empty object for empty input', () => {
    expect(sortSchemas({})).toStrictEqual({})
  })

  it('preserves order when there are no dependencies', () => {
    const schemas = {
      A: { type: 'string' as const },
      B: { type: 'integer' as const },
    }
    const result = sortSchemas(schemas)

    expect(Object.keys(result)).toStrictEqual(['A', 'B'])
  })

  it('places referenced schemas before their dependents', () => {
    const schemas = {
      Order: {
        type: 'object' as const,
        properties: { pet: { $ref: '#/components/schemas/Pet' } },
      },
      Pet: { type: 'object' as const },
    }
    const result = sortSchemas(schemas)
    const keys = Object.keys(result)

    expect(keys.indexOf('Pet')).toBeLessThan(keys.indexOf('Order'))
  })

  it('handles chains: C depends on B, B depends on A', () => {
    const schemas = {
      C: { properties: { b: { $ref: '#/components/schemas/B' } } },
      B: { properties: { a: { $ref: '#/components/schemas/A' } } },
      A: { type: 'string' as const },
    }
    const result = sortSchemas(schemas)
    const keys = Object.keys(result)

    expect(keys.indexOf('A')).toBeLessThan(keys.indexOf('B'))
    expect(keys.indexOf('B')).toBeLessThan(keys.indexOf('C'))
  })

  it('handles cycles without throwing', () => {
    const schemas = {
      A: { properties: { b: { $ref: '#/components/schemas/B' } } },
      B: { properties: { a: { $ref: '#/components/schemas/A' } } },
    }

    expect(() => sortSchemas(schemas)).not.toThrow()
  })
})

describe('getSchemas', () => {
  const base: Document = {
    openapi: '3.0.3',
    info: { title: '', version: '' },
    paths: {},
  } as Document

  it('returns empty schemas when components is absent', () => {
    const { schemas, renames } = getSchemas(base, {}, createRefs(base))
    expect(schemas).toStrictEqual({})
    expect(renames.size).toBe(0)
  })

  it('returns component schemas', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Pet: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))
    expect(schemas).toMatchObject({
      Pet: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
    })
    expect(renames.has('#/components/schemas/Pet')).toBe(false)
  })

  it('includes response schemas', () => {
    const document: Document = {
      ...base,
      components: {
        responses: {
          PetResponse: {
            description: 'A pet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))
    expect(schemas).toMatchObject({
      PetResponse: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
    })
    expect(renames.has('#/components/responses/PetResponse')).toBe(false)
  })

  it('includes requestBody schemas', () => {
    const document: Document = {
      ...base,
      components: {
        requestBodies: {
          CreatePet: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))
    expect(schemas).toMatchObject({
      CreatePet: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
    })
    expect(renames.has('#/components/requestBodies/CreatePet')).toBe(false)
  })

  it('resolves same-source collisions with numeric suffixes', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          pet: { type: 'object', properties: { id: { type: 'integer' } } },
          Pet: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))

    // first entry keeps original name, second gets numeric suffix
    expect(Object.keys(schemas).sort()).toStrictEqual(['Pet2', 'pet'])
    expect(renames.has('#/components/schemas/pet')).toBe(false)
    expect(renames.get('#/components/schemas/Pet')).toBe('Pet2')
  })

  it('resolves name collisions across sources with semantic suffixes (Schema, Response)', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Pet: { type: 'object', properties: { id: { type: 'integer' } } },
        },
        responses: {
          Pet: {
            description: 'Pet response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))

    expect(Object.keys(schemas).sort()).toStrictEqual(['PetResponse', 'PetSchema'])
    expect(renames.get('#/components/schemas/Pet')).toBe('PetSchema')
    expect(renames.get('#/components/responses/Pet')).toBe('PetResponse')
  })

  it('resolves three-way collision across all sources with semantic suffixes', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Pet: { type: 'object' },
        },
        responses: {
          Pet: {
            description: 'Pet response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'integer' } },
                },
              },
            },
          },
        },
        requestBodies: {
          Pet: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    }

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))

    expect(Object.keys(schemas).sort()).toStrictEqual(['PetRequest', 'PetResponse', 'PetSchema'])
    expect(renames.get('#/components/schemas/Pet')).toBe('PetSchema')
    expect(renames.get('#/components/responses/Pet')).toBe('PetResponse')
    expect(renames.get('#/components/requestBodies/Pet')).toBe('PetRequest')
  })

  it('detects collisions from different casing that normalizes to the same PascalCase', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          pet_list: { type: 'object', properties: { a: { type: 'string' } } },
        },
        responses: {
          PetList: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { b: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    }

    const { renames } = getSchemas(document, {}, createRefs(document))

    // both normalize to PetList → semantic suffixes applied
    expect(renames.get('#/components/schemas/pet_list')).toBe('pet_listSchema')
    expect(renames.get('#/components/responses/PetList')).toBe('PetListResponse')
  })

  it('collects enum schemas correctly', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
        },
      },
    }

    const { renames } = getSchemas(document, {}, createRefs(document))
    expect(renames.has('#/components/schemas/Status')).toBe(false)
  })

  it('resolves collision between enum schema and response with semantic suffixes', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Status: { type: 'string', enum: ['active', 'inactive'] },
        },
        responses: {
          Status: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { code: { type: 'integer' } },
                },
              },
            },
          },
        },
      },
    }

    const { renames } = getSchemas(document, {}, createRefs(document))
    expect(renames.get('#/components/schemas/Status')).toBe('StatusSchema')
    expect(renames.get('#/components/responses/Status')).toBe('StatusResponse')
  })

  it('sorts schemas by $ref dependency (referenced schema appears first)', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: { pet: { $ref: '#/components/schemas/Pet' } },
          },
          Pet: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    }

    const { schemas } = getSchemas(document, {}, createRefs(document))
    const keys = Object.keys(schemas)
    expect(keys.indexOf('Pet')).toBeLessThan(keys.indexOf('Order'))
  })

  it('respects contentType when extracting response schemas', () => {
    const document: Document = {
      ...base,
      components: {
        responses: {
          PetResponse: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { id: { type: 'integer' } },
                },
              },
              'application/xml': {
                schema: {
                  type: 'object',
                  properties: { xml: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    }

    const { schemas } = getSchemas(
      document,
      {
        contentType: 'application/xml',
      },
      createRefs(document),
    )
    expect(schemas).toMatchObject({
      PetResponse: {
        type: 'object',
        properties: { xml: { type: 'string' } },
      },
    })
  })
})
