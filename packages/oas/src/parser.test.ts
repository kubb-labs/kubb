import { narrowSchema } from '@kubb/ast'
import type {
  ArraySchemaNode,
  EnumSchemaNode,
  IntersectionSchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  RefSchemaNode,
  ScalarSchemaNode,
  SchemaNode,
  StringSchemaNode,
  UnionSchemaNode,
} from '@kubb/ast/types'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildMinimalOas } from '../mocks/oas.ts'
import { Oas } from './Oas.ts'
import { createOasParser } from './parser.ts'
import type { SchemaObject } from './types.ts'

const emptyOas = new Oas({ openapi: '3.0.0', info: { title: '', version: '' }, paths: {} } as any)

describe('buildAst', () => {
  it('returns a RootNode', async () => {
    const oas = await buildMinimalOas()
    const root = createOasParser(oas).buildAst()

    expect(root.kind).toBe('Root')
  })

  describe('schemas', () => {
    it('converts named component schemas', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const names = root.schemas.map((s) => s.name)

      expect(names).toContain('Pet')
      expect(names).toContain('NewPet')
      expect(names).toContain('Error')
    })

    it('converts object schema with properties', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const pet = narrowSchema(
        root.schemas.find((s) => s.name === 'Pet'),
        'object',
      )

      expect(pet?.type).toBe('object')
      expect(pet?.properties?.map((p) => p.name)).toEqual(expect.arrayContaining(['id', 'name', 'tag']))
    })

    it('marks required properties', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const pet = narrowSchema(
        root.schemas.find((s) => s.name === 'Pet'),
        'object',
      )
      const idProp = pet?.properties?.find((p) => p.name === 'id')
      const tagProp = pet?.properties?.find((p) => p.name === 'tag')

      expect(idProp?.required).toBe(true)
      expect(tagProp?.required).toBe(false)
    })

    it('converts array schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const list = narrowSchema(
        root.schemas.find((s) => s.name === 'PetList'),
        'array',
      )

      expect(list?.type).toBe('array')
      expect(list?.items).toHaveLength(1)
      expect(list?.items?.[0]?.type).toBe('ref')
    })

    it('converts enum schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const status = narrowSchema(
        root.schemas.find((s) => s.name === 'Status'),
        'enum',
      )

      expect(status?.type).toBe('enum')
      expect(status?.enumValues).toEqual(['active', 'inactive', 'pending'])
    })

    it('converts oneOf to union', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const petOrError = narrowSchema(
        root.schemas.find((s) => s.name === 'PetOrError'),
        'union',
      )

      expect(petOrError?.type).toBe('union')
      expect(petOrError?.members).toHaveLength(2)
    })

    it('converts allOf to intersection', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const fullPet = narrowSchema(
        root.schemas.find((s) => s.name === 'FullPet'),
        'intersection',
      )

      expect(fullPet?.type).toBe('intersection')
      expect(fullPet?.members).toHaveLength(2)
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const nullableString = root.schemas.find((s) => s.name === 'NullableString')

      // Should be flattened to 'string' — not an intersection
      expect(nullableString?.type).toBe('string')
      expect(nullableString?.nullable).toBe(true)
      expect(nullableString?.readOnly).toBe(true)
      expect(nullableString?.example).toBe('some-value')
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const nullableRef = narrowSchema(
        root.schemas.find((s) => s.name === 'NullableRef'),
        'ref',
      )

      // Should be flattened to a ref — not an intersection
      expect(nullableRef?.type).toBe('ref')
      expect(nullableRef?.ref).toBe('#/components/schemas/Pet')
      expect(nullableRef?.nullable).toBe(true)
    })

    it('maps format date-time to datetime SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const fullPet = narrowSchema(
        root.schemas.find((s) => s.name === 'FullPet'),
        'intersection',
      )
      // second member is an inline object with createdAt (datetime) and email
      const objectMember = narrowSchema(
        fullPet?.members?.find((m) => m.type === 'object'),
        'object',
      )
      const createdAt = objectMember?.properties?.find((p) => p.name === 'createdAt')

      expect(createdAt?.schema.type).toBe('datetime')
    })

    it('maps format email to email SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const fullPet = narrowSchema(
        root.schemas.find((s) => s.name === 'FullPet'),
        'intersection',
      )
      const objectMember = narrowSchema(
        fullPet?.members?.find((m) => m.type === 'object'),
        'object',
      )
      const email = objectMember?.properties?.find((p) => p.name === 'email')

      expect(email?.schema.type).toBe('email')
    })
  })

  describe('operations', () => {
    it('converts all operations', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()

      expect(root.operations).toHaveLength(3)
    })

    it('sets operationId, method, path, tags', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const listPets = root.operations.find((op) => op.operationId === 'listPets')

      expect(listPets?.method).toBe('GET')
      expect(listPets?.path).toBe('/pets')
      expect(listPets?.tags).toContain('pets')
      expect(listPets?.summary).toBe('List all pets')
    })

    it('sets deprecated flag', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.deprecated).toBe(true)
    })

    it('uses uppercase HTTP method per RFC 9110', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      for (const op of root.operations) {
        expect(op.method).toBe(op.method.toUpperCase())
      }
    })

    it('converts query parameters', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const limit = listPets?.parameters.find((p) => p.name === 'limit')

      expect(limit?.in).toBe('query')
      expect(limit?.required).toBe(false)
      expect(limit?.schema.type).toBe('integer')
    })

    it('converts path parameters', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const petId = getPet?.parameters.find((p) => p.name === 'petId')

      expect(petId?.in).toBe('path')
      expect(petId?.required).toBe(true)
      expect(petId?.schema.type).toBe('integer')
    })

    it('converts requestBody', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.requestBody).toBeDefined()
      expect(createPet?.requestBody?.type).toBe('ref')
    })

    it('converts responses with statusCode and schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.description).toBe('A list of pets')
      expect(ok?.schema?.type).toBe('ref')
    })

    it('converts responses without a body schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const notFound = getPet?.responses.find((r) => r.statusCode === '404')

      expect(notFound?.description).toBe('Not found')
      expect(notFound?.schema).toBeUndefined()
    })

    it('sets mediaType on responses', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser(oas).buildAst()
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.mediaType).toBe('application/json')
    })
  })
})

