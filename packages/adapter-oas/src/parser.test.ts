import { narrowSchema, syncSchemaRef } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { buildMinimalOas } from '../mocks/oas.ts'
import { parseDocument } from './factory.ts'
import { parseOas, parseSchema } from './parser.ts'
import type { Document, SchemaObject } from './types.ts'

const emptyDocument: Document = { openapi: '3.0.0', info: { title: '', version: '' }, paths: {} } as Document

describe('buildAst', () => {
  it('returns a RootNode', async () => {
    const oas = await buildMinimalOas()
    const root = parseOas(oas).root

    expect(root.kind).toBe('Root')
  })

  describe('schemas', () => {
    it('converts named component schemas', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const names = root.schemas.map((s) => s.name)

      expect(names).toContain('Pet')
      expect(names).toContain('NewPet')
      expect(names).toContain('Error')
    })

    it('converts object schema with properties', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const pet = narrowSchema(
        root.schemas.find((s) => s.name === 'Pet'),
        'object',
      )

      expect(pet?.type).toBe('object')
      expect(pet?.properties?.map((p) => p.name)).toEqual(expect.arrayContaining(['id', 'name', 'tag']))
    })

    it('marks required properties', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
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
      const root = parseOas(oas).root
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
      const root = parseOas(oas).root
      const status = narrowSchema(
        root.schemas.find((s) => s.name === 'Status'),
        'enum',
      )

      expect(status?.type).toBe('enum')
      expect(status?.enumValues).toEqual(['active', 'inactive', 'pending'])
    })

    it('converts oneOf to union', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const petOrError = narrowSchema(
        root.schemas.find((s) => s.name === 'PetOrError'),
        'union',
      )

      expect(petOrError?.type).toBe('union')
      expect(petOrError?.members).toHaveLength(2)
    })

    it('converts allOf to intersection', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const fullPet = narrowSchema(
        root.schemas.find((s) => s.name === 'FullPet'),
        'intersection',
      )

      expect(fullPet?.type).toBe('intersection')
      expect(fullPet?.members).toHaveLength(2)
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const nullableString = root.schemas.find((s) => s.name === 'NullableString')

      // Should be flattened to 'string' — not an intersection
      expect(nullableString?.type).toBe('string')
      expect(nullableString?.nullable).toBe(true)
      expect(nullableString?.readOnly).toBe(true)
      expect(nullableString?.example).toBe('some-value')
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const nullableRef = narrowSchema(
        root.schemas.find((s) => s.name === 'NullableRef'),
        'ref',
      )

      // Should be flattened to a ref — not an intersection
      expect(nullableRef?.type).toBe('ref')
      expect(nullableRef?.ref).toBe('#/components/schemas/Pet')
      // nullable from the allOf member sibling is propagated to the ref node via buildSchemaNode.
      expect(nullableRef?.nullable).toBe(true)
    })

    it('maps format date-time to datetime SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
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
      const root = parseOas(oas).root
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
      const root = parseOas(oas).root

      expect(root.operations).toHaveLength(4)
    })

    it('sets operationId, method, path, tags', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const listPets = root.operations.find((op) => op.operationId === 'listPets')

      expect(listPets?.method).toBe('GET')
      expect(listPets?.path).toBe('/pets')
      expect(listPets?.tags).toContain('pets')
      expect(listPets?.summary).toBe('List all pets')
    })

    it('sets deprecated flag', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.deprecated).toBe(true)
    })

    it('uses uppercase HTTP method per RFC 9110', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      for (const op of root.operations) {
        expect(op.method).toBe(op.method.toUpperCase())
      }
    })

    it('converts query parameters', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const limit = listPets?.parameters.find((p) => p.name === 'limit')

      expect(limit?.in).toBe('query')
      expect(limit?.required).toBe(false)
      expect(limit?.schema.type).toBe('integer')
    })

    it('converts path parameters', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const petId = getPet?.parameters.find((p) => p.name === 'petId')

      expect(petId?.in).toBe('path')
      expect(petId?.required).toBe(true)
      expect(petId?.schema.type).toBe('integer')
    })

    it('converts path parameters with $ref schema to a named ref type', async () => {
      const oas = await parseDocument({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          schemas: {
            PetId: { type: 'integer', description: 'Unique identifier of a pet' },
          },
        },
        paths: {
          '/pets/{petId}': {
            get: {
              operationId: 'getPetById',
              parameters: [
                {
                  name: 'petId',
                  in: 'path',
                  required: true,
                  schema: { $ref: '#/components/schemas/PetId' },
                },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      })
      const root = parseOas(oas).root
      const op = root.operations.find((o) => o.operationId === 'getPetById')
      const petId = op?.parameters.find((p) => p.name === 'petId')

      expect(petId?.schema.type).toBe('ref')
      expect((petId?.schema as { name?: string }).name).toBe('PetId')
    })

    it('converts requestBody', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.requestBody).toBeDefined()
      expect(createPet?.requestBody?.schema?.type).toBe('ref')
    })

    it('captures requestBody description', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.requestBody?.description).toBe('New pet to create')
    })

    it('sets requestBody.required to true when spec has required: true', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.requestBody?.required).toBe(true)
      expect(createPet?.requestBody?.schema?.optional).toBeFalsy()
    })

    it('leaves requestBody.required undefined when spec omits required', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const patchPet = root.operations.find((op) => op.operationId === 'patchPet')

      expect(patchPet?.requestBody).toBeDefined()
      expect(patchPet?.requestBody?.required).toBeUndefined()
      expect(patchPet?.requestBody?.schema?.optional).toBe(true)
    })

    it('converts responses with statusCode and schema', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.description).toBe('A list of pets')
      expect(ok?.schema?.type).toBe('ref')
    })

    it('converts responses without a body schema', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const notFound = getPet?.responses.find((r) => r.statusCode === '404')

      expect(notFound?.description).toBe('Not found')
    })

    it('sets mediaType on responses', async () => {
      const oas = await buildMinimalOas()
      const root = parseOas(oas).root
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.mediaType).toBe('application/json')
    })
  })
})

describe('parseSchema uuid', () => {
  const ctx = { document: emptyDocument }

  it('maps format uuid to uuid', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'uuid' } })

    expect(node.type).toBe('uuid')
  })

  it('maps format uuid without type to uuid (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'uuid' } })

    expect(node.type).toBe('uuid')
  })

  it('preserves nullable on uuid', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'uuid', nullable: true } })

    expect(node.type).toBe('uuid')
    expect(node.nullable).toBe(true)
  })

  it('preserves description on uuid', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'uuid', description: 'A unique identifier' } })

    expect(node.type).toBe('uuid')
    expect(node.description).toBe('A unique identifier')
  })
})

describe('parseSchema email', () => {
  const ctx = { document: emptyDocument }

  it('maps format email to email', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'email' } })

    expect(node.type).toBe('email')
  })

  it('maps format idn-email to email', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'idn-email' } })

    expect(node.type).toBe('email')
  })

  it('maps format email without type to email (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'email' } })

    expect(node.type).toBe('email')
  })

  it('preserves nullable on email', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'email', nullable: true } })

    expect(node.type).toBe('email')
    expect(node.nullable).toBe(true)
  })
})

describe('parseSchema url', () => {
  const ctx = { document: emptyDocument }

  it.each(['uri', 'uri-reference', 'url', 'ipv4', 'ipv6', 'hostname', 'idn-hostname'])('maps format %s to url', (format) => {
    const node = parseSchema(ctx, { schema: { type: 'string', format } })

    expect(node.type).toBe('url')
  })

  it('maps format uri without type to url (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'uri' } })

    expect(node.type).toBe('url')
  })

  it('preserves nullable on url', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'uri', nullable: true } })

    expect(node.type).toBe('url')
    expect(node.nullable).toBe(true)
  })
})

describe('parseSchema binary', () => {
  const ctx = { document: emptyDocument }

  it('maps string with format binary to blob', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'binary' } })

    expect(node.type).toBe('blob')
  })

  it('maps string with format byte to blob', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', format: 'byte' } })

    expect(node.type).toBe('blob')
  })

  it('maps format binary without type to blob (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'binary' } })

    expect(node.type).toBe('blob')
  })
})

describe('parseSchema contentMediaType (OAS 3.1)', () => {
  const ctx = { document: emptyDocument }

  it('maps string with contentMediaType application/octet-stream to blob', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', contentMediaType: 'application/octet-stream' } })

    expect(node.type).toBe('blob')
  })

  it('leaves string with other contentMediaType as string', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', contentMediaType: 'text/plain' } })

    expect(node.type).toBe('string')
  })
})

