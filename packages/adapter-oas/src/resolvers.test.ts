import { toSnapshot } from '#mocks'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import {
  buildSchemaNode,
  extractSchemaFromContent,
  flattenSchema,
  getDateType,
  getMediaType,
  getPrimitiveType,
  getSchemas,
  getSchemaType,
  resolveServerUrl,
  sortSchemas,
} from './resolvers.ts'
import type { Document } from './types.ts'

describe('getSchemaType', () => {
  it('returns the SchemaType for a known format', () => {
    expect(getSchemaType('uuid')).toBe('uuid')
    expect(getSchemaType('uri')).toBe('url')
    expect(getSchemaType('email')).toBe('email')
  })

  it('returns null for an unknown format', () => {
    expect(getSchemaType('int64')).toBeNull()
    expect(getSchemaType('date-time')).toBeNull()
    expect(getSchemaType('not-a-format')).toBeNull()
  })
})

describe('getPrimitiveType', () => {
  it('returns numeric types unchanged', () => {
    expect(getPrimitiveType('number')).toBe('number')
    expect(getPrimitiveType('integer')).toBe('integer')
    expect(getPrimitiveType('bigint')).toBe('bigint')
  })

  it('maps boolean to boolean', () => {
    expect(getPrimitiveType('boolean')).toBe('boolean')
  })

  it('defaults everything else to string', () => {
    expect(getPrimitiveType('string')).toBe('string')
    expect(getPrimitiveType('object')).toBe('string')
    expect(getPrimitiveType(undefined)).toBe('string')
  })
})

describe('getMediaType', () => {
  it('returns the media type for known content-types', () => {
    expect(getMediaType('application/json')).toBe('application/json')
    expect(getMediaType('application/xml')).toBe('application/xml')
  })

  it('returns null for unknown content-types', () => {
    expect(getMediaType('application/x-unknown')).toBeNull()
    expect(getMediaType('application/msgpack')).toBeNull()
    expect(getMediaType('text/event-stream')).toBeNull()
  })
})

describe('getDateType', () => {
  const base = DEFAULT_PARSER_OPTIONS

  it('returns null when dateType is false', () => {
    expect(getDateType({ ...base, dateType: false }, 'date-time')).toBeNull()
  })

  it('resolves date-time with dateType string to datetime without offset', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'date-time')).toEqual({ type: 'datetime', offset: false })
  })

  it('resolves date-time with dateType date', () => {
    expect(getDateType({ ...base, dateType: 'date' }, 'date-time')).toEqual({ type: 'date', representation: 'date' })
  })

  it('resolves date-time with dateType stringOffset', () => {
    expect(getDateType({ ...base, dateType: 'stringOffset' }, 'date-time')).toEqual({ type: 'datetime', offset: true })
  })

  it('resolves date-time with dateType stringLocal', () => {
    expect(getDateType({ ...base, dateType: 'stringLocal' }, 'date-time')).toEqual({ type: 'datetime', local: true })
  })

  it('resolves date format', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'date')).toEqual({ type: 'date', representation: 'string' })
    expect(getDateType({ ...base, dateType: 'date' }, 'date')).toEqual({ type: 'date', representation: 'date' })
  })

  it('resolves time format', () => {
    expect(getDateType({ ...base, dateType: 'string' }, 'time')).toEqual({ type: 'time', representation: 'string' })
    expect(getDateType({ ...base, dateType: 'date' }, 'time')).toEqual({ type: 'time', representation: 'date' })
  })
})

describe('buildSchemaNode', () => {
  it('builds a node with all metadata fields', () => {
    const schema = {
      title: 'My Schema',
      description: 'A description',
      deprecated: true,
      readOnly: true,
      writeOnly: false,
      example: 42,
    }
    const node = buildSchemaNode(schema, 'myName', true, 'defaultVal')

    expect(node).toEqual({
      name: 'myName',
      nullable: true,
      title: 'My Schema',
      description: 'A description',
      deprecated: true,
      readOnly: true,
      writeOnly: false,
      default: 'defaultVal',
      example: 42,
    })
  })

  it('passes through undefined fields as undefined', () => {
    const node = buildSchemaNode({}, undefined, undefined, undefined)

    expect(node.name).toBeUndefined()
    expect(node.nullable).toBeUndefined()
    expect(node.title).toBeUndefined()
    expect(node.default).toBeUndefined()
  })

  it('return type has name and nullable fields', () => {
    const node = buildSchemaNode({}, 'x', undefined, null)

    expectTypeOf(node.name).toEqualTypeOf<string | null | undefined>()
    expectTypeOf(node.nullable).toEqualTypeOf<true | undefined>()
  })
})