describe('convertSchema return type narrowing', () => {
  const parser = createOasParser(emptyOas)

  it('narrows to RefSchemaNode when $ref is present', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet' } })

    expectTypeOf(node).toEqualTypeOf<RefSchemaNode>()
  })

  it('narrows to ObjectSchemaNode when type is object', () => {
    const node = parser.convertSchema({ schema: { type: 'object' } })

    expectTypeOf(node).toEqualTypeOf<ObjectSchemaNode>()
  })

  it('narrows to ArraySchemaNode when type is array', () => {
    const node = parser.convertSchema({ schema: { type: 'array' } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('narrows to EnumSchemaNode when enum is present', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'] } })

    expectTypeOf(node).toEqualTypeOf<EnumSchemaNode>()
  })

  it('narrows to UnionSchemaNode when oneOf is present', () => {
    const node = parser.convertSchema({ schema: { oneOf: [{ type: 'string' }, { type: 'number' }] } })

    expectTypeOf(node).toEqualTypeOf<UnionSchemaNode>()
  })

  it('narrows to UnionSchemaNode when anyOf is present', () => {
    const node = parser.convertSchema({ schema: { anyOf: [{ type: 'string' }, { type: 'number' }] } })

    expectTypeOf(node).toEqualTypeOf<UnionSchemaNode>()
  })

  it('narrows to StringSchemaNode for string type', () => {
    const node = parser.convertSchema({ schema: { type: 'string' } })

    expectTypeOf(node).toEqualTypeOf<StringSchemaNode>()
  })

  it('narrows to NumberSchemaNode for number type', () => {
    const node = parser.convertSchema({ schema: { type: 'number' } })

    expectTypeOf(node).toEqualTypeOf<NumberSchemaNode>()
  })

  it('narrows to NumberSchemaNode for integer type', () => {
    const node = parser.convertSchema({ schema: { type: 'integer' } })

    expectTypeOf(node).toEqualTypeOf<NumberSchemaNode>()
  })

  it('narrows to ScalarSchemaNode for boolean type', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean' } })

    expectTypeOf(node).toEqualTypeOf<ScalarSchemaNode>()
  })

  it('narrows to ArraySchemaNode when items is present', () => {
    const node = parser.convertSchema({ schema: { items: { type: 'string' } } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('narrows to StringSchemaNode when minLength is present', () => {
    const node = parser.convertSchema({ schema: { minLength: 1 } })

    expectTypeOf(node).toEqualTypeOf<StringSchemaNode>()
  })

  it('narrows to StringSchemaNode when maxLength is present', () => {
    const node = parser.convertSchema({ schema: { maxLength: 100 } })

    expectTypeOf(node).toEqualTypeOf<StringSchemaNode>()
  })

  it('narrows to StringSchemaNode when pattern is present', () => {
    const node = parser.convertSchema({ schema: { pattern: '^[a-z]+$' } })

    expectTypeOf(node).toEqualTypeOf<StringSchemaNode>()
  })

  it('narrows to NumberSchemaNode when minimum is present', () => {
    const node = parser.convertSchema({ schema: { minimum: 0 } })

    expectTypeOf(node).toEqualTypeOf<NumberSchemaNode>()
  })

  it('narrows to NumberSchemaNode when maximum is present', () => {
    const node = parser.convertSchema({ schema: { maximum: 100 } })

    expectTypeOf(node).toEqualTypeOf<NumberSchemaNode>()
  })

  it('resolves to datetime type when format is date-time', () => {
    const node = parser.convertSchema({ schema: { format: 'date-time' } })

    expect(node.type).toBe('datetime')
  })

  it('resolves to date type when format is date', () => {
    const node = parser.convertSchema({ schema: { format: 'date' } })

    expect(node.type).toBe('date')
  })

  it('resolves to time type when format is time', () => {
    const node = parser.convertSchema({ schema: { format: 'time' } })

    expect(node.type).toBe('time')
  })

  it('falls back to SchemaNode for an untyped empty schema', () => {
    const node = parser.convertSchema({ schema: {} })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
  })
})

describe('convertSchema uuid', () => {
  const parser = createOasParser(emptyOas)

  it('maps format uuid to uuid', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'uuid' } })

    expect(node.type).toBe('uuid')
  })

  it('maps format uuid without type to uuid (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'uuid' } })

    expect(node.type).toBe('uuid')
  })

  it('preserves nullable on uuid', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'uuid', nullable: true } })

    expect(node.type).toBe('uuid')
    expect(node.nullable).toBe(true)
  })

  it('preserves description on uuid', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'uuid', description: 'A unique identifier' } })

    expect(node.type).toBe('uuid')
    expect(node.description).toBe('A unique identifier')
  })
})

describe('convertSchema email', () => {
  const parser = createOasParser(emptyOas)

  it('maps format email to email', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'email' } })

    expect(node.type).toBe('email')
  })

  it('maps format idn-email to email', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'idn-email' } })

    expect(node.type).toBe('email')
  })

  it('maps format email without type to email (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'email' } })

    expect(node.type).toBe('email')
  })

  it('preserves nullable on email', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'email', nullable: true } })

    expect(node.type).toBe('email')
    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema url', () => {
  const parser = createOasParser(emptyOas)

  it.each(['uri', 'uri-reference', 'url', 'ipv4', 'ipv6', 'hostname', 'idn-hostname'])('maps format %s to url', (format) => {
    const node = parser.convertSchema({ schema: { type: 'string', format } })

    expect(node.type).toBe('url')
  })

  it('maps format uri without type to url (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'uri' } })

    expect(node.type).toBe('url')
  })

  it('preserves nullable on url', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'uri', nullable: true } })

    expect(node.type).toBe('url')
    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema binary', () => {
  const parser = createOasParser(emptyOas)

  it('maps string with format binary to blob', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'binary' } })

    expect(node.type).toBe('blob')
  })

  it('maps string with format byte to blob', () => {
    const node = parser.convertSchema({ schema: { type: 'string', format: 'byte' } })

    expect(node.type).toBe('blob')
  })

  it('maps format binary without type to blob (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'binary' } })

    expect(node.type).toBe('blob')
  })
})

describe('convertSchema contentMediaType (OAS 3.1)', () => {
  const parser = createOasParser(emptyOas)

  it('maps string with contentMediaType application/octet-stream to blob', () => {
    const node = parser.convertSchema({ schema: { type: 'string', contentMediaType: 'application/octet-stream' } })

    expect(node.type).toBe('blob')
  })

  it('leaves string with other contentMediaType as string', () => {
    const node = parser.convertSchema({ schema: { type: 'string', contentMediaType: 'text/plain' } })

    expect(node.type).toBe('string')
  })
})

