import { describe, expect, it } from 'vitest'
import { createRefs } from '../refs.ts'
import type { Document } from '../types.ts'
import { getSchemas } from './components.ts'

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

  it.each([
    {
      title: 'component schemas',
      components: { schemas: { Pet: { type: 'object', properties: { name: { type: 'string' } } } } },
      pointer: '#/components/schemas/Pet',
      expected: { Pet: { type: 'object', properties: { name: { type: 'string' } } } },
    },
    {
      title: 'response schemas',
      components: {
        responses: {
          PetResponse: { description: 'A pet', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } } },
        },
      },
      pointer: '#/components/responses/PetResponse',
      expected: { PetResponse: { type: 'object', properties: { id: { type: 'integer' } } } },
    },
    {
      title: 'requestBody schemas',
      components: {
        requestBodies: { CreatePet: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } } },
      },
      pointer: '#/components/requestBodies/CreatePet',
      expected: { CreatePet: { type: 'object', properties: { name: { type: 'string' } } } },
    },
  ])('returns $title without renaming', ({ components, pointer, expected }) => {
    const document = { ...base, components } as Document

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))
    expect(schemas).toMatchObject(expected)
    expect(renames.has(pointer)).toBe(false)
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

  it('handles $ref cycles without throwing', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          A: { properties: { b: { $ref: '#/components/schemas/B' } } },
          B: { properties: { a: { $ref: '#/components/schemas/A' } } },
        },
      },
    }

    expect(Object.keys(getSchemas(document, {}, createRefs(document)).schemas).sort()).toStrictEqual(['A', 'B'])
  })

  it('collects nested $defs and maps their references to unique emitted schema names', () => {
    const document: Document = {
      ...base,
      openapi: '3.1.0',
      components: {
        schemas: {
          Box: {
            type: 'object',
            properties: { card: { $ref: '#/components/schemas/Box/$defs/Card' } },
            $defs: {
              Card: {
                type: 'object',
                properties: {
                  rank: { type: 'string' },
                  next: { $ref: '#/components/schemas/Box/$defs/Card' },
                },
              },
            },
          },
          Shelf: {
            type: 'object',
            properties: { card: { $ref: '#/components/schemas/Shelf/$defs/Card' } },
            $defs: {
              Card: { type: 'object', properties: { label: { type: 'string' } } },
            },
          },
        },
      },
    } as unknown as Document

    const { schemas, renames } = getSchemas(document, {}, createRefs(document))

    expect(schemas).toMatchObject({
      Box_Card: { type: 'object', properties: { rank: { type: 'string' }, next: { $ref: '#/components/schemas/Box/$defs/Card' } } },
      Shelf_Card: { type: 'object', properties: { label: { type: 'string' } } },
    })
    expect(renames.get('#/components/schemas/Box/$defs/Card')).toBe('Box_Card')
    expect(renames.get('#/components/schemas/Shelf/$defs/Card')).toBe('Shelf_Card')
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
