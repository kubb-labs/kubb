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