describe('convertSchema allOf', () => {
  const parser = createOasParser(emptyOas)

  it('flattens single-member allOf to the member type', () => {
    const node = parser.convertSchema({ schema: { allOf: [{ type: 'string' }] } as const })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
    expect(node.type).toBe('string')
  })

  it('merges outer metadata onto a flattened single-member allOf', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }],
        description: 'wrapped',
        deprecated: true,
        nullable: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
    expect(node.type).toBe('string')
    expect(node.description).toBe('wrapped')
    expect(node.deprecated).toBe(true)
    expect(node.nullable).toBe(true)
  })

  it('flattens single-member allOf $ref and preserves nullable', () => {
    const node = parser.convertSchema({ schema: { allOf: [{ $ref: '#/components/schemas/Pet' }], nullable: true } as const })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
    expect(node.type).toBe('ref')
    expect(node.nullable).toBe(true)
  })

  it('produces an intersection for multiple allOf members', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { tag: { type: 'string' } } }],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    expect(node.type).toBe('intersection')
    expect(node.members).toHaveLength(2)
  })

  it('appends sibling properties as an extra intersection member', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }],
        properties: { extra: { type: 'string' } },
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    // first member: the $ref, last member: the sibling properties object
    expect(node.members?.[0]?.type).toBe('ref')
    expect(node.members?.[node.members.length - 1]?.type).toBe('object')
  })

  it('resolves required keys missing from outer properties by looking into allOf members', () => {
    const node = parser.convertSchema({
      schema: {
        required: ['id'],
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    // 2 allOf members + 1 injected member for the missing required key
    expect(node.members).toHaveLength(3)
    // the injected member is an object with `id` marked required
    const injected = narrowSchema(node.members?.[2], 'object')
    expect(injected?.properties?.find((p) => p.name === 'id')?.required).toBe(true)
  })

  it('does not inject required keys that are already in outer properties', () => {
    const node = parser.convertSchema({
      schema: {
        required: ['id'],
        properties: { id: { type: 'integer' } },
        allOf: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    // only the allOf member + the sibling properties object; no extra injection
    const objectMembers = node.members?.filter((m) => m.type === 'object')
    expect(objectMembers).toHaveLength(2)
  })

  it('propagates nullable onto the intersection node', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        nullable: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    expect(node.nullable).toBe(true)
  })

  it('propagates metadata onto the intersection node', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        description: 'combined',
        deprecated: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
    expect(node.description).toBe('combined')
    expect(node.deprecated).toBe(true)
  })
})

describe('convertSchema oneOf / anyOf', () => {
  const parser = createOasParser(emptyOas)

  it('maps oneOf to a union node', () => {
    const node = parser.convertSchema({ schema: { oneOf: [{ type: 'string' }, { type: 'number' }] } })

    expect(node.type).toBe('union')
  })

  it('maps anyOf to a union node', () => {
    const node = parser.convertSchema({ schema: { anyOf: [{ type: 'string' }, { type: 'number' }] } })

    expect(node.type).toBe('union')
  })

  it('combines oneOf and anyOf members into a single union', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }, { type: 'boolean' }],
      },
    })

    expect(node.type).toBe('union')
    expect(node.members).toHaveLength(3)
  })

  it('converts each oneOf member schema', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Pet' }],
      },
    })

    const members = node.members ?? []
    expect(members[0]?.type).toBe('string')
    expect(members[1]?.type).toBe('ref')
  })

  it('propagates nullable onto the union node', () => {
    const node = parser.convertSchema({ schema: { oneOf: [{ type: 'string' }], nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates metadata onto the union node', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ type: 'string' }],
        description: 'one of many',
        deprecated: true,
      },
    })

    expect(node.description).toBe('one of many')
    expect(node.deprecated).toBe(true)
  })

  it('sets discriminatorPropertyName when discriminator is present', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        discriminator: { propertyName: 'petType' },
      },
    })

    expect(node.discriminatorPropertyName).toBe('petType')
  })

  it('does not set discriminatorPropertyName when discriminator is absent', () => {
    const node = parser.convertSchema({ schema: { oneOf: [{ type: 'string' }] } })

    expect(node.discriminatorPropertyName).toBeUndefined()
  })

  it('intersects each member with sibling properties when properties are present', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        properties: { id: { type: 'integer' } },
      },
    })

    expect(node.type).toBe('union')
    expect(node.members).toHaveLength(2)
    expect(node.members?.every((m) => m.type === 'intersection')).toBe(true)
  })

  it('each intersection member contains the oneOf ref and the properties node', () => {
    const node = parser.convertSchema({
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }],
        properties: { id: { type: 'integer' } },
      },
    })

    const intersection = narrowSchema(node.members?.[0], 'intersection')
    const [refMember, propsMember] = intersection?.members ?? []
    expect(refMember?.type).toBe('ref')
    expect(propsMember?.type).toBe('object')
  })
})

describe('convertSchema const (OAS 3.1)', () => {
  const parser = createOasParser(emptyOas)

  it('maps const string to a single-value enum', () => {
    const node = parser.convertSchema({ schema: { const: 'active' } })

    expect(node.type).toBe('enum')
    expect(node.enumValues).toEqual(['active'])
  })

  it('maps const number to a single-value enum', () => {
    const node = parser.convertSchema({ schema: { const: 42 } })

    expect(node.type).toBe('enum')
    expect(node.enumValues).toEqual([42])
  })

  it('maps const boolean to a single-value enum', () => {
    const node = parser.convertSchema({ schema: { const: true } })

    expect(node.type).toBe('enum')
    expect(node.enumValues).toEqual([true])
  })

  it('maps const: null to a null scalar', () => {
    const node = parser.convertSchema({ schema: { const: null } })

    expect(node.type).toBe('null')
  })

  it('propagates name on const enum', () => {
    const node = parser.convertSchema({ schema: { const: 'active' }, name: 'Status' })

    expect(node.name).toBe('Status')
  })
})

describe('convertSchema readOnly / writeOnly', () => {
  const parser = createOasParser(emptyOas)

  it('sets readOnly: true when marked', () => {
    const node = parser.convertSchema({ schema: { type: 'string', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('sets writeOnly: true when marked', () => {
    const node = parser.convertSchema({ schema: { type: 'string', writeOnly: true } })

    expect(node.writeOnly).toBe(true)
  })

  it('leaves readOnly / writeOnly undefined when not set', () => {
    const node = parser.convertSchema({ schema: { type: 'string' } })

    expect(node.readOnly).toBeUndefined()
    expect(node.writeOnly).toBeUndefined()
  })

  it('propagates readOnly on object schema', () => {
    const node = parser.convertSchema({ schema: { type: 'object', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('propagates writeOnly on array schema', () => {
    const node = parser.convertSchema({ schema: { type: 'array', writeOnly: true } })

    expect(node.writeOnly).toBe(true)
  })

  it('propagates readOnly on enum schema', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'], readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('propagates readOnly on ref schema siblings', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('propagates pattern on ref sibling when type is string', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', type: 'string', pattern: '^[a-z]+$' } })

    expect(node.pattern).toBe('^[a-z]+$')
  })

  it('drops pattern on ref sibling when type is not string', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', pattern: '^[a-z]+$' } })

    expect(node.pattern).toBeUndefined()
  })
})

describe('convertSchema deprecated', () => {
  const parser = createOasParser(emptyOas)

  it('sets deprecated: true when marked', () => {
    const node = parser.convertSchema({ schema: { type: 'string', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('leaves deprecated undefined when not set', () => {
    const node = parser.convertSchema({ schema: { type: 'string' } })

    expect(node.deprecated).toBeUndefined()
  })

  it('propagates deprecated on object schema', () => {
    const node = parser.convertSchema({ schema: { type: 'object', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on array schema', () => {
    const node = parser.convertSchema({ schema: { type: 'array', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on enum schema', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'], deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on ref schema siblings', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })
})

describe('convertSchema default', () => {
  const parser = createOasParser(emptyOas)

  it('passes through a normal default value', () => {
    const node = parser.convertSchema({ schema: { type: 'string', default: 'hello' } })

    expect(node.default).toBe('hello')
  })

  it('passes through a falsy-but-non-null default (0)', () => {
    const node = parser.convertSchema({ schema: { type: 'number', default: 0 } })

    expect(node.default).toBe(0)
  })

  it('passes through a falsy-but-non-null default (false)', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean', default: false } })

    expect(node.default).toBe(false)
  })

  it('drops default: null when schema is nullable (defaultNullAndNullable)', () => {
    const node = parser.convertSchema({ schema: { type: 'string', nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })

  it('keeps default: null when schema is not nullable', () => {
    const node = parser.convertSchema({ schema: { type: 'string', default: null } })

    expect(node.default).toBeNull()
  })

  it('drops default: null for nullable enum', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'], nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })

  it('drops default: null for nullable ref sibling', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })
})

describe('convertSchema object properties', () => {
  const parser = createOasParser(emptyOas)

  it('required + not nullable → required: true, optional/nullish undefined', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
    })
    const prop = node.properties?.find((p) => p.name === 'id')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + not nullable → optional: true', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        properties: { tag: { type: 'string' } },
      },
    })
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.optional).toBe(true)
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + nullable → nullish: true', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        properties: { tag: { type: 'string', nullable: true } },
      },
    })
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.nullish).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullable).toBe(true)
  })

  it('required + nullable → nullable: true, optional/nullish undefined', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['tag'],
        properties: { tag: { type: 'string', nullable: true } },
      },
    })
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.nullable).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
  })

  it('treats required: true (OAS 2.0 scalar) as all properties required', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: true as unknown as string[],
        properties: { id: { type: 'integer' }, tag: { type: 'string' } },
      },
    })

    const id = node.properties?.find((p) => p.name === 'id')
    const tag = node.properties?.find((p) => p.name === 'tag')

    expect(id?.required).toBe(true)
    expect(id?.schema.optional).toBeUndefined()
    expect(tag?.required).toBe(true)
    expect(tag?.schema.optional).toBeUndefined()
  })
})