describe('flattenSchema', () => {
  it('returns null for null input', () => {
    expect(flattenSchema(null)).toBeNull()
  })

  it('returns schema unchanged when there is no allOf', () => {
    const schema = { type: 'string' as const }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf is empty', () => {
    const schema = { allOf: [] }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf contains a $ref', () => {
    const schema = { allOf: [{ $ref: '#/components/schemas/Pet' }] }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('returns schema unchanged when allOf contains structural keys', () => {
    const schema = { allOf: [{ properties: { id: { type: 'integer' as const } } }] }

    expect(flattenSchema(schema)).toBe(schema)
  })

  it('merges plain allOf fragments into the parent schema', () => {
    const schema = {
      type: 'object' as const,
      allOf: [{ description: 'A pet' }, { example: 'Fido' }],
    }
    const result = flattenSchema(schema)

    expect(result).not.toHaveProperty('allOf')
    expect(result).toMatchObject({ type: 'object', description: 'A pet', example: 'Fido' })
  })

  it('does not overwrite existing keys during merge', () => {
    const schema = {
      description: 'existing',
      allOf: [{ description: 'from allOf' }],
    }
    const result = flattenSchema(schema)

    expect(result?.description).toBe('existing')
  })
})

describe('extractSchemaFromContent', () => {
  it('returns null when content is undefined', () => {
    expect(extractSchemaFromContent(undefined)).toBeNull()
  })

  it('returns null when content is empty', () => {
    expect(extractSchemaFromContent({})).toBeNull()
  })

  it('returns the schema for the preferred content type', () => {
    const schema = { type: 'object' as const }
    const content = { 'application/json': { schema }, 'application/xml': { schema: { type: 'string' as const } } }

    expect(extractSchemaFromContent(content, 'application/json')).toBe(schema)
  })

  it('falls back to the first content type when no preference is given', () => {
    const schema = { type: 'object' as const }
    const content = { 'application/json': { schema } }

    expect(extractSchemaFromContent(content)).toBe(schema)
  })

  it('returns null when the schema is a $ref', () => {
    const content = { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } }

    expect(extractSchemaFromContent(content, 'application/json')).toBeNull()
  })

  it('returns null when the preferred content type is absent', () => {
    const content = { 'application/xml': { schema: { type: 'string' as const } } }

    expect(extractSchemaFromContent(content, 'application/json')).toBeNull()
  })
})

describe('sortSchemas', () => {
  it('returns an empty object for empty input', () => {
    expect(sortSchemas({})).toEqual({})
  })

  it('preserves order when there are no dependencies', () => {
    const schemas = { A: { type: 'string' as const }, B: { type: 'integer' as const } }
    const result = sortSchemas(schemas)

    expect(Object.keys(result)).toEqual(['A', 'B'])
  })

  it('places referenced schemas before their dependents', () => {
    const schemas = {
      Order: { type: 'object' as const, properties: { pet: { $ref: '#/components/schemas/Pet' } } },
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

describe('resolveServerUrl', () => {
  it('returns the url unchanged when there are no variables', () => {
    expect(resolveServerUrl({ url: 'https://api.example.com' })).toBe('https://api.example.com')
  })

  it('replaces a variable with the provided override', () => {
    expect(resolveServerUrl({ url: 'https://{env}.api.example.com', variables: { env: { default: 'dev', enum: ['dev', 'prod'] } } }, { env: 'prod' })).toBe(
      'https://prod.api.example.com',
    )
  })

  it('falls back to the variable default when no override is given', () => {
    expect(resolveServerUrl({ url: 'https://{env}.api.example.com', variables: { env: { default: 'dev' } } })).toBe('https://dev.api.example.com')
  })

  it('leaves the placeholder unreplaced when no override and no default', () => {
    expect(resolveServerUrl({ url: 'https://{env}.api.example.com', variables: { env: { default: '' } } })).toBe('https://.api.example.com')
  })

  it('replaces multiple variables', () => {
    expect(
      resolveServerUrl(
        { url: 'https://{env}.api.example.com/{version}', variables: { env: { default: 'dev' }, version: { default: 'v1' } } },
        { env: 'prod', version: 'v2' },
      ),
    ).toBe('https://prod.api.example.com/v2')
  })

  it('throws when an override value is not in the allowed enum list', () => {
    expect(() =>
      resolveServerUrl({ url: 'https://{env}.api.example.com', variables: { env: { default: 'dev', enum: ['dev', 'prod'] } } }, { env: 'staging' }),
    ).toThrow("Invalid server variable value 'staging' for 'env'")
  })
})

describe('getSchemas', () => {
  const base: Document = { openapi: '3.0.3', info: { title: '', version: '' }, paths: {} } as Document

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