describe('parseSchema allOf', () => {
  const ctx = { document: emptyDocument }

  it('flattens single-member allOf to the member type', () => {
    const node = parseSchema(ctx, { schema: { allOf: [{ type: 'string' }] } as const })

    expect(node.type).toBe('string')
  })

  it('merges outer metadata onto a flattened single-member allOf', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ type: 'string' }],
        description: 'wrapped',
        deprecated: true,
        nullable: true,
      } as const,
    })

    expect(node.type).toBe('string')
    expect(node.description).toBe('wrapped')
    expect(node.deprecated).toBe(true)
    expect(node.nullable).toBe(true)
  })

  it('flattens single-member allOf $ref and preserves nullable', () => {
    const node = parseSchema(ctx, { schema: { allOf: [{ $ref: '#/components/schemas/Pet' }], nullable: true } as const })

    expect(node.type).toBe('ref')
    expect(node.nullable).toBe(true)
  })

  it('produces an intersection for multiple allOf members', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { tag: { type: 'string' } } }],
      } as const,
    })

    expect(node.type).toBe('intersection')
    const narrowed462 = narrowSchema(node, 'intersection')
    expect(narrowed462?.members).toHaveLength(2)
  })

  it('appends sibling properties as an extra intersection member', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }],
        properties: { extra: { type: 'string' } },
      } as const,
    })

    // first member: the $ref, last member: the sibling properties object
    const narrowed474 = narrowSchema(node, 'intersection')
    expect(narrowed474?.members?.[0]?.type).toBe('ref')
    expect(narrowed474?.members?.[narrowed474.members.length - 1]?.type).toBe('object')
  })

  it('resolves required keys missing from outer properties by looking into allOf members', () => {
    const node = parseSchema(ctx, {
      schema: {
        required: ['id'],
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      } as const,
    })

    // The 2 anonymous allOf members are merged into 1; the injected required-key member is a separate synthetic member
    const narrowed490 = narrowSchema(node, 'intersection')
    expect(narrowed490?.members).toHaveLength(2)
    // the merged allOf object contains both id and name
    const mergedAllOf = narrowSchema(narrowed490?.members?.[0], 'object')
    expect(mergedAllOf?.properties?.map((p) => p.name)).toContain('id')
    expect(mergedAllOf?.properties?.map((p) => p.name)).toContain('name')
    // the injected member is an object with `id` marked required
    const injected = narrowSchema(narrowed490?.members?.[1], 'object')
    expect(injected?.properties?.find((p) => p.name === 'id')?.required).toBe(true)
  })

  it('does not inject required keys that are already in outer properties', () => {
    const node = parseSchema(ctx, {
      schema: {
        required: ['id'],
        properties: { id: { type: 'integer' } },
        allOf: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      } as const,
    })

    // only the allOf member + the sibling properties object; no extra injection
    const narrowed510 = narrowSchema(node, 'intersection')
    const objectMembers = narrowed510?.members?.filter((m) => m.type === 'object')
    expect(objectMembers).toHaveLength(2)
  })

  it('propagates nullable onto the intersection node', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        nullable: true,
      } as const,
    })

    expect(node.nullable).toBe(true)
  })

  it('propagates metadata onto the intersection node', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        description: 'combined',
        deprecated: true,
      } as const,
    })

    expect(node.description).toBe('combined')
    expect(node.deprecated).toBe(true)
  })

  it('produces an intersection when single-member allOf has a sibling required array', () => {
    // required on the outer schema signals structural intent — do not flatten.
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } }],
        required: ['id'],
      } as const,
    })

    expect(node.type).toBe('intersection')
  })

  it('produces an intersection when single-member allOf has a sibling additionalProperties', () => {
    // additionalProperties on the outer schema adds a constraint — do not flatten.
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Foo' }],
        additionalProperties: false,
      } as const,
    })

    expect(node.type).toBe('intersection')
  })

  it('still flattens single-member allOf when only annotation metadata is present', () => {
    // description / nullable / deprecated are safe to merge; no structural keys → flatten.
    const node = parseSchema(ctx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Foo' }],
        description: 'annotation only',
        nullable: true,
      } as const,
    })

    expect(node.type).toBe('ref')
    expect(node.description).toBe('annotation only')
    expect(node.nullable).toBe(true)
  })

  it('merges adjacent anonymous object members within allOf into a single object', () => {
    const node = parseSchema(ctx, {
      schema: {
        allOf: [
          { type: 'object', properties: { foo: { type: 'string' } } },
          { type: 'object', properties: { bar: { type: 'string' } } },
        ],
      } as const,
    })

    // Both anonymous allOf members should be merged into one object
    const narrowed588 = narrowSchema(node, 'intersection')
    expect(narrowed588?.members).toHaveLength(1)
    const merged = narrowSchema(narrowed588?.members?.[0], 'object')
    const propNames = merged?.properties?.map((p) => p.name)
    expect(propNames).toContain('foo')
    expect(propNames).toContain('bar')
  })

  it('merges synthetic object members (injected required-key + outer properties) into a single object', () => {
    // Models the FullAddress pattern:
    //   allOf: [$ref Address]  ← typically a $ref, but here tested with an inline anonymous object
    //   properties: { streetName }
    //   required: [streetName, streetNumber]  ← streetNumber resolved from Address
    // allOf-derived portion: 1 anonymous object (streetNumber)
    // synthetic portion: injected required-key (streetNumber) + outer properties (streetName) → merged into 1
    const node = parseSchema(ctx, {
      name: 'FullAddress',
      schema: {
        allOf: [
          {
            type: 'object' as const,
            properties: { streetNumber: { type: 'string' as const } },
          },
        ],
        properties: { streetName: { type: 'string' as const } },
        required: ['streetName', 'streetNumber'],
      },
    })

    // allOf member (not merged — single element) + one merged synthetic object (streetNumber + streetName)
    const narrowed617 = narrowSchema(node, 'intersection')
    expect(narrowed617?.members).toHaveLength(2)
    const merged617 = narrowSchema(narrowed617?.members?.[1], 'object')
    const propNames617 = merged617?.properties?.map((p) => p.name)
    expect(propNames617).toContain('streetNumber')
    expect(propNames617).toContain('streetName')
  })
})

describe('parseSchema oneOf / anyOf', () => {
  const ctx = { document: emptyDocument }

  it('maps oneOf to a union node', () => {
    const node = parseSchema(ctx, { schema: { oneOf: [{ type: 'string' }, { type: 'number' }] } })

    expect(node.type).toBe('union')
  })

  it('maps anyOf to a union node', () => {
    const node = parseSchema(ctx, { schema: { anyOf: [{ type: 'string' }, { type: 'number' }] } })

    expect(node.type).toBe('union')
  })

  it('combines oneOf and anyOf members into a single union', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }, { type: 'boolean' }],
      },
    })

    expect(node.type).toBe('union')
    const narrowed655 = narrowSchema(node, 'union')
    expect(narrowed655?.members).toHaveLength(3)
  })

  it('converts each oneOf member schema', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Pet' }],
      },
    })

    const members = narrowSchema(node, 'union')?.members ?? []
    expect(members[0]?.type).toBe('string')
    expect(members[1]?.type).toBe('ref')
  })

  it('propagates nullable onto the union node', () => {
    const node = parseSchema(ctx, { schema: { oneOf: [{ type: 'string' }], nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates metadata onto the union node', () => {
    const node = parseSchema(ctx, {
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
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        discriminator: { propertyName: 'petType' },
      },
    })

    expect(narrowSchema(node, 'union')?.discriminatorPropertyName).toBe('petType')
  })

  it('does not set discriminatorPropertyName when discriminator is absent', () => {
    const node = parseSchema(ctx, { schema: { oneOf: [{ type: 'string' }] } })

    expect(narrowSchema(node, 'union')?.discriminatorPropertyName).toBeUndefined()
  })

  it('intersects each member with sibling properties when properties are present', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        properties: { id: { type: 'integer' } },
      },
    })

    expect(node.type).toBe('intersection')
    const topIntersection = narrowSchema(node, 'intersection')!
    const unionNode = narrowSchema(topIntersection.members?.[0], 'union')
    const sharedNode = narrowSchema(topIntersection.members?.[1], 'object')

    expect(unionNode?.members).toHaveLength(2)
    expect(unionNode?.members?.every((m) => m.type === 'ref')).toBe(true)
    expect(sharedNode?.properties?.some((p) => p.name === 'id')).toBe(true)
  })

  it('each intersection member contains the oneOf ref and the properties node', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }],
        properties: { id: { type: 'integer' } },
      },
    })

    const topIntersection = narrowSchema(node, 'intersection')
    const unionNode = narrowSchema(topIntersection?.members?.[0], 'union')
    const [refMember] = unionNode?.members ?? []
    const [, propsMember] = topIntersection?.members ?? []
    expect(refMember?.type).toBe('ref')
    expect(propsMember?.type).toBe('object')
  })
})

describe('parseSchema const (OAS 3.1)', () => {
  const ctx = { document: emptyDocument }

  it('maps const string to a single-value enum', () => {
    const node = parseSchema(ctx, { schema: { const: 'active' } })

    expect(node.type).toBe('enum')
    expect(narrowSchema(node, 'enum')?.enumValues).toEqual(['active'])
  })

  it('maps const number to a single-value enum', () => {
    const node = parseSchema(ctx, { schema: { const: 42 } })

    expect(node.type).toBe('enum')
    expect(narrowSchema(node, 'enum')?.enumValues).toEqual([42])
  })

  it('maps const boolean to a single-value enum', () => {
    const node = parseSchema(ctx, { schema: { const: true } })

    expect(node.type).toBe('enum')
    expect(narrowSchema(node, 'enum')?.enumValues).toEqual([true])
  })

  it('maps const: null to a null scalar', () => {
    const node = parseSchema(ctx, { schema: { const: null } })

    expect(node.type).toBe('null')
  })

  it('const: null does not set nullable (avoids null | null)', () => {
    const node = parseSchema(ctx, { schema: { const: null, nullable: true } })

    expect(node.type).toBe('null')
    expect(node.nullable).toBeUndefined()
  })

  it('const: null as an object property does not set nullable on the property (avoids null | null)', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: {
          status: { const: null },
        },
      },
      name: 'MyObject',
    })

    const objectNode = narrowSchema(node, 'object')
    const statusProp = objectNode?.properties.find((p) => p.name === 'status')

    expect(statusProp?.schema.type).toBe('null')
    expect(statusProp?.schema.nullable).toBeUndefined()
  })

  it('propagates name on const enum', () => {
    const node = parseSchema(ctx, { schema: { const: 'active' }, name: 'Status' })

    expect(node.name).toBe('Status')
  })

  it('boolean const inside an object property has no name (inline literal)', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: {
          isHappy: { type: 'boolean', const: false },
        },
      },
      name: 'Pet',
    })

    const objectNode = narrowSchema(node, 'object')
    const isHappyProp = objectNode?.properties.find((p) => p.name === 'isHappy')
    const isHappyEnum = narrowSchema(isHappyProp?.schema, 'enum')

    expect(isHappyEnum?.name).toBeUndefined()
    expect(isHappyEnum?.enumValues).toEqual([false])
  })
})