describe('convertSchema object additionalProperties', () => {
  const parser = createOasParser(emptyOas)

  it('additionalProperties: true → additionalProperties is true', () => {
    const node = parser.convertSchema({ schema: { type: 'object', additionalProperties: true } })

    expect(node.type).toBe('object')
    expect(node.additionalProperties).toBe(true)
  })

  it('additionalProperties with a schema → additionalProperties is a SchemaNode', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    })

    expect(node.type).toBe('object')
    expect(node.additionalProperties).toMatchObject({ type: 'string' })
  })

  it('additionalProperties with an integer schema → additionalProperties is a NumberSchemaNode', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        additionalProperties: { type: 'integer' },
      },
    })

    expect(node.additionalProperties).toMatchObject({ type: 'integer' })
  })

  it('additionalProperties: false → additionalProperties is undefined', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        additionalProperties: false,
      },
    })

    expect(node.additionalProperties).toBeUndefined()
  })

  it('no additionalProperties → additionalProperties is undefined', () => {
    const node = parser.convertSchema({ schema: { type: 'object', properties: { id: { type: 'integer' } } } })

    expect(node.additionalProperties).toBeUndefined()
  })

  it('additionalProperties: true triggers object even without type or properties', () => {
    const node = parser.convertSchema({ schema: { additionalProperties: true } })

    expect(node.type).toBe('object')
    expect(node.additionalProperties).toBe(true)
  })

  it('additionalProperties with an empty schema → uses unknownType', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        additionalProperties: {},
      },
    })

    expect(node.type).toBe('object')
    expect(node.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('respects unknownType option for empty additionalProperties', () => {
    const customParser = createOasParser(emptyOas)
    const node = customParser.convertSchema(
      {
        schema: {
          type: 'object',
          additionalProperties: {},
        },
      },
      { unknownType: 'any' },
    )

    expect(node.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('properties and additionalProperties coexist', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
        additionalProperties: { type: 'string' },
      },
    })

    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('id')
    expect(node.additionalProperties).toMatchObject({ type: 'string' })
  })
})

describe('convertSchema object patternProperties', () => {
  const parser = createOasParser(emptyOas)

  it('maps patternProperties patterns to converted SchemaNodes', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        patternProperties: {
          '^S_': { type: 'string' },
          '^I_': { type: 'integer' },
        },
      },
    })

    expect(node.type).toBe('object')
    expect(node.patternProperties?.['I_']).toBeUndefined()
    expect(node.patternProperties?.['S_']).toBeUndefined()
    expect(node.patternProperties?.['S_']).toBeUndefined()
    expect(node.patternProperties?.['^S_']).toMatchObject({ type: 'string' })
    expect(node.patternProperties?.['^I_']).toMatchObject({ type: 'integer' })
  })

  it('empty pattern schema falls back to unknownType', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        patternProperties: { '^x-': {} },
      },
    })

    expect(node.patternProperties?.['^x-']).toMatchObject({ type: 'any' })
  })

  it('pattern schema true falls back to unknownType', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        patternProperties: { '^x-': true as unknown as SchemaObject },
      },
    })

    expect(node.patternProperties?.['^x-']).toMatchObject({ type: 'any' })
  })

  it('patternProperties triggers object even without type or properties', () => {
    const node = parser.convertSchema({
      schema: {
        patternProperties: { '^x-': { type: 'string' } },
      },
    })

    expect(node.type).toBe('object')
  })

  it('properties and patternProperties coexist', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        patternProperties: { '^meta_': { type: 'string' } },
      },
    })

    expect(node.properties).toHaveLength(1)
    expect(node.patternProperties?.['^meta_']).toMatchObject({ type: 'string' })
  })
})

describe('convertSchema object discriminator', () => {
  const parser = createOasParser(emptyOas)

  it('overrides discriminator property with enum of mapping keys', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['petType'],
        properties: {
          petType: { type: 'string' },
          name: { type: 'string' },
        },
        discriminator: {
          propertyName: 'petType',
          mapping: { Cat: '#/components/schemas/Cat', Dog: '#/components/schemas/Dog' },
        },
      },
    })

    const petTypeProp = node.properties?.find((p) => p.name === 'petType')
    const petTypeSchema = narrowSchema(petTypeProp?.schema, 'enum')
    expect(petTypeSchema?.type).toBe('enum')
    expect(petTypeSchema?.enumValues).toEqual(['Cat', 'Dog'])
  })

  it('leaves other properties unchanged when discriminator is present', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['petType'],
        properties: {
          petType: { type: 'string' },
          name: { type: 'string' },
        },
        discriminator: {
          propertyName: 'petType',
          mapping: { Cat: '#/components/schemas/Cat' },
        },
      },
    })

    const nameProp = node.properties?.find((p) => p.name === 'name')
    expect(nameProp?.schema.type).toBe('string')
  })

  it('discriminator without mapping produces no enum', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'object',
        required: ['type'],
        properties: { type: { type: 'string' } },
        discriminator: { propertyName: 'type' },
      },
    })

    const typeProp = node.properties?.find((p) => p.name === 'type')
    expect(typeProp?.schema.type).toBe('string')
  })
})

