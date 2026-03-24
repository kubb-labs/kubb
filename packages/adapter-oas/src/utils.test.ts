import { toSnapshot } from '@internals/utils'
import { describe, expect, it } from 'vitest'
import type { Document } from './types.ts'
import { getSchemas } from './utils.ts'

const base: Document = { openapi: '3.0.3', info: { title: '', version: '' }, paths: {} } as Document

describe('getSchemas', () => {
  it('returns empty schemas when components is absent', () => {
    const { schemas, nameMapping } = getSchemas(base, {})
    expect(schemas).toEqual({})
    expect(nameMapping.size).toBe(0)
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

    const { schemas, nameMapping } = getSchemas(document, {})
    expect(toSnapshot(schemas)).toMatchInlineSnapshot(`
      {
        "Pet": {
          "properties": {
            "name": {
              "type": "string",
            },
          },
          "type": "object",
        },
      }
    `)
    expect(nameMapping.get('#/components/schemas/Pet')).toBe('Pet')
  })

  it('includes response schemas', () => {
    const document: Document = {
      ...base,
      components: {
        responses: {
          PetResponse: {
            description: 'A pet',
            content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } },
          },
        },
      },
    }

    const { schemas, nameMapping } = getSchemas(document, {})
    expect(toSnapshot(schemas)).toMatchInlineSnapshot(`
      {
        "PetResponse": {
          "properties": {
            "id": {
              "type": "integer",
            },
          },
          "type": "object",
        },
      }
    `)
    expect(nameMapping.get('#/components/responses/PetResponse')).toBe('PetResponse')
  })

  it('includes requestBody schemas', () => {
    const document: Document = {
      ...base,
      components: {
        requestBodies: {
          CreatePet: {
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
          },
        },
      },
    }

    const { schemas, nameMapping } = getSchemas(document, {})
    expect(toSnapshot(schemas)).toMatchInlineSnapshot(`
      {
        "CreatePet": {
          "properties": {
            "name": {
              "type": "string",
            },
          },
          "type": "object",
        },
      }
    `)
    expect(nameMapping.get('#/components/requestBodies/CreatePet')).toBe('CreatePet')
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

    const { schemas, nameMapping } = getSchemas(document, {})

    // first entry keeps original name, second gets numeric suffix
    expect(Object.keys(schemas).sort()).toEqual(['Pet2', 'pet'])
    expect(nameMapping.get('#/components/schemas/pet')).toBe('pet')
    expect(nameMapping.get('#/components/schemas/Pet')).toBe('Pet2')
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
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
          },
        },
      },
    }

    const { schemas, nameMapping } = getSchemas(document, {})

    expect(Object.keys(schemas).sort()).toEqual(['PetResponse', 'PetSchema'])
    expect(nameMapping.get('#/components/schemas/Pet')).toBe('PetSchema')
    expect(nameMapping.get('#/components/responses/Pet')).toBe('PetResponse')
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
            content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } } },
          },
        },
        requestBodies: {
          Pet: {
            content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
          },
        },
      },
    }

    const { schemas, nameMapping } = getSchemas(document, {})

    expect(Object.keys(schemas).sort()).toEqual(['PetRequest', 'PetResponse', 'PetSchema'])
    expect(nameMapping.get('#/components/schemas/Pet')).toBe('PetSchema')
    expect(nameMapping.get('#/components/responses/Pet')).toBe('PetResponse')
    expect(nameMapping.get('#/components/requestBodies/Pet')).toBe('PetRequest')
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
            content: { 'application/json': { schema: { type: 'object', properties: { b: { type: 'string' } } } } },
          },
        },
      },
    }

    const { nameMapping } = getSchemas(document, {})

    // both normalize to PetList → semantic suffixes applied
    expect(nameMapping.get('#/components/schemas/pet_list')).toBe('pet_listSchema')
    expect(nameMapping.get('#/components/responses/PetList')).toBe('PetListResponse')
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

    const { nameMapping } = getSchemas(document, {})
    expect(nameMapping.get('#/components/schemas/Status')).toBe('Status')
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
            content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'integer' } } } } },
          },
        },
      },
    }

    const { nameMapping } = getSchemas(document, {})
    expect(nameMapping.get('#/components/schemas/Status')).toBe('StatusSchema')
    expect(nameMapping.get('#/components/responses/Status')).toBe('StatusResponse')
  })

  it('sorts schemas by $ref dependency (referenced schema appears first)', () => {
    const document: Document = {
      ...base,
      components: {
        schemas: {
          Order: { type: 'object', properties: { pet: { $ref: '#/components/schemas/Pet' } } },
          Pet: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    }

    const { schemas } = getSchemas(document, {})
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
              'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } } } },
              'application/xml': { schema: { type: 'object', properties: { xml: { type: 'string' } } } },
            },
          },
        },
      },
    }

    const { schemas } = getSchemas(document, { contentType: 'application/xml' })
    expect(toSnapshot(schemas)).toMatchInlineSnapshot(`
      {
        "PetResponse": {
          "properties": {
            "xml": {
              "type": "string",
            },
          },
          "type": "object",
        },
      }
    `)
  })
})