describe('parseSchema readOnly / writeOnly', () => {
  const ctx = { document: emptyDocument }

  it('sets readOnly: true when marked', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('sets writeOnly: true when marked', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', writeOnly: true } })

    expect(node.writeOnly).toBe(true)
  })

  it('leaves readOnly / writeOnly undefined when not set', () => {
    const node = parseSchema(ctx, { schema: { type: 'string' } })

    expect(node.readOnly).toBeUndefined()
    expect(node.writeOnly).toBeUndefined()
  })

  it('propagates readOnly on object schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'object', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('propagates writeOnly on array schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', writeOnly: true } })

    expect(node.writeOnly).toBe(true)
  })

  it('propagates readOnly on enum schema', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b'], readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('populates node.schema with the resolved ref schema when the document contains the definition', async () => {
    const oas = await buildMinimalOas()
    const root = parseOas(oas).root
    const petList = narrowSchema(
      root.schemas.find((s) => s.name === 'PetList'),
      'array',
    )
    // Items of PetList are refs to Pet — they should carry a resolved schema
    const petRef = petList?.items?.find((item) => item.type === 'ref')
    expect(petRef?.type).toBe('ref')
    if (petRef?.type !== 'ref') return
    expect(petRef.schema).toBeDefined()
    expect(petRef.schema?.type).toBe('object')
  })

  it('syncSchemaRef merges usage-site sibling fields over the resolved schema', async () => {
    const oas = await buildMinimalOas()
    const { root } = parseOas(oas)
    const petList = narrowSchema(
      root.schemas.find((s) => s.name === 'PetList'),
      'array',
    )
    const petRef = petList?.items?.find((item) => item.type === 'ref')
    if (!petRef) return

    const merged = syncSchemaRef(petRef)
    // Merged result has the resolved schema's type (object)
    expect(merged?.type).toBe('object')
  })

  it('propagates readOnly on ref schema siblings', () => {
    const node = parseSchema(ctx, { schema: { $ref: '#/components/schemas/Pet', readOnly: true } })

    expect(node.readOnly).toBe(true)
  })

  it('drops pattern on ref sibling when type is not string', () => {
    const node = parseSchema(ctx, { schema: { $ref: '#/components/schemas/Pet', pattern: '^[a-z]+$' } })

    expect(narrowSchema(node, 'ref')?.pattern).toBeUndefined()
  })
})

describe('parseSchema deprecated', () => {
  const ctx = { document: emptyDocument }

  it('sets deprecated: true when marked', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('leaves deprecated undefined when not set', () => {
    const node = parseSchema(ctx, { schema: { type: 'string' } })

    expect(node.deprecated).toBeUndefined()
  })

  it('propagates deprecated on object schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'object', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on array schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on enum schema', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b'], deprecated: true } })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on ref schema siblings', () => {
    const node = parseSchema(ctx, { schema: { $ref: '#/components/schemas/Pet', deprecated: true } })

    expect(node.deprecated).toBe(true)
  })
})

describe('parseSchema default', () => {
  const ctx = { document: emptyDocument }

  it('passes through a normal default value', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', default: 'hello' } })

    expect(node.default).toBe('hello')
  })

  it('passes through a falsy-but-non-null default (0)', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', default: 0 } })

    expect(node.default).toBe(0)
  })

  it('passes through a falsy-but-non-null default (false)', () => {
    const node = parseSchema(ctx, { schema: { type: 'boolean', default: false } })

    expect(node.default).toBe(false)
  })

  it('drops default: null when schema is nullable (defaultNullAndNullable)', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })

  it('keeps default: null when schema is not nullable', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', default: null } })

    expect(node.default).toBeNull()
  })

  it('drops default: null for nullable enum', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b'], nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })

  it('drops default: null for nullable ref sibling', () => {
    const node = parseSchema(ctx, { schema: { $ref: '#/components/schemas/Pet', nullable: true, default: null } })

    expect(node.default).toBeUndefined()
  })
})

describe('parseSchema object properties', () => {
  const ctx = { document: emptyDocument }

  it('required + not nullable → required: true, optional/nullish undefined', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
    })
    const prop = narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'id')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + not nullable → optional: true', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: { tag: { type: 'string' } },
      },
    })
    const prop = narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.optional).toBe(true)
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + nullable → nullish: true', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: { tag: { type: 'string', nullable: true } },
      },
    })
    const prop = narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.nullish).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullable).toBe(true)
  })

  it('required + nullable → nullable: true, optional/nullish undefined', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        required: ['tag'],
        properties: { tag: { type: 'string', nullable: true } },
      },
    })
    const prop = narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.nullable).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
  })

  it('treats required: true (OAS 2.0 scalar) as all properties required', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        // OAS 2.0 allows `required: true` (boolean) on individual properties.
        // Cast simulates an OAS 2.0 spec parsed at runtime where the type diverges from the TS definition.
        required: true as unknown as string[],
        properties: { id: { type: 'integer' }, tag: { type: 'string' } },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    const id = narrowed?.properties?.find((p) => p.name === 'id')
    const tag = narrowed?.properties?.find((p) => p.name === 'tag')

    expect(id?.required).toBe(true)
    expect(id?.schema.optional).toBeUndefined()
    expect(tag?.required).toBe(true)
    expect(tag?.schema.optional).toBeUndefined()
  })
})

describe('parseSchema object additionalProperties', () => {
  const ctx = { document: emptyDocument }

  it('additionalProperties: true → additionalProperties is true', () => {
    const node = parseSchema(ctx, { schema: { type: 'object', additionalProperties: true } })
    const narrowed = narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(narrowed?.additionalProperties).toBe(true)
  })

  it('additionalProperties with a schema → additionalProperties is a SchemaNode', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(narrowed?.additionalProperties).toMatchObject({ type: 'string' })
  })

  it('additionalProperties with an integer schema → additionalProperties is a NumberSchemaNode', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        additionalProperties: { type: 'integer' },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.additionalProperties).toMatchObject({ type: 'integer' })
  })

  it('additionalProperties: false → additionalProperties is undefined', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        additionalProperties: false,
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.additionalProperties).toBeUndefined()
  })

  it('no additionalProperties → additionalProperties is undefined', () => {
    const node = parseSchema(ctx, { schema: { type: 'object', properties: { id: { type: 'integer' } } } })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.additionalProperties).toBeUndefined()
  })

  it('additionalProperties: true triggers object even without type or properties', () => {
    const node = parseSchema(ctx, { schema: { additionalProperties: true } })
    const narrowed = narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(narrowed?.additionalProperties).toBe(true)
  })

  it('additionalProperties with an empty schema → uses unknownType', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        additionalProperties: {},
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(narrowed?.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('respects unknownType option for empty additionalProperties', () => {
    const ctx = { document: emptyDocument }
    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          additionalProperties: {},
        },
      },
      { unknownType: 'any' },
    )
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('properties and additionalProperties coexist', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
        additionalProperties: { type: 'string' },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.properties).toHaveLength(1)
    expect(narrowed?.properties?.[0]?.name).toBe('id')
    expect(narrowed?.additionalProperties).toMatchObject({ type: 'string' })
  })
})

describe('parseSchema object patternProperties', () => {
  const ctx = { document: emptyDocument }

  it('maps patternProperties patterns to converted SchemaNodes', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        patternProperties: {
          '^S_': { type: 'string' },
          '^I_': { type: 'integer' },
        },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(narrowed?.patternProperties?.['I_']).toBeUndefined()
    expect(narrowed?.patternProperties?.['S_']).toBeUndefined()
    expect(narrowed?.patternProperties?.['S_']).toBeUndefined()
    expect(narrowed?.patternProperties?.['^S_']).toMatchObject({ type: 'string' })
    expect(narrowed?.patternProperties?.['^I_']).toMatchObject({ type: 'integer' })
  })

  it('empty pattern schema falls back to unknownType', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        patternProperties: { '^x-': {} },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.patternProperties?.['^x-']).toMatchObject({ type: 'any' })
  })

  it('pattern schema true falls back to unknownType', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        // OAS 3.1 / JSON Schema 2020-12 allows boolean schemas for patternProperties values.
        // Cast simulates a `true` boolean schema at runtime where the TS type expects SchemaObject.
        patternProperties: { '^x-': true as unknown as SchemaObject },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.patternProperties?.['^x-']).toMatchObject({ type: 'any' })
  })

  it('patternProperties triggers object even without type or properties', () => {
    const node = parseSchema(ctx, {
      schema: {
        patternProperties: { '^x-': { type: 'string' } },
      },
    })

    expect(node.type).toBe('object')
  })

  it('properties and patternProperties coexist', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        patternProperties: { '^meta_': { type: 'string' } },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    expect(narrowed?.properties).toHaveLength(1)
    expect(narrowed?.patternProperties?.['^meta_']).toMatchObject({ type: 'string' })
  })
})

describe('parseSchema object discriminator', () => {
  const ctx = { document: emptyDocument }

  it('overrides discriminator property with enum of mapping keys', () => {
    const node = parseSchema(ctx, {
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
    const narrowed = narrowSchema(node, 'object')

    const petTypeProp = narrowed?.properties?.find((p) => p.name === 'petType')
    const petTypeSchema = narrowSchema(petTypeProp?.schema, 'enum')
    expect(petTypeSchema?.type).toBe('enum')
    expect(petTypeSchema?.enumValues).toEqual(['Cat', 'Dog'])
  })

  it('leaves other properties unchanged when discriminator is present', () => {
    const node = parseSchema(ctx, {
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
    const narrowed = narrowSchema(node, 'object')

    const nameProp = narrowed?.properties?.find((p) => p.name === 'name')
    expect(nameProp?.schema.type).toBe('string')
  })

  it('discriminator without mapping produces no enum', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        required: ['type'],
        properties: { type: { type: 'string' } },
        discriminator: { propertyName: 'type' },
      },
    })
    const narrowed = narrowSchema(node, 'object')

    const typeProp = narrowed?.properties?.find((p) => p.name === 'type')
    expect(typeProp?.schema.type).toBe('string')
  })
})