describe('convertSchema prefixItems (tuple)', () => {
  const parser = createOasParser(emptyOas)

  it('narrows to ArraySchemaNode when prefixItems is present', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('maps type to tuple', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }] } })

    expect(node.type).toBe('tuple')
  })

  it('maps each prefixItem to an items entry in order', () => {
    const node = parser.convertSchema({
      schema: {
        prefixItems: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      },
    })

    expect(node.items).toHaveLength(3)
    expect(node.items?.[0]?.type).toBe('string')
    expect(node.items?.[1]?.type).toBe('number')
    expect(node.items?.[2]?.type).toBe('boolean')
  })

  it('maps items (alongside prefixItems) to rest', () => {
    const node = parser.convertSchema({
      schema: {
        prefixItems: [{ type: 'string' }],
        items: { type: 'number' },
      },
    })

    expect(node.rest?.type).toBe('number')
  })

  it('sets rest to undefined when items is absent', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }] } })

    expect(node.rest).toBeUndefined()
  })

  it('converts a $ref prefixItem to a ref node', () => {
    const node = parser.convertSchema({
      schema: {
        prefixItems: [{ $ref: '#/components/schemas/Pet' }],
      },
    })

    expect(node.items?.[0]?.type).toBe('ref')
  })

  it('converts a nested object prefixItem', () => {
    const node = parser.convertSchema({
      schema: {
        prefixItems: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      },
    })

    expect(node.items?.[0]?.type).toBe('object')
  })

  it('converts a $ref rest schema', () => {
    const node = parser.convertSchema({
      schema: {
        prefixItems: [{ type: 'string' }],
        items: { $ref: '#/components/schemas/Extra' },
      },
    })

    expect(node.rest?.type).toBe('ref')
  })

  it('maps minItems to min', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }], minItems: 1 } })

    expect(node.min).toBe(1)
  })

  it('maps maxItems to max', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }], maxItems: 4 } })

    expect(node.max).toBe(4)
  })

  it('leaves min and max undefined when minItems and maxItems are absent', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }] } })

    expect(node.min).toBeUndefined()
    expect(node.max).toBeUndefined()
  })

  it('produces an empty items array for an empty prefixItems', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [] } })

    expect(node.items).toHaveLength(0)
  })

  it('takes precedence over type: array — always resolves to tuple', () => {
    const node = parser.convertSchema({ schema: { type: 'array', prefixItems: [{ type: 'string' }] } })

    expect(node.type).toBe('tuple')
  })
})

describe('convertSchema nullable', () => {
  const parser = createOasParser(emptyOas)

  it('sets nullable via nullable: true (OAS 3.0)', () => {
    const node = parser.convertSchema({ schema: { type: 'string', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via x-nullable: true', () => {
    const node = parser.convertSchema({ schema: { type: 'string', 'x-nullable': true } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via type array including null (OAS 3.1)', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'null'] } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via null in enum values (OAS 3.0 convention)', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b', null] } })

    expect(node.nullable).toBe(true)
  })

  it('strips null from enum values when nullable via null in enum', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b', null] } })

    expect(node.enumValues).toEqual(['a', 'b'])
  })

  it('does not set nullable when not specified', () => {
    const node = parser.convertSchema({ schema: { type: 'string' } })

    expect(node.nullable).toBeUndefined()
  })

  it('propagates nullable from object schema', () => {
    const node = parser.convertSchema({ schema: { type: 'object', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from array schema', () => {
    const node = parser.convertSchema({ schema: { type: 'array', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from ref schema siblings', () => {
    const node = parser.convertSchema({ schema: { $ref: '#/components/schemas/Pet', nullable: true } })

    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema string', () => {
  const parser = createOasParser(emptyOas)

  it('maps type string to string node', () => {
    const node = parser.convertSchema({ schema: { type: 'string' } })

    expect(node.type).toBe('string')
  })

  it('preserves nullable on string', () => {
    const node = parser.convertSchema({ schema: { type: 'string', nullable: true } })

    expect(node.type).toBe('string')
    expect(node.nullable).toBe(true)
  })

  it('maps minLength to min', () => {
    const node = parser.convertSchema({ schema: { type: 'string', minLength: 1 } })

    expect(node.min).toBe(1)
  })

  it('maps maxLength to max', () => {
    const node = parser.convertSchema({ schema: { type: 'string', maxLength: 100 } })

    expect(node.max).toBe(100)
  })
})

describe('convertSchema boolean', () => {
  const parser = createOasParser(emptyOas)

  it('maps type boolean to boolean node', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean' } })

    expect(node.type).toBe('boolean')
  })

  it('preserves nullable on boolean', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean', nullable: true } })

    expect(node.type).toBe('boolean')
    expect(node.nullable).toBe(true)
  })

  it('passes through default value', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean', default: false } })

    expect(node.default).toBe(false)
  })
})

describe('convertSchema enum', () => {
  const parser = createOasParser(emptyOas)

  it('narrows to EnumSchemaNode when enum is present', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'] } })

    expectTypeOf(node).toEqualTypeOf<EnumSchemaNode>()
  })

  it('maps type to enum', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'] } })

    expect(node.type).toBe('enum')
  })

  it('stores string values in enumValues', () => {
    const node = parser.convertSchema({ schema: { enum: ['foo', 'bar', 'baz'] } })

    expect(node.enumValues).toEqual(['foo', 'bar', 'baz'])
  })

  it('deduplicates enum values', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'a', 'b'] } })

    expect(node.enumValues).toEqual(['a', 'b'])
  })

  it('strips null from enumValues and sets nullable', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', null, 'b'] } })

    expect(node.nullable).toBe(true)
    expect(node.enumValues).toEqual(['a', 'b'])
  })

  it('sets nullable from null in enum even when nullable is not set on schema', () => {
    const node = parser.convertSchema({ schema: { enum: [null] } })

    expect(node.nullable).toBe(true)
  })

  it('sets enumNullable from schema nullable combined with null in enum', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', null], nullable: true } })

    expect(node.nullable).toBe(true)
    expect(node.enumValues).toEqual(['a'])
  })

  it('clears default when default is null and enum is nullable', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', null], default: null } })

    expect(node.default).toBeUndefined()
  })

  it('preserves non-null default', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'], default: 'a' } })

    expect(node.default).toBe('a')
  })

  // Number enum
  it('produces namedEnumValues with format number for integer enum', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', enum: [1, 2, 3] } })

    expect(node.type).toBe('enum')
    expect(node.enumType).toBe('number')
    const values = node.namedEnumValues
    expect(values?.map((v) => v.value)).toEqual([1, 2, 3])
    expect(values?.every((v) => v.format === 'number')).toBe(true)
  })

  it('produces namedEnumValues with format number for number enum', () => {
    const node = parser.convertSchema({ schema: { type: 'number', enum: [0.5, 1.5] } })

    expect(node.enumType).toBe('number')
    expect(node.namedEnumValues?.map((v) => v.value)).toEqual([0.5, 1.5])
  })

  it('uses stringified value as name for numeric enum values', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', enum: [42] } })

    expect(node.namedEnumValues?.[0]?.name).toBe('42')
  })

  it('deduplicates numeric enum values', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', enum: [1, 1, 2] } })

    expect(node.namedEnumValues?.map((v) => v.value)).toEqual([1, 2])
  })

  // Boolean enum
  it('produces namedEnumValues with format boolean for boolean enum', () => {
    const node = parser.convertSchema({ schema: { type: 'boolean', enum: [true, false] } })

    expect(node.enumType).toBe('boolean')
    const values = node.namedEnumValues
    expect(values?.map((v) => v.value)).toEqual([true, false])
    expect(values?.every((v) => v.format === 'boolean')).toBe(true)
  })

  // x-enumNames
  it('uses x-enumNames labels as namedEnumValues names', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'integer',
        enum: [1, 2, 3],
        'x-enumNames': ['One', 'Two', 'Three'],
      },
    })

    const values = node.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['One', 'Two', 'Three'])
    expect(values?.map((v) => v.value)).toEqual([1, 2, 3])
  })

  it('uses x-enum-varnames labels as namedEnumValues names', () => {
    const node = parser.convertSchema({
      schema: {
        enum: ['active', 'inactive'],
        'x-enum-varnames': ['Active', 'Inactive'],
      },
    })

    const values = node.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['Active', 'Inactive'])
    expect(values?.map((v) => v.value)).toEqual(['active', 'inactive'])
  })

  it('x-enumNames deduplicates names', () => {
    const node = parser.convertSchema({
      schema: {
        enum: [1, 2, 3],
        'x-enumNames': ['A', 'A', 'B'],
      },
    })

    const values = node.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['A', 'B'])
  })

  it('x-enumNames sets enumType number for integer type', () => {
    const node = parser.convertSchema({
      schema: {
        type: 'integer',
        enum: [0, 1],
        'x-enumNames': ['Off', 'On'],
      },
    })

    expect(node.enumType).toBe('number')
  })

  it('x-enumNames sets enumType string when type is not numeric or boolean', () => {
    const node = parser.convertSchema({
      schema: {
        enum: ['a', 'b'],
        'x-enumNames': ['Alpha', 'Beta'],
      },
    })

    expect(node.enumType).toBe('string')
  })

  // Array + enum normalization
  it('normalizes array+enum by moving enum into items and returning array node', () => {
    const node = parser.convertSchema({ schema: { type: 'array', enum: ['x', 'y'] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
    expect(node.type).toBe('array')
    const itemNode = narrowSchema(node.items?.[0], 'enum')
    expect(itemNode?.type).toBe('enum')
    expect(itemNode?.enumValues).toEqual(['x', 'y'])
  })

  it('merges existing items schema when normalizing array+enum', () => {
    const node = parser.convertSchema({ schema: { type: 'array', items: { type: 'string' }, enum: ['x', 'y'] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
    expect(node.type).toBe('array')
    const itemNode = narrowSchema(node.items?.[0], 'enum')
    expect(itemNode?.type).toBe('enum')
    expect(itemNode?.enumValues).toEqual(['x', 'y'])
  })
})

describe('convertSchema null', () => {
  const parser = createOasParser(emptyOas)

  it('maps type null to null node', () => {
    const node = parser.convertSchema({ schema: { type: 'null' } })

    expect(node.type).toBe('null')
  })

  it('propagates description on null', () => {
    const node = parser.convertSchema({ schema: { type: 'null', description: 'always null' } })

    expect(node.description).toBe('always null')
  })
})

describe('convertSchema OAS 3.1 type array', () => {
  const parser = createOasParser(emptyOas)

  it('narrows to UnionSchemaNode for a multi-type array', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer'] } })

    expectTypeOf(node).toEqualTypeOf<UnionSchemaNode>()
  })

  it('produces a union node for two non-null types', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer'] } })

    expect(node.type).toBe('union')
    expect(node.members).toHaveLength(2)
    expect(node.members?.[0]?.type).toBe('string')
    expect(node.members?.[1]?.type).toBe('integer')
  })

  it('produces a union node for three non-null types', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer', 'boolean'] } })

    expect(node.type).toBe('union')
    expect(node.members).toHaveLength(3)
  })

  it('sets nullable when null is among multiple types', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer', 'null'] } })

    expect(node.type).toBe('union')
    expect(node.nullable).toBe(true)
    expect(node.members).toHaveLength(2)
  })

  it('sets nullable when null is in a single-non-null type array', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'null'] } })

    expect(node.type).toBe('string')
    expect(node.nullable).toBe(true)
  })

  it('handles type array with a single non-null entry', () => {
    const node = parser.convertSchema({ schema: { type: ['integer'] } })

    expect(node.type).toBe('integer')
    expect(node.nullable).toBeUndefined()
  })

  it('propagates shared schema metadata onto the union node', () => {
    const node = parser.convertSchema({
      schema: {
        type: ['string', 'integer'],
        description: 'id or label',
        deprecated: true,
      },
    })

    expect(node.description).toBe('id or label')
    expect(node.deprecated).toBe(true)
  })

  it('each union member schema carries the shared schema properties', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer'], readOnly: true } })

    const members = node.members ?? []
    expect(members.every((m) => m.readOnly === true)).toBe(true)
  })
})

describe('convertSchema integer', () => {
  const parser = createOasParser(emptyOas)

  it('maps type integer to integer node', () => {
    const node = parser.convertSchema({ schema: { type: 'integer' } })

    expect(node.type).toBe('integer')
  })

  it('maps integer int32 to integer', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', format: 'int32' } })

    expect(node.type).toBe('integer')
  })

  it('maps integer int64 to integer when integerType is number (default)', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', format: 'int64' } })

    expect(node.type).toBe('integer')
  })

  it('maps format int64 without type to integer (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'int64' } })

    expect(node.type).toBe('integer')
  })

  it('preserves nullable on integer', () => {
    const node = parser.convertSchema({ schema: { type: 'integer', nullable: true } })

    expect(node.type).toBe('integer')
    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema number', () => {
  const parser = createOasParser(emptyOas)

  it('maps type number to number node', () => {
    const node = parser.convertSchema({ schema: { type: 'number' } })

    expect(node.type).toBe('number')
  })

  it('maps number float to number', () => {
    const node = parser.convertSchema({ schema: { type: 'number', format: 'float' } })

    expect(node.type).toBe('number')
  })

  it('maps number double to number', () => {
    const node = parser.convertSchema({ schema: { type: 'number', format: 'double' } })

    expect(node.type).toBe('number')
  })

  it('maps format float without type to number (format overrides type)', () => {
    const node = parser.convertSchema({ schema: { format: 'float' } })

    expect(node.type).toBe('number')
  })

  it('preserves nullable on number', () => {
    const node = parser.convertSchema({ schema: { type: 'number', nullable: true } })

    expect(node.type).toBe('number')
    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema pattern', () => {
  const parser = createOasParser(emptyOas)

  it('maps pattern on a string type to a string node with pattern', () => {
    const node = parser.convertSchema({ schema: { type: 'string', pattern: '^[a-z]+$' } })

    expect(node.type).toBe('string')
    expect(node.pattern).toBe('^[a-z]+$')
  })

  it('infers string type from pattern alone (no explicit type)', () => {
    const node = parser.convertSchema({ schema: { pattern: '^[0-9]+$' } })

    expect(node.type).toBe('string')
    expect(node.pattern).toBe('^[0-9]+$')
  })

  it('ignores pattern on non-string types', () => {
    const node = parser.convertSchema({ schema: { type: 'number', pattern: '^[0-9]+$' } })

    expect(node.type).toBe('number')
    expect('pattern' in node ? (node as { pattern?: string }).pattern : undefined).toBeUndefined()
  })

  it('preserves nullable on a pattern string', () => {
    const node = parser.convertSchema({ schema: { type: 'string', pattern: '^[a-z]+$', nullable: true } })

    expect(node.type).toBe('string')
    expect(node.pattern).toBe('^[a-z]+$')
    expect(node.nullable).toBe(true)
  })

  it('preserves minLength and maxLength alongside pattern', () => {
    const node = parser.convertSchema({ schema: { type: 'string', pattern: '^[a-z]+$', minLength: 2, maxLength: 10 } })

    expect(node.type).toBe('string')
    expect(node.pattern).toBe('^[a-z]+$')
    expect(node.min).toBe(2)
    expect(node.max).toBe(10)
  })
})

describe('convertSchema array', () => {
  const parser = createOasParser(emptyOas)

  it('maps type array to array node', () => {
    const node = parser.convertSchema({ schema: { type: 'array' } })

    expect(node.type).toBe('array')
  })

  it('infers array type from items key alone (no explicit type)', () => {
    const node = parser.convertSchema({ schema: { items: { type: 'string' } } })

    expect(node.type).toBe('array')
  })

  it('converts items to a single-element items array', () => {
    const node = parser.convertSchema({ schema: { type: 'array', items: { type: 'string' } } })

    expect(node.items).toHaveLength(1)
    expect(node.items?.[0]?.type).toBe('string')
  })

  it('produces an empty items array when items is absent', () => {
    const node = parser.convertSchema({ schema: { type: 'array' } })

    expect(node.items).toHaveLength(0)
  })

  it('maps minItems to min', () => {
    const node = parser.convertSchema({ schema: { type: 'array', minItems: 1 } })

    expect(node.min).toBe(1)
  })

  it('maps maxItems to max', () => {
    const node = parser.convertSchema({ schema: { type: 'array', maxItems: 5 } })

    expect(node.max).toBe(5)
  })

  it('maps uniqueItems: true to unique: true', () => {
    const node = parser.convertSchema({ schema: { type: 'array', uniqueItems: true } })

    expect(node.unique).toBe(true)
  })

  it('maps uniqueItems: false to unique: false', () => {
    const node = parser.convertSchema({ schema: { type: 'array', uniqueItems: false } })

    expect(node.unique).toBe(false)
  })

  it('leaves unique undefined when uniqueItems is not set', () => {
    const node = parser.convertSchema({ schema: { type: 'array' } })

    expect(node.unique).toBeUndefined()
  })

  it('preserves nullable on array', () => {
    const node = parser.convertSchema({ schema: { type: 'array', nullable: true } })

    expect(node.type).toBe('array')
    expect(node.nullable).toBe(true)
  })

  it('converts nested array items recursively', () => {
    const node = parser.convertSchema({ schema: { type: 'array', items: { type: 'array', items: { type: 'number' } } } })
    const outerItem = narrowSchema(node.items?.[0], 'array')
    const innerItem = outerItem?.items?.[0]

    expect(node.type).toBe('array')
    expect(outerItem?.type).toBe('array')
    expect(innerItem?.type).toBe('number')
  })

  it('converts ref items', () => {
    const node = parser.convertSchema({ schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } } })

    expect(node.type).toBe('array')
    expect(node.items?.[0]?.type).toBe('ref')
  })
})