describe('parseSchema object inline enum naming', () => {
  it('enum name accumulates full parent path (OrderParamsStatusEnum)', () => {
    const ctx = { document: emptyDocument }
    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            params: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['active', 'inactive'] },
              },
            },
          },
        },
        name: 'Order',
      },
      { enumSuffix: 'enum' },
    )
    const narrowed = narrowSchema(node, 'object')

    const paramsProp = narrowed?.properties?.find((p) => p.name === 'params')
    const paramsSchema = narrowSchema(paramsProp?.schema, 'object')
    const statusProp = paramsSchema?.properties?.find((p) => p.name === 'status')
    expect(statusProp?.schema.name).toBe('OrderParamsStatusEnum')
  })
})

describe('parseSchema prefixItems (tuple)', () => {
  const ctx = { document: emptyDocument }

  it('maps type to tuple', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [{ type: 'string' }] } })

    expect(node.type).toBe('tuple')
  })

  it('maps each prefixItem to an items entry in order', () => {
    const node = parseSchema(ctx, {
      schema: {
        prefixItems: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      },
    })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.items).toHaveLength(3)
    expect(narrowed?.items?.[0]?.type).toBe('string')
    expect(narrowed?.items?.[1]?.type).toBe('number')
    expect(narrowed?.items?.[2]?.type).toBe('boolean')
  })

  it('maps items (alongside prefixItems) to rest', () => {
    const node = parseSchema(ctx, {
      schema: {
        prefixItems: [{ type: 'string' }],
        items: { type: 'number' },
      },
    })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.rest?.type).toBe('number')
  })

  it('defaults rest to any when items is absent', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [{ type: 'string' }] } })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.rest?.type).toBe('any')
  })

  it('converts a $ref prefixItem to a ref node', () => {
    const node = parseSchema(ctx, {
      schema: {
        prefixItems: [{ $ref: '#/components/schemas/Pet' }],
      },
    })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.items?.[0]?.type).toBe('ref')
  })

  it('converts a nested object prefixItem', () => {
    const node = parseSchema(ctx, {
      schema: {
        prefixItems: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      },
    })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.items?.[0]?.type).toBe('object')
  })

  it('converts a $ref rest schema', () => {
    const node = parseSchema(ctx, {
      schema: {
        prefixItems: [{ type: 'string' }],
        items: { $ref: '#/components/schemas/Extra' },
      },
    })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.rest?.type).toBe('ref')
  })

  it('maps minItems to min', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [{ type: 'string' }], minItems: 1 } })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.min).toBe(1)
  })

  it('maps maxItems to max', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [{ type: 'string' }], maxItems: 4 } })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.max).toBe(4)
  })

  it('leaves min and max undefined when minItems and maxItems are absent', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [{ type: 'string' }] } })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.min).toBeUndefined()
    expect(narrowed?.max).toBeUndefined()
  })

  it('produces an empty items array for an empty prefixItems', () => {
    const node = parseSchema(ctx, { schema: { prefixItems: [] } })
    const narrowed = narrowSchema(node, 'tuple')

    expect(narrowed?.items).toHaveLength(0)
  })

  it('takes precedence over type: array — always resolves to tuple', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', prefixItems: [{ type: 'string' }] } })

    expect(node.type).toBe('tuple')
  })
})

describe('parseSchema tuple enum naming', () => {
  it('names enum elements inside a tuple property using parent + propName', () => {
    const ctx = { document: emptyDocument }
    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'array',
              prefixItems: [{ type: 'integer' }, { type: 'string' }, { enum: ['NW', 'NE', 'SW', 'SE'] }],
            },
          },
        },
        name: 'Address',
      },
      { enumSuffix: 'enum' },
    )
    const narrowed = narrowSchema(node, 'object')

    const identifierProp = narrowed?.properties?.find((p) => p.name === 'identifier')
    const tupleNode = narrowSchema(identifierProp?.schema, 'tuple')
    expect(tupleNode?.items?.[2]?.type).toBe('enum')
    expect(tupleNode?.items?.[2]?.name).toBe('AddressIdentifierEnum')
  })

  it('uses full path for enum in tuple', () => {
    const ctx = { document: emptyDocument }
    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'array',
              prefixItems: [{ type: 'integer' }, { enum: ['NW', 'NE', 'SW', 'SE'] }],
            },
          },
        },
        name: 'Address',
      },
      { enumSuffix: 'enum' },
    )
    const narrowed = narrowSchema(node, 'object')

    const identifierProp = narrowed?.properties?.find((p) => p.name === 'identifier')
    const tupleNode = narrowSchema(identifierProp?.schema, 'tuple')
    expect(tupleNode?.items?.[1]?.type).toBe('enum')
    expect(tupleNode?.items?.[1]?.name).toBe('AddressIdentifierEnum')
  })

  it('non-enum tuple elements are unaffected by enum naming', () => {
    const ctx = { document: emptyDocument }
    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            coords: {
              type: 'array',
              prefixItems: [{ type: 'number' }, { type: 'number' }],
            },
          },
        },
        name: 'Location',
      },
      { enumSuffix: 'enum' },
    )
    const narrowed = narrowSchema(node, 'object')

    const coordsProp = narrowed?.properties?.find((p) => p.name === 'coords')
    const tupleNode = narrowSchema(coordsProp?.schema, 'tuple')
    expect(tupleNode?.items?.[0]?.name).toBeUndefined()
    expect(tupleNode?.items?.[1]?.name).toBeUndefined()
  })
})

describe('parseSchema nullable', () => {
  const ctx = { document: emptyDocument }

  it('sets nullable via nullable: true (OAS 3.0)', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via x-nullable: true', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', 'x-nullable': true } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via type array including null (OAS 3.1)', () => {
    const node = parseSchema(ctx, { schema: { type: ['string', 'null'] } })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via null in enum values (OAS 3.0 convention)', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b', null] } })

    expect(node.nullable).toBe(true)
  })

  it('strips null from enum values when nullable via null in enum', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b', null] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(narrowed?.enumValues).toEqual(['a', 'b'])
  })

  it('does not set nullable when not specified', () => {
    const node = parseSchema(ctx, { schema: { type: 'string' } })

    expect(node.nullable).toBeUndefined()
  })

  it('propagates nullable from object schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'object', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from array schema', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', nullable: true } })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from ref schema siblings', () => {
    const node = parseSchema(ctx, { schema: { $ref: '#/components/schemas/Pet', nullable: true } })

    expect(node.nullable).toBe(true)
  })
})

describe('parseSchema string', () => {
  const ctx = { document: emptyDocument }

  it('maps type string to string node', () => {
    const node = parseSchema(ctx, { schema: { type: 'string' } })

    expect(node.type).toBe('string')
  })

  it('preserves nullable on string', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', nullable: true } })

    expect(node.type).toBe('string')
    expect(node.nullable).toBe(true)
  })

  it('maps minLength to min', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', minLength: 1 } })
    const narrowed = narrowSchema(node, 'string')

    expect(narrowed?.min).toBe(1)
  })

  it('maps maxLength to max', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', maxLength: 100 } })
    const narrowed = narrowSchema(node, 'string')

    expect(narrowed?.max).toBe(100)
  })
})

describe('parseSchema boolean', () => {
  const ctx = { document: emptyDocument }

  it('maps type boolean to boolean node', () => {
    const node = parseSchema(ctx, { schema: { type: 'boolean' } })

    expect(node.type).toBe('boolean')
  })

  it('preserves nullable on boolean', () => {
    const node = parseSchema(ctx, { schema: { type: 'boolean', nullable: true } })

    expect(node.type).toBe('boolean')
    expect(node.nullable).toBe(true)
  })

  it('passes through default value', () => {
    const node = parseSchema(ctx, { schema: { type: 'boolean', default: false } })

    expect(node.default).toBe(false)
  })
})

describe('parseSchema enum', () => {
  const ctx = { document: emptyDocument }

  it('maps type to enum', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b'] } })

    expect(node.type).toBe('enum')
  })

  it('stores string values in enumValues', () => {
    const node = parseSchema(ctx, { schema: { enum: ['foo', 'bar', 'baz'] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(narrowed?.enumValues).toEqual(['foo', 'bar', 'baz'])
  })

  it('deduplicates enum values', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'a', 'b'] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(narrowed?.enumValues).toEqual(['a', 'b'])
  })

  it('strips null from enumValues and sets nullable', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', null, 'b'] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(node.nullable).toBe(true)
    expect(narrowed?.enumValues).toEqual(['a', 'b'])
  })

  it('sets nullable from null in enum even when nullable is not set on schema', () => {
    const node = parseSchema(ctx, { schema: { enum: [null] } })

    expect(node.nullable).toBe(true)
  })

  it('sets enumNullable from schema nullable combined with null in enum', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', null], nullable: true } })
    const narrowed = narrowSchema(node, 'enum')

    expect(node.nullable).toBe(true)
    expect(narrowed?.enumValues).toEqual(['a'])
  })

  it('clears default when default is null and enum is nullable', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', null], default: null } })

    expect(node.default).toBeUndefined()
  })

  it('preserves non-null default', () => {
    const node = parseSchema(ctx, { schema: { enum: ['a', 'b'], default: 'a' } })

    expect(node.default).toBe('a')
  })

  // Number enum
  it('produces namedEnumValues with primitive number for integer enum', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', enum: [1, 2, 3] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(node.type).toBe('enum')
    expect(node.primitive).toBe('number')
    const values = narrowed?.namedEnumValues
    expect(values?.map((v) => v.value)).toEqual([1, 2, 3])
    expect(values?.every((v) => v.primitive === 'number')).toBe(true)
  })

  it('produces namedEnumValues with primitive number for number enum', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', enum: [0.5, 1.5] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(node.primitive).toBe('number')
    expect(narrowed?.namedEnumValues?.map((v) => v.value)).toEqual([0.5, 1.5])
  })

  it('uses stringified value as name for numeric enum values', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', enum: [42] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(narrowed?.namedEnumValues?.[0]?.name).toBe('42')
  })

  it('deduplicates numeric enum values', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', enum: [1, 1, 2] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(narrowed?.namedEnumValues?.map((v) => v.value)).toEqual([1, 2])
  })

  // Boolean enum
  it('produces namedEnumValues with primitive boolean for boolean enum', () => {
    const node = parseSchema(ctx, { schema: { type: 'boolean', enum: [true, false] } })
    const narrowed = narrowSchema(node, 'enum')

    expect(node.primitive).toBe('boolean')
    const values = narrowed?.namedEnumValues
    expect(values?.map((v) => v.value)).toEqual([true, false])
    expect(values?.every((v) => v.primitive === 'boolean')).toBe(true)
  })

  // x-enumNames
  it('uses x-enumNames labels as namedEnumValues names', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'integer',
        enum: [1, 2, 3],
        'x-enumNames': ['One', 'Two', 'Three'],
      },
    })
    const narrowed = narrowSchema(node, 'enum')

    const values = narrowed?.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['One', 'Two', 'Three'])
    expect(values?.map((v) => v.value)).toEqual([1, 2, 3])
  })

  it('uses x-enum-varnames labels as namedEnumValues names', () => {
    const node = parseSchema(ctx, {
      schema: {
        enum: ['active', 'inactive'],
        'x-enum-varnames': ['Active', 'Inactive'],
      },
    })
    const narrowed = narrowSchema(node, 'enum')

    const values = narrowed?.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['Active', 'Inactive'])
    expect(values?.map((v) => v.value)).toEqual(['active', 'inactive'])
  })

  it('x-enumNames deduplicates names', () => {
    const node = parseSchema(ctx, {
      schema: {
        enum: [1, 2, 3],
        'x-enumNames': ['A', 'A', 'B'],
      },
    })
    const narrowed = narrowSchema(node, 'enum')

    const values = narrowed?.namedEnumValues
    expect(values?.map((v) => v.name)).toEqual(['A', 'B'])
  })

  it('x-enumNames sets primitive number for integer type', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'integer',
        enum: [0, 1],
        'x-enumNames': ['Off', 'On'],
      },
    })

    expect(node.primitive).toBe('number')
  })

  it('x-enumNames sets primitive string when type is not numeric or boolean', () => {
    const node = parseSchema(ctx, {
      schema: {
        enum: ['a', 'b'],
        'x-enumNames': ['Alpha', 'Beta'],
      },
    })

    expect(node.primitive).toBe('string')
  })

  // Array + enum normalization
  it('normalizes array+enum by moving enum into items and returning array node', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', enum: ['x', 'y'] } })
    const narrowed = narrowSchema(node, 'array')

    expect(node.type).toBe('array')
    const itemNode = narrowSchema(narrowed?.items?.[0], 'enum')
    expect(itemNode?.type).toBe('enum')
    expect(itemNode?.enumValues).toEqual(['x', 'y'])
  })

  it('merges existing items schema when normalizing array+enum', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', items: { type: 'string' }, enum: ['x', 'y'] } })
    const narrowed = narrowSchema(node, 'array')

    expect(node.type).toBe('array')
    const itemNode = narrowSchema(narrowed?.items?.[0], 'enum')
    expect(itemNode?.type).toBe('enum')
    expect(itemNode?.enumValues).toEqual(['x', 'y'])
  })
})

describe('parseSchema null', () => {
  const ctx = { document: emptyDocument }

  it('maps type null to null node', () => {
    const node = parseSchema(ctx, { schema: { type: 'null' } })

    expect(node.type).toBe('null')
  })

  it('propagates description on null', () => {
    const node = parseSchema(ctx, { schema: { type: 'null', description: 'always null' } })

    expect(node.description).toBe('always null')
  })

  it('type: null property in object does not set nullable (avoids null | null)', () => {
    const node = parseSchema(ctx, {
      schema: {
        type: 'object',
        properties: {
          field: { type: 'null' },
        },
      },
      name: 'Wrapper',
    })

    const objectNode = narrowSchema(node, 'object')
    const fieldProp = objectNode?.properties.find((p) => p.name === 'field')

    expect(fieldProp?.schema.type).toBe('null')
    expect(fieldProp?.schema.nullable).toBeUndefined()
  })
})

describe('parseSchema OAS 3.1 type array', () => {
  const ctx = { document: emptyDocument }

  it('produces a union node for two non-null types', () => {
    const node = parseSchema(ctx, { schema: { type: ['string', 'integer'] } })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(narrowed?.members).toHaveLength(2)
    expect(narrowed?.members?.[0]?.type).toBe('string')
    expect(narrowed?.members?.[1]?.type).toBe('integer')
  })

  it('produces a union node for three non-null types', () => {
    const node = parseSchema(ctx, { schema: { type: ['string', 'integer', 'boolean'] } })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(narrowed?.members).toHaveLength(3)
  })

  it('sets nullable when null is among multiple types', () => {
    const node = parseSchema(ctx, { schema: { type: ['string', 'integer', 'null'] } })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(node.nullable).toBe(true)
    expect(narrowed?.members).toHaveLength(2)
  })

  it('sets nullable when null is in a single-non-null type array', () => {
    const node = parseSchema(ctx, { schema: { type: ['string', 'null'] } })

    expect(node.type).toBe('string')
    expect(node.nullable).toBe(true)
  })

  it('handles type array with a single non-null entry', () => {
    const node = parseSchema(ctx, { schema: { type: ['integer'] } })

    expect(node.type).toBe('integer')
    expect(node.nullable).toBeUndefined()
  })

  it('propagates shared schema metadata onto the union node', () => {
    const node = parseSchema(ctx, {
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
    const node = parseSchema(ctx, { schema: { type: ['string', 'integer'], readOnly: true } })
    const narrowed = narrowSchema(node, 'union')

    const members = narrowed?.members ?? []
    expect(members.every((m) => m.readOnly === true)).toBe(true)
  })
})

describe('parseSchema integer', () => {
  const ctx = { document: emptyDocument }

  it('maps type integer to integer node', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer' } })

    expect(node.type).toBe('integer')
  })

  it('maps integer int32 to integer', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int32' } })

    expect(node.type).toBe('integer')
  })

  it('maps integer int64 to integer when integerType is number (default)', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int64' } })

    expect(node.type).toBe('integer')
  })

  it('maps format int64 without type to integer (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'int64' } })

    expect(node.type).toBe('integer')
  })

  it('preserves nullable on integer', () => {
    const node = parseSchema(ctx, { schema: { type: 'integer', nullable: true } })

    expect(node.type).toBe('integer')
    expect(node.nullable).toBe(true)
  })
})

describe('parseSchema number', () => {
  const ctx = { document: emptyDocument }

  it('maps type number to number node', () => {
    const node = parseSchema(ctx, { schema: { type: 'number' } })

    expect(node.type).toBe('number')
  })

  it('maps number float to number', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', format: 'float' } })

    expect(node.type).toBe('number')
  })

  it('maps number double to number', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', format: 'double' } })

    expect(node.type).toBe('number')
  })

  it('maps format float without type to number (format overrides type)', () => {
    const node = parseSchema(ctx, { schema: { format: 'float' } })

    expect(node.type).toBe('number')
  })

  it('preserves nullable on number', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', nullable: true } })

    expect(node.type).toBe('number')
    expect(node.nullable).toBe(true)
  })
})

describe('parseSchema pattern', () => {
  const ctx = { document: emptyDocument }

  it('maps pattern on a string type to a string node with pattern', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', pattern: '^[a-z]+$' } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.pattern).toBe('^[a-z]+$')
  })

  it('infers string type from pattern alone (no explicit type)', () => {
    const node = parseSchema(ctx, { schema: { pattern: '^[0-9]+$' } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.pattern).toBe('^[0-9]+$')
  })

  it('ignores pattern on non-string types', () => {
    const node = parseSchema(ctx, { schema: { type: 'number', pattern: '^[0-9]+$' } })

    expect(node.type).toBe('number')
    expect(narrowSchema(node, 'string')?.pattern).toBeUndefined()
  })

  it('preserves nullable on a pattern string', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', pattern: '^[a-z]+$', nullable: true } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.pattern).toBe('^[a-z]+$')
    expect(node.nullable).toBe(true)
  })

  it('preserves minLength and maxLength alongside pattern', () => {
    const node = parseSchema(ctx, { schema: { type: 'string', pattern: '^[a-z]+$', minLength: 2, maxLength: 10 } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.pattern).toBe('^[a-z]+$')
    expect(narrowed?.min).toBe(2)
    expect(narrowed?.max).toBe(10)
  })
})