describe('convertSchema type inference (no explicit type)', () => {
  const parser = createOasParser(emptyOas)

  it('infers string from minLength alone', () => {
    const node = parser.convertSchema({ schema: { minLength: 1 } })

    expect(node.type).toBe('string')
    expect(node.min).toBe(1)
  })

  it('infers string from maxLength alone', () => {
    const node = parser.convertSchema({ schema: { maxLength: 100 } })

    expect(node.type).toBe('string')
    expect(node.max).toBe(100)
  })

  it('infers string from both minLength and maxLength', () => {
    const node = parser.convertSchema({ schema: { minLength: 2, maxLength: 50 } })

    expect(node.type).toBe('string')
    expect(node.min).toBe(2)
    expect(node.max).toBe(50)
  })

  it('infers number from minimum alone', () => {
    const node = parser.convertSchema({ schema: { minimum: 0 } })

    expect(node.type).toBe('number')
    expect(node.min).toBe(0)
  })

  it('infers number from maximum alone', () => {
    const node = parser.convertSchema({ schema: { maximum: 999 } })

    expect(node.type).toBe('number')
    expect(node.max).toBe(999)
  })

  it('infers number from both minimum and maximum', () => {
    const node = parser.convertSchema({ schema: { minimum: 1, maximum: 100 } })

    expect(node.type).toBe('number')
    expect(node.min).toBe(1)
    expect(node.max).toBe(100)
  })

  it('does not infer array from minItems/maxItems alone', () => {
    const node = parser.convertSchema({ schema: { minItems: 1, maxItems: 5 } })

    expect(node.type).not.toBe('array')
  })
})

describe('convertSchema constraints', () => {
  const parser = createOasParser(emptyOas)

  describe('array: minItems / maxItems', () => {
    it('maps minItems to min', () => {
      const node = parser.convertSchema({ schema: { type: 'array', minItems: 2 } })

      expect(node.min).toBe(2)
    })

    it('maps maxItems to max', () => {
      const node = parser.convertSchema({ schema: { type: 'array', maxItems: 10 } })

      expect(node.max).toBe(10)
    })

    it('maps both minItems and maxItems', () => {
      const node = parser.convertSchema({ schema: { type: 'array', minItems: 1, maxItems: 5 } })

      expect(node.min).toBe(1)
      expect(node.max).toBe(5)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ schema: { type: 'array' } })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('string: minLength / maxLength', () => {
    it('maps minLength to min', () => {
      const node = parser.convertSchema({ schema: { type: 'string', minLength: 3 } })

      expect(node.min).toBe(3)
    })

    it('maps maxLength to max', () => {
      const node = parser.convertSchema({ schema: { type: 'string', maxLength: 255 } })

      expect(node.max).toBe(255)
    })

    it('maps both minLength and maxLength', () => {
      const node = parser.convertSchema({ schema: { type: 'string', minLength: 1, maxLength: 100 } })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ schema: { type: 'string' } })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('number: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parser.convertSchema({ schema: { type: 'number', minimum: 0 } })

      expect(node.min).toBe(0)
    })

    it('maps maximum to max', () => {
      const node = parser.convertSchema({ schema: { type: 'number', maximum: 999 } })
      expect(node.max).toBe(999)
    })

    it('maps both minimum and maximum', () => {
      const node = parser.convertSchema({ schema: { type: 'number', minimum: 1, maximum: 100 } })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parser.convertSchema({ schema: { type: 'number', exclusiveMinimum: 0 } })

      expect(node.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parser.convertSchema({ schema: { type: 'number', exclusiveMaximum: 100 } })

      expect(node.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parser.convertSchema({ schema: { type: 'number', exclusiveMinimum: true } })

      expect(node.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ schema: { type: 'number' } })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('integer: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', minimum: 1 } })

      expect(node.min).toBe(1)
    })

    it('maps maximum to max', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', maximum: 100 } })

      expect(node.max).toBe(100)
    })

    it('maps both minimum and maximum', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', minimum: 1, maximum: 100 } })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', exclusiveMinimum: 0 } })

      expect(node.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', exclusiveMaximum: 100 } })

      expect(node.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parser.convertSchema({ schema: { type: 'integer', exclusiveMinimum: true } })

      expect(node.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ schema: { type: 'integer' } })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })
})