describe('parseSchema array', () => {
  const ctx = { document: emptyDocument }

  it('maps type array to array node', () => {
    const node = parseSchema(ctx, { schema: { type: 'array' } })

    expect(node.type).toBe('array')
  })

  it('infers array type from items key alone (no explicit type)', () => {
    const node = parseSchema(ctx, { schema: { items: { type: 'string' } } })

    expect(node.type).toBe('array')
  })

  it('converts items to a single-element items array', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', items: { type: 'string' } } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.items).toHaveLength(1)
    expect(narrowed?.items?.[0]?.type).toBe('string')
  })

  it('produces an empty items array when items is absent', () => {
    const node = parseSchema(ctx, { schema: { type: 'array' } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.items).toHaveLength(0)
  })

  it('maps minItems to min', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', minItems: 1 } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.min).toBe(1)
  })

  it('maps maxItems to max', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', maxItems: 5 } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.max).toBe(5)
  })

  it('maps uniqueItems: true to unique: true', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', uniqueItems: true } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.unique).toBe(true)
  })

  it('maps uniqueItems: false to unique: false', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', uniqueItems: false } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.unique).toBe(false)
  })

  it('leaves unique undefined when uniqueItems is not set', () => {
    const node = parseSchema(ctx, { schema: { type: 'array' } })
    const narrowed = narrowSchema(node, 'array')

    expect(narrowed?.unique).toBeUndefined()
  })

  it('preserves nullable on array', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', nullable: true } })

    expect(node.type).toBe('array')
    expect(node.nullable).toBe(true)
  })

  it('converts nested array items recursively', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', items: { type: 'array', items: { type: 'number' } } } })
    const narrowed = narrowSchema(node, 'array')
    const outerItem = narrowSchema(narrowed?.items?.[0], 'array')
    const innerItem = outerItem?.items?.[0]

    expect(node.type).toBe('array')
    expect(outerItem?.type).toBe('array')
    expect(innerItem?.type).toBe('number')
  })

  it('converts ref items', () => {
    const node = parseSchema(ctx, { schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } } })
    const narrowed = narrowSchema(node, 'array')

    expect(node.type).toBe('array')
    expect(narrowed?.items?.[0]?.type).toBe('ref')
  })
})

describe('parseSchema type inference (no explicit type)', () => {
  const ctx = { document: emptyDocument }

  it('infers string from minLength alone', () => {
    const node = parseSchema(ctx, { schema: { minLength: 1 } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.min).toBe(1)
  })

  it('infers string from maxLength alone', () => {
    const node = parseSchema(ctx, { schema: { maxLength: 100 } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.max).toBe(100)
  })

  it('infers string from both minLength and maxLength', () => {
    const node = parseSchema(ctx, { schema: { minLength: 2, maxLength: 50 } })
    const narrowed = narrowSchema(node, 'string')

    expect(node.type).toBe('string')
    expect(narrowed?.min).toBe(2)
    expect(narrowed?.max).toBe(50)
  })

  it('infers number from minimum alone', () => {
    const node = parseSchema(ctx, { schema: { minimum: 0 } })
    const narrowed = narrowSchema(node, 'number')

    expect(node.type).toBe('number')
    expect(narrowed?.min).toBe(0)
  })

  it('infers number from maximum alone', () => {
    const node = parseSchema(ctx, { schema: { maximum: 999 } })
    const narrowed = narrowSchema(node, 'number')

    expect(node.type).toBe('number')
    expect(narrowed?.max).toBe(999)
  })

  it('infers number from both minimum and maximum', () => {
    const node = parseSchema(ctx, { schema: { minimum: 1, maximum: 100 } })
    const narrowed = narrowSchema(node, 'number')

    expect(node.type).toBe('number')
    expect(narrowed?.min).toBe(1)
    expect(narrowed?.max).toBe(100)
  })

  it('does not infer array from minItems/maxItems alone', () => {
    const node = parseSchema(ctx, { schema: { minItems: 1, maxItems: 5 } })

    expect(node.type).not.toBe('array')
  })
})

describe('parseSchema constraints', () => {
  const ctx = { document: emptyDocument }

  describe('array: minItems / maxItems', () => {
    it('maps minItems to min', () => {
      const node = parseSchema(ctx, { schema: { type: 'array', minItems: 2 } })
      const narrowed = narrowSchema(node, 'array')

      expect(narrowed?.min).toBe(2)
    })

    it('maps maxItems to max', () => {
      const node = parseSchema(ctx, { schema: { type: 'array', maxItems: 10 } })
      const narrowed = narrowSchema(node, 'array')

      expect(narrowed?.max).toBe(10)
    })

    it('maps both minItems and maxItems', () => {
      const node = parseSchema(ctx, { schema: { type: 'array', minItems: 1, maxItems: 5 } })
      const narrowed = narrowSchema(node, 'array')

      expect(narrowed?.min).toBe(1)
      expect(narrowed?.max).toBe(5)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parseSchema(ctx, { schema: { type: 'array' } })
      const narrowed = narrowSchema(node, 'array')

      expect(narrowed?.min).toBeUndefined()
      expect(narrowed?.max).toBeUndefined()
    })
  })

  describe('string: minLength / maxLength', () => {
    it('maps minLength to min', () => {
      const node = parseSchema(ctx, { schema: { type: 'string', minLength: 3 } })
      const narrowed = narrowSchema(node, 'string')

      expect(narrowed?.min).toBe(3)
    })

    it('maps maxLength to max', () => {
      const node = parseSchema(ctx, { schema: { type: 'string', maxLength: 255 } })
      const narrowed = narrowSchema(node, 'string')

      expect(narrowed?.max).toBe(255)
    })

    it('maps both minLength and maxLength', () => {
      const node = parseSchema(ctx, { schema: { type: 'string', minLength: 1, maxLength: 100 } })
      const narrowed = narrowSchema(node, 'string')

      expect(narrowed?.min).toBe(1)
      expect(narrowed?.max).toBe(100)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parseSchema(ctx, { schema: { type: 'string' } })
      const narrowed = narrowSchema(node, 'string')

      expect(narrowed?.min).toBeUndefined()
      expect(narrowed?.max).toBeUndefined()
    })
  })

  describe('number: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', minimum: 0 } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.min).toBe(0)
    })

    it('maps maximum to max', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', maximum: 999 } })
      const narrowed = narrowSchema(node, 'number')
      expect(narrowed?.max).toBe(999)
    })

    it('maps both minimum and maximum', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', minimum: 1, maximum: 100 } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.min).toBe(1)
      expect(narrowed?.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', exclusiveMinimum: 0 } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', exclusiveMaximum: 100 } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parseSchema(ctx, { schema: { type: 'number', exclusiveMinimum: true } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parseSchema(ctx, { schema: { type: 'number' } })
      const narrowed = narrowSchema(node, 'number')

      expect(narrowed?.min).toBeUndefined()
      expect(narrowed?.max).toBeUndefined()
    })
  })

  describe('integer: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', minimum: 1 } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.min).toBe(1)
    })

    it('maps maximum to max', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', maximum: 100 } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.max).toBe(100)
    })

    it('maps both minimum and maximum', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', minimum: 1, maximum: 100 } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.min).toBe(1)
      expect(narrowed?.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', exclusiveMinimum: 0 } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', exclusiveMaximum: 100 } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer', exclusiveMinimum: true } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parseSchema(ctx, { schema: { type: 'integer' } })
      const narrowed = narrowSchema(node, 'integer')

      expect(narrowed?.min).toBeUndefined()
      expect(narrowed?.max).toBeUndefined()
    })
  })
})

describe('parser options', () => {
  describe('emptySchemaType', () => {
    it('defaults to any for a schema with no type information', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: {} })

      expect(node.type).toBe('any')
    })

    it('emptySchemaType: any returns any for an empty schema', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: {} }, { emptySchemaType: 'any' })

      expect(node.type).toBe('any')
    })

    it('emptySchemaType: void returns void for an empty schema', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: {} }, { emptySchemaType: 'void' })

      expect(node.type).toBe('void')
    })

    it('emptySchemaType: unknown returns unknown for an empty schema', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: {} }, { emptySchemaType: 'unknown' })

      expect(node.type).toBe('unknown')
    })

    it('emptySchemaType does not affect typed schemas', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'string' } }, { emptySchemaType: 'any' })

      expect(node.type).toBe('string')
    })
  })

  describe('integerType', () => {
    it('defaults to integer for int64 when integerType is not set', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int64' } })

      expect(node.type).toBe('integer')
    })

    it('integerType: number keeps int64 as integer', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int64' } }, { integerType: 'number' })

      expect(node.type).toBe('integer')
    })

    it('integerType: bigint maps int64 to bigint', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int64' } }, { integerType: 'bigint' })

      expect(node.type).toBe('bigint')
    })

    it('integerType: bigint does not affect int32', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'integer', format: 'int32' } }, { integerType: 'bigint' })

      expect(node.type).toBe('integer')
    })

    it('integerType does not affect non-integer types', () => {
      const ctx = { document: emptyDocument }
      const node = parseSchema(ctx, { schema: { type: 'number', format: 'float' } }, { integerType: 'bigint' })

      expect(node.type).toBe('number')
    })
  })

  describe('dateType', () => {
    describe('format date-time', () => {
      it('defaults to datetime', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } })
        const narrowed = narrowSchema(node, 'datetime')

        expect(node.type).toBe('datetime')
        expect(narrowed?.offset).toBe(false)
      })

      it('dateType: string returns datetime with offset: false', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } }, { dateType: 'string' })
        const narrowed = narrowSchema(node, 'datetime')

        expect(node.type).toBe('datetime')
        expect(narrowed?.offset).toBe(false)
      })

      it('dateType: stringOffset returns datetime with offset: true', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } }, { dateType: 'stringOffset' })
        const narrowed = narrowSchema(node, 'datetime')

        expect(node.type).toBe('datetime')
        expect(narrowed?.offset).toBe(true)
      })

      it('dateType: stringLocal returns datetime with local: true', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } }, { dateType: 'stringLocal' })
        const narrowed = narrowSchema(node, 'datetime')

        expect(node.type).toBe('datetime')
        expect(narrowed?.local).toBe(true)
      })

      it('dateType: date returns date with representation: date', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } }, { dateType: 'date' })
        const narrowed = narrowSchema(node, 'date')

        expect(node.type).toBe('date')
        expect(narrowed?.representation).toBe('date')
      })

      it('dateType: false falls through to string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date-time' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })

    describe('format date', () => {
      it('defaults to date with representation: string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date' } })
        const narrowed = narrowSchema(node, 'date')

        expect(node.type).toBe('date')
        expect(narrowed?.representation).toBe('string')
      })

      it('dateType: date returns date with representation: date', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date' } }, { dateType: 'date' })
        const narrowed = narrowSchema(node, 'date')

        expect(node.type).toBe('date')
        expect(narrowed?.representation).toBe('date')
      })

      it('dateType: string returns date with representation: string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date' } }, { dateType: 'string' })
        const narrowed = narrowSchema(node, 'date')

        expect(node.type).toBe('date')
        expect(narrowed?.representation).toBe('string')
      })

      it('dateType: false falls through to string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'date' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })

    describe('format time', () => {
      it('defaults to time with representation: string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'time' } })
        const narrowed = narrowSchema(node, 'time')

        expect(node.type).toBe('time')
        expect(narrowed?.representation).toBe('string')
      })

      it('dateType: date returns time with representation: date', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'time' } }, { dateType: 'date' })
        const narrowed = narrowSchema(node, 'time')

        expect(node.type).toBe('time')
        expect(narrowed?.representation).toBe('date')
      })

      it('dateType: string returns time with representation: string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'time' } }, { dateType: 'string' })
        const narrowed = narrowSchema(node, 'time')

        expect(node.type).toBe('time')
        expect(narrowed?.representation).toBe('string')
      })

      it('dateType: false falls through to string', () => {
        const ctx = { document: emptyDocument }
        const node = parseSchema(ctx, { schema: { type: 'string', format: 'time' } }, { dateType: false })

        expect(node.type).toBe('string')
      })
    })
  })
})

describe('parseSchema not keyword', () => {
  const ctx = { document: emptyDocument }

  it('falls through to the emptySchemaType (any by default) since "not" is not supported', () => {
    // JSON Schema `not` has no direct equivalent in most code generators.
    // The parser intentionally does not handle it and falls through to the configured emptySchemaType.
    // Cast required: `not` is valid JSON Schema / OAS 3.1 but not in the TS SchemaObject type.
    const node = parseSchema(ctx, { schema: { not: { type: 'string' } } as SchemaObject })

    expect(node.type).toBe('any')
  })

  it('respects emptySchemaType option when falling through for not keyword', () => {
    // Cast required: `not` is valid JSON Schema / OAS 3.1 but not in the TS SchemaObject type.
    const node = parseSchema(ctx, { schema: { not: { type: 'string' } } as SchemaObject }, { emptySchemaType: 'unknown' })

    expect(node.type).toBe('unknown')
  })
})

describe('parseSchema discriminator on union (oneOf/anyOf)', () => {
  const ctx = { document: emptyDocument }

  it('sets discriminatorPropertyName on union node from oneOf discriminator', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        discriminator: { propertyName: 'petType' },
      },
    })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(narrowed?.discriminatorPropertyName).toBe('petType')
  })

  it('sets discriminatorPropertyName on union node from anyOf discriminator', () => {
    const node = parseSchema(ctx, {
      schema: {
        anyOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        discriminator: { propertyName: 'kind' },
      },
    })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(narrowed?.discriminatorPropertyName).toBe('kind')
  })

  it('does not set discriminatorPropertyName when no discriminator is present', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
      },
    })
    const narrowed = narrowSchema(node, 'union')

    expect(node.type).toBe('union')
    expect(narrowed?.discriminatorPropertyName).toBeUndefined()
  })

  it('narrows the discriminator property to a single value per union member when a mapping is present', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
        properties: {
          type: { type: 'string', enum: ['dog', 'cat'], readOnly: true },
          name: { type: 'string' },
        },
        required: ['type', 'name'],
      },
    })

    expect(node.type).toBe('intersection')
    const topIntersection = narrowSchema(node, 'intersection')!
    const unionNode = narrowSchema(topIntersection.members?.[0], 'union')!
    const sharedPropertiesNode = narrowSchema(topIntersection.members?.[1], 'object')
    const sharedTypeProp = sharedPropertiesNode?.properties?.find((p) => p.name === 'type')

    expect(narrowSchema(sharedTypeProp?.schema, 'enum')?.enumValues).toEqual(['dog', 'cat'])

    const { members } = unionNode

    // Dog member: intersection of Dog ref + synthetic discriminant object { type: 'dog' }
    const dogIntersection = narrowSchema(members![0], 'intersection')
    const dogDiscNode = narrowSchema(dogIntersection!.members![1], 'object')
    const dogTypeProp = dogDiscNode?.properties?.find((p) => p.name === 'type')
    expect(dogTypeProp?.schema.readOnly).toBe(true)
    expect(narrowSchema(dogTypeProp?.schema, 'enum')?.enumValues).toEqual(['dog'])

    // Cat member: intersection of Cat ref + synthetic discriminant object { type: 'cat' }
    const catIntersection = narrowSchema(members![1], 'intersection')
    const catDiscNode = narrowSchema(catIntersection!.members![1], 'object')
    const catTypeProp = catDiscNode?.properties?.find((p) => p.name === 'type')
    expect(catTypeProp?.schema.readOnly).toBe(true)
    expect(narrowSchema(catTypeProp?.schema, 'enum')?.enumValues).toEqual(['cat'])
  })

  it('gives enum sibling properties a name derived from the union schema name', () => {
    const node = parseSchema(ctx, {
      name: 'Pet',
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
        properties: {
          type: { type: 'string', enum: ['dog', 'cat'], readOnly: true },
          status: { type: 'string', enum: ['available', 'pending', 'sold'] },
        },
        required: ['type'],
      },
    })

    expect(node.type).toBe('intersection')
    const topIntersection = narrowSchema(node, 'intersection')!
    const sharedPropertiesNode = narrowSchema(topIntersection.members?.[1], 'object')
    const statusProp = sharedPropertiesNode?.properties?.find((p) => p.name === 'status')
    // The enum schema should carry a name derived from the parent union name
    expect(statusProp?.schema.name).toBe('PetStatusEnum')
  })
})

describe('parseSchema discriminator on union without sibling properties', () => {
  const ctx = { document: emptyDocument }

  it('embeds the discriminant value into each union member as an intersection when mapping is present', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
      },
    })

    expect(node.type).toBe('union')
    const { members } = narrowSchema(node, 'union')!

    // Dog member: intersection of Dog ref + { type: 'dog' }
    const dogIntersection = narrowSchema(members![0], 'intersection')
    expect(dogIntersection).toBeDefined()
    const dogDiscNode = narrowSchema(dogIntersection!.members![1], 'object')
    const dogTypeProp = dogDiscNode?.properties?.find((p) => p.name === 'type')
    expect(narrowSchema(dogTypeProp?.schema, 'enum')?.enumValues).toEqual(['dog'])

    // Cat member: intersection of Cat ref + { type: 'cat' }
    const catIntersection = narrowSchema(members![1], 'intersection')
    expect(catIntersection).toBeDefined()
    const catDiscNode = narrowSchema(catIntersection!.members![1], 'object')
    const catTypeProp = catDiscNode?.properties?.find((p) => p.name === 'type')
    expect(narrowSchema(catTypeProp?.schema, 'enum')?.enumValues).toEqual(['cat'])
  })

  it('leaves members without a mapping entry as plain refs', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { type: 'string' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
          },
        },
      },
    })

    const { members } = narrowSchema(node, 'union')!
    // Dog is in the mapping → wrapped in an intersection
    expect(members![0]?.type).toBe('intersection')
    // String literal has no mapping entry → left as-is
    expect(members![1]?.type).toBe('string')
  })

  it('produces a plain union when no discriminator mapping is present', () => {
    const node = parseSchema(ctx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: { propertyName: 'type' },
      },
    })

    expect(node.type).toBe('union')
    const { members } = narrowSchema(node, 'union')!
    // No mapping → no intersection wrapping
    expect(members!.every((m) => m.type !== 'intersection')).toBe(true)
  })
})

describe('parseSchema circular allOf discriminator detection', () => {
  it('skips allOf member that references the child schema back through its discriminator parent', async () => {
    // This models the OAS pattern: Animal (parent, discriminator) → Cat (child, allOf: [Animal])
    // The parser must skip the back-reference to Animal from Cat's allOf to avoid circular types.
    const oas = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'Circular', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: '#/components/schemas/Cat' }],
            discriminator: { propertyName: 'type' },
          },
          Cat: {
            allOf: [
              { $ref: '#/components/schemas/Animal' },
              { type: 'object', required: ['type'], properties: { type: { type: 'string' }, name: { type: 'string' } } },
            ],
          },
        },
      },
    })

    const root = parseOas(oas).root
    const cat = root.schemas.find((s) => s.name === 'Cat')

    expect(cat).toBeDefined()
    expect(cat!.type).toBe('intersection')
    // The intersection should contain only the concrete Cat properties — Animal is filtered out.
    const members = narrowSchema(cat, 'intersection')?.members ?? []
    expect(members.length).toBeGreaterThan(0)
    expect(members.some((m) => m.type === 'ref' && m.name === 'Animal')).toBe(false)
  })

  it('injects the narrowed discriminant value when the discriminator parent is filtered from allOf', async () => {
    // Cat is identified as 'cat' in Animal's mapping; the Animal $ref is skipped to prevent
    // circularity, but { type: 'cat' } must be injected into Cat's intersection.
    const oas = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'DiscriminantInjection', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            discriminator: {
              propertyName: 'type',
              mapping: {
                cat: '#/components/schemas/Cat',
                dog: '#/components/schemas/Dog',
              },
            },
          },
          Cat: {
            allOf: [{ $ref: '#/components/schemas/Animal' }, { type: 'object', properties: { name: { type: 'string' } } }],
          },
          Dog: {
            allOf: [{ $ref: '#/components/schemas/Animal' }, { type: 'object', properties: { breed: { type: 'string' } } }],
          },
        },
      },
    })

    const root = parseOas(oas).root

    const cat = root.schemas.find((s) => s.name === 'Cat')
    expect(cat?.type).toBe('intersection')
    const catMembers = narrowSchema(cat, 'intersection')?.members ?? []
    // A synthetic { type: 'cat' } object must be present in Cat's intersection members.
    const catDiscNode = catMembers.find((m) => {
      const obj = narrowSchema(m, 'object')
      return obj?.properties?.some((p) => p.name === 'type' && narrowSchema(p.schema, 'enum')?.enumValues?.[0] === 'cat')
    })
    expect(catDiscNode).toBeDefined()

    const dog = root.schemas.find((s) => s.name === 'Dog')
    expect(dog?.type).toBe('intersection')
    const dogMembers = narrowSchema(dog, 'intersection')?.members ?? []
    const dogDiscNode = dogMembers.find((m) => {
      const obj = narrowSchema(m, 'object')
      return obj?.properties?.some((p) => p.name === 'type' && narrowSchema(p.schema, 'enum')?.enumValues?.[0] === 'dog')
    })
    expect(dogDiscNode).toBeDefined()
  })
})