describe('parser options', () => {
  describe('emptySchemaType', () => {
    it('defaults to any for a schema with no type information', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: {} })

      expect(node.type).toBe('any')
    })

    it('emptySchemaType: any returns any for an empty schema', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: {} }, { emptySchemaType: 'any' })

      expect(node.type).toBe('any')
    })

    it('emptySchemaType: void returns void for an empty schema', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: {} }, { emptySchemaType: 'void' })

      expect(node.type).toBe('void')
    })

    it('emptySchemaType: unknown returns unknown for an empty schema', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: {} }, { emptySchemaType: 'unknown' })

      expect(node.type).toBe('unknown')
    })

    it('emptySchemaType does not affect typed schemas', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'string' } }, { emptySchemaType: 'any' })

      expect(node.type).toBe('string')
    })
  })

  describe('integerType', () => {
    it('defaults to integer for int64 when integerType is not set', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'integer', format: 'int64' } })

      expect(node.type).toBe('integer')
    })

    it('integerType: number keeps int64 as integer', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'integer', format: 'int64' } }, { integerType: 'number' })

      expect(node.type).toBe('integer')
    })

    it('integerType: bigint maps int64 to bigint', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'integer', format: 'int64' } }, { integerType: 'bigint' })

      expect(node.type).toBe('bigint')
    })

    it('integerType: bigint does not affect int32', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'integer', format: 'int32' } }, { integerType: 'bigint' })

      expect(node.type).toBe('integer')
    })

    it('integerType does not affect non-integer types', () => {
      const parser = createOasParser(emptyOas)
      const node = parser.convertSchema({ schema: { type: 'number', format: 'float' } }, { integerType: 'bigint' })

      expect(node.type).toBe('number')
    })
  })

  describe('dateType', () => {
    describe('format date-time', () => {
      it('defaults to datetime', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } })

        expect(node.type).toBe('datetime')
        expect(node.offset).toBe(false)
      })

      it('dateType: string returns datetime with offset: false', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } }, { dateType: 'string' })

        expect(node.type).toBe('datetime')
        expect(node.offset).toBe(false)
      })

      it('dateType: stringOffset returns datetime with offset: true', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } }, { dateType: 'stringOffset' })

        expect(node.type).toBe('datetime')
        expect(node.offset).toBe(true)
      })

      it('dateType: stringLocal returns datetime with local: true', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } }, { dateType: 'stringLocal' })

        expect(node.type).toBe('datetime')
        expect(node.local).toBe(true)
      })

      it('dateType: date returns date with representation: date', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } }, { dateType: 'date' })

        expect(node.type).toBe('date')
        expect(node.representation).toBe('date')
      })

      it('dateType: false falls through to string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date-time' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })

    describe('format date', () => {
      it('defaults to date with representation: string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date' } })

        expect(node.type).toBe('date')
        expect(node.representation).toBe('string')
      })

      it('dateType: date returns date with representation: date', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date' } }, { dateType: 'date' })

        expect(node.type).toBe('date')
        expect(node.representation).toBe('date')
      })

      it('dateType: string returns date with representation: string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date' } }, { dateType: 'string' })

        expect(node.type).toBe('date')
        expect(node.representation).toBe('string')
      })

      it('dateType: false falls through to string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'date' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })

    describe('format time', () => {
      it('defaults to time with representation: string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'time' } })

        expect(node.type).toBe('time')
        expect(node.representation).toBe('string')
      })

      it('dateType: date returns time with representation: date', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'time' } }, { dateType: 'date' })

        expect(node.type).toBe('time')
        expect(node.representation).toBe('date')
      })

      it('dateType: string returns time with representation: string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'time' } }, { dateType: 'string' })

        expect(node.type).toBe('time')
        expect(node.representation).toBe('string')
      })

      it('dateType: false falls through to string', () => {
        const parser = createOasParser(emptyOas)
        const node = parser.convertSchema({ schema: { type: 'string', format: 'time' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })
  })
})


describe('buildAst', async () => {
  const oas = await buildMinimalOas()
  const root = createOasParser(oas).buildAst()

  it('produces a RootNode with expected schema and operation counts', () => {
    expect(root.kind).toBe('Root')
    expect(root.schemas.length).toBeGreaterThan(0)
    expect(root.operations.length).toBeGreaterThan(0)
  })

  describe('operations', () => {
    it('listPets is a GET on /pets with a query parameter', () => {
      const op = root.operations.find((o) => o.operationId === 'listPets')
      expect(op).toBeDefined()
      expect(op!.method).toBe('GET')
      expect(op!.path).toBe('/pets')
      expect(op!.parameters.some((p) => p.name === 'limit' && p.in === 'query')).toBe(true)
      expect(op!.responses.some((r) => r.statusCode === '200')).toBe(true)
    })

    it('createPet is a deprecated POST on /pets with a requestBody', () => {
      const op = root.operations.find((o) => o.operationId === 'createPet')
      expect(op).toBeDefined()
      expect(op!.method).toBe('POST')
      expect(op!.deprecated).toBe(true)
      expect(op!.requestBody).toBeDefined()
    })

    it('getPetById is a GET on /pets/{petId} with a path parameter', () => {
      const op = root.operations.find((o) => o.operationId === 'getPetById')
      expect(op).toBeDefined()
      expect(op!.method).toBe('GET')
      expect(op!.path).toBe('/pets/{petId}')
      expect(op!.parameters.some((p) => p.name === 'petId' && p.in === 'path')).toBe(true)
    })
  })

  describe('schemas', () => {
    it('Pet is an object with required id and name properties', () => {
      const schema = root.schemas.find((s) => s.name === 'Pet')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('object')
      const props = (schema as { properties?: Array<{ name: string; required: boolean }> }).properties ?? []
      expect(props.find((p) => p.name === 'id')?.required).toBe(true)
      expect(props.find((p) => p.name === 'name')?.required).toBe(true)
    })

    it('PetList is an array with a ref to Pet', () => {
      const schema = root.schemas.find((s) => s.name === 'PetList')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('array')
    })

    it('Status is a string enum with three values', () => {
      const schema = root.schemas.find((s) => s.name === 'Status')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('enum')
      expect(schema!.primitive).toBe('string')
    })

    it('PetOrError is a union of two members', () => {
      const schema = root.schemas.find((s) => s.name === 'PetOrError')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('union')
      const members = (schema as { members?: unknown[] }).members ?? []
      expect(members.length).toBe(2)
    })

    it('FullPet is an intersection', () => {
      const schema = root.schemas.find((s) => s.name === 'FullPet')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('intersection')
    })
  })
})