describe('buildAst', async () => {
  const oas = await buildMinimalOas()
  const root = parseOas(oas).root

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

    it('getPetById is a GET on /pets/:petId with a path parameter', () => {
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
      const props = narrowSchema(schema, 'object')?.properties ?? []
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
      const members = narrowSchema(schema, 'union')?.members ?? []
      expect(members.length).toBe(2)
    })

    it('FullPet is an intersection', () => {
      const schema = root.schemas.find((s) => s.name === 'FullPet')
      expect(schema).toBeDefined()
      expect(schema!.type).toBe('intersection')
    })
  })
})

describe('buildAst – header and cookie parameters', async () => {
  const oas = await parseDocument({
    openapi: '3.0.3',
    info: { title: 'Params', version: '1.0.0' },
    paths: {
      '/items': {
        get: {
          operationId: 'getItems',
          description: 'Fetch a list of items',
          parameters: [
            {
              name: 'X-Request-ID',
              in: 'header',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'session',
              in: 'cookie',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
    },
  })

  const root = parseOas(oas).root
  const getItems = root.operations.find((o) => o.operationId === 'getItems')

  it('parses operation description', () => {
    expect(getItems?.description).toBe('Fetch a list of items')
  })

  it('converts header parameters with in: header', () => {
    const header = getItems?.parameters.find((p) => p.name === 'X-Request-ID')

    expect(header).toBeDefined()
    expect(header!.in).toBe('header')
    expect(header!.required).toBe(true)
    expect(header!.schema.type).toBe('uuid')
  })

  it('converts cookie parameters with in: cookie', () => {
    const cookie = getItems?.parameters.find((p) => p.name === 'session')

    expect(cookie).toBeDefined()
    expect(cookie!.in).toBe('cookie')
    expect(cookie!.required).toBe(false)
    expect(cookie!.schema.type).toBe('string')
  })

  it('includes all four parameter locations in the same operation', () => {
    const locations = getItems?.parameters.map((p) => p.in) ?? []

    expect(locations).toContain('header')
    expect(locations).toContain('cookie')
    expect(locations).toContain('query')
  })
})

describe('buildAst – parameter description propagation', async () => {
  const oas = await parseDocument({
    openapi: '3.0.3',
    info: { title: 'Params', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of results to return',
              required: false,
              schema: { type: 'integer' },
            },
            {
              name: 'petId',
              in: 'path',
              description: 'The id of the pet to retrieve',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
    },
  })

  const root = parseOas(oas).root
  const listPets = root.operations.find((o) => o.operationId === 'listPets')

  it('propagates parameter-level description to schema.description for query params', () => {
    const limit = listPets?.parameters.find((p) => p.name === 'limit')

    expect(limit?.schema.description).toBe('Maximum number of results to return')
  })

  it('propagates parameter-level description to schema.description for path params', () => {
    const petId = listPets?.parameters.find((p) => p.name === 'petId')

    expect(petId?.schema.description).toBe('The id of the pet to retrieve')
  })

  it('prefers parameter-level description over schema-level description', async () => {
    const oasWithBoth = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/items': {
          get: {
            operationId: 'getItems',
            parameters: [
              {
                name: 'q',
                in: 'query',
                description: 'Parameter description',
                required: false,
                schema: { type: 'string', description: 'Schema description' },
              },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
    const root2 = parseOas(oasWithBoth).root
    const getItems = root2.operations.find((o) => o.operationId === 'getItems')
    const q = getItems?.parameters.find((p) => p.name === 'q')

    expect(q?.schema.description).toBe('Parameter description')
  })
})

describe('unknownType / emptySchemaType → SchemaNode type', () => {
  const ctx = { document: emptyDocument }

  it('empty schema produces type: any by default', () => {
    const node = parseSchema(ctx, { schema: {} as SchemaObject })

    expect(node.type).toBe('any')
  })

  it('empty schema produces type: unknown when emptySchemaType is unknown', () => {
    const node = parseSchema(ctx, { schema: {} as SchemaObject }, { emptySchemaType: 'unknown' })

    expect(node.type).toBe('unknown')
  })

  it('empty schema produces type: void when emptySchemaType is void', () => {
    const node = parseSchema(ctx, { schema: {} as SchemaObject }, { emptySchemaType: 'void' })

    expect(node.type).toBe('void')
  })

  it('unannotated additionalProperties produce type: any by default', () => {
    const node = narrowSchema(parseSchema(ctx, { schema: { type: 'object', additionalProperties: {} } as SchemaObject }), 'object')

    expect(node?.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('unannotated additionalProperties produce type: unknown when unknownType is unknown', () => {
    const node = narrowSchema(parseSchema(ctx, { schema: { type: 'object', additionalProperties: {} } as SchemaObject }, { unknownType: 'unknown' }), 'object')

    expect(node?.additionalProperties).toMatchObject({ type: 'unknown' })
  })
})

describe('parameter enum naming', () => {
  it('parameter enum schemas are unnamed at the parser level (naming happens in plugin)', async () => {
    const oas = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [
              {
                name: 'status',
                in: 'query',
                required: false,
                schema: { type: 'string', default: 'available', enum: ['available', 'pending', 'sold'] },
              },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
    const root = parseOas(oas).root
    const op = root.operations.find((o) => o.operationId === 'listPets')
    const statusParam = op?.parameters.find((p) => p.name === 'status')
    const enumNode = narrowSchema(statusParam?.schema, 'enum')

    // Parser does not assign names to parameter enums — that's the plugin's job
    expect(enumNode?.name).toBeUndefined()
    expect(enumNode?.enumValues).toEqual(['available', 'pending', 'sold'])
    expect(enumNode?.default).toBe('available')
  })
})

describe('enum naming', () => {
  it('enum name accumulates full parent path without collision suffix', () => {
    const ctx = { document: emptyDocument }

    const orderNode = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            params: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['active', 'inactive'] },
              },
            },
          },
        },
        name: 'Order',
      },
      { enumSuffix: 'enum' },
    )
    const customerNode = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            params: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['new', 'returning'] },
              },
            },
          },
        },
        name: 'Customer',
      },
      { enumSuffix: 'enum' },
    )

    const orderEnum = narrowSchema(
      narrowSchema(narrowSchema(orderNode, 'object')?.properties?.find((p) => p.name === 'params')?.schema, 'object')?.properties?.find(
        (p) => p.name === 'status',
      )?.schema,
      'enum',
    )
    const customerEnum = narrowSchema(
      narrowSchema(narrowSchema(customerNode, 'object')?.properties?.find((p) => p.name === 'params')?.schema, 'object')?.properties?.find(
        (p) => p.name === 'status',
      )?.schema,
      'enum',
    )

    // Full path means no collision
    expect(orderEnum?.name).toBe('OrderParamsStatusEnum')
    expect(customerEnum?.name).toBe('CustomerParamsStatusEnum')
  })

  it('oneOf shared property enums include schema name', () => {
    const ctx = { document: emptyDocument }

    const node = parseSchema(
      ctx,
      {
        schema: {
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
          oneOf: [
            { type: 'object', properties: { role: { type: 'string' } } },
            { type: 'object', properties: { dept: { type: 'string' } } },
          ],
        },
        name: 'Pet',
      },
      { enumSuffix: 'enum' },
    )

    const topIntersection = narrowSchema(node, 'intersection')
    const sharedObj = topIntersection?.members?.find((m) => narrowSchema(m, 'object')?.properties?.some((p) => p.name === 'status'))
    const statusProp = narrowSchema(sharedObj, 'object')?.properties?.find((p) => p.name === 'status')
    const enumNode = narrowSchema(statusProp?.schema, 'enum')

    // Non-legacy: name includes schema name
    expect(enumNode?.name).toBe('PetStatusEnum')
  })

  it('array items enum includes the parent schema name', () => {
    const ctx = { document: emptyDocument }

    const node = parseSchema(
      ctx,
      {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string', enum: ['a', 'b', 'c'] },
            },
          },
        },
        name: 'Item',
      },
      { enumSuffix: 'enum' },
    )
    const narrowed = narrowSchema(node, 'object')

    const tagsProp = narrowed?.properties?.find((p) => p.name === 'tags')
    const arrayNode = narrowSchema(tagsProp?.schema, 'array')
    const enumNode = narrowSchema(arrayNode?.items?.[0], 'enum')

    expect(enumNode?.name).toBe('ItemTagsEnum')
  })
})
