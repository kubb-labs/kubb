import type { ArraySchemaNode, CompositeSchemaNode, EnumSchemaNode, ObjectSchemaNode, RefSchemaNode, ScalarSchemaNode, SchemaNode } from '@internals/ast'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildMinimalOas } from './mocks/index.ts'
import { createOasParser } from './parser.ts'

describe('buildAst', () => {
  it('returns a RootNode', async () => {
    const oas = await buildMinimalOas()
    const root = createOasParser().buildAst(oas)

    expect(root.kind).toBe('Root')
  })

  describe('schemas', () => {
    it('converts named component schemas', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const names = root.schemas.map((s) => s.name)

      expect(names).toContain('Pet')
      expect(names).toContain('NewPet')
      expect(names).toContain('Error')
    })

    it('converts object schema with properties', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const pet = root.schemas.find((s) => s.name === 'Pet') as ObjectSchemaNode | undefined

      expect(pet?.type).toBe('object')
      expect(pet?.properties?.map((p) => p.name)).toEqual(expect.arrayContaining(['id', 'name', 'tag']))
    })

    it('marks required properties', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const pet = root.schemas.find((s) => s.name === 'Pet') as ObjectSchemaNode | undefined
      const idProp = pet?.properties?.find((p) => p.name === 'id')
      const tagProp = pet?.properties?.find((p) => p.name === 'tag')

      expect(idProp?.required).toBe(true)
      expect(tagProp?.required).toBe(false)
    })

    it('converts array schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const list = root.schemas.find((s) => s.name === 'PetList') as ArraySchemaNode | undefined

      expect(list?.type).toBe('array')
      expect(list?.items).toHaveLength(1)
      expect(list?.items?.[0]?.type).toBe('ref')
    })

    it('converts enum schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const status = root.schemas.find((s) => s.name === 'Status') as EnumSchemaNode | undefined

      expect(status?.type).toBe('enum')
      expect(status?.enumValues).toEqual(['active', 'inactive', 'pending'])
    })

    it('converts oneOf to union', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const petOrError = root.schemas.find((s) => s.name === 'PetOrError') as CompositeSchemaNode | undefined

      expect(petOrError?.type).toBe('union')
      expect(petOrError?.members).toHaveLength(2)
    })

    it('converts allOf to intersection', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet') as CompositeSchemaNode | undefined

      expect(fullPet?.type).toBe('intersection')
      expect(fullPet?.members).toHaveLength(2)
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const nullableString = root.schemas.find((s) => s.name === 'NullableString')

      // Should be flattened to 'string' — not an intersection
      expect(nullableString?.type).toBe('string')
      expect(nullableString?.nullable).toBe(true)
      expect(nullableString?.readOnly).toBe(true)
      expect(nullableString?.example).toBe('some-value')
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const nullableRef = root.schemas.find((s) => s.name === 'NullableRef') as RefSchemaNode | undefined

      // Should be flattened to a ref — not an intersection
      expect(nullableRef?.type).toBe('ref')
      expect(nullableRef?.ref).toBe('Pet')
      expect(nullableRef?.nullable).toBe(true)
    })

    it('maps format date-time to datetime SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet') as CompositeSchemaNode | undefined
      // second member is an inline object with createdAt (datetime) and email
      const objectMember = fullPet?.members?.find((m) => m.type === 'object') as ObjectSchemaNode | undefined
      const createdAt = objectMember?.properties?.find((p) => p.name === 'createdAt')

      expect(createdAt?.schema.type).toBe('datetime')
    })

    it('maps format email to email SchemaType', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const fullPet = root.schemas.find((s) => s.name === 'FullPet') as CompositeSchemaNode | undefined
      const objectMember = fullPet?.members?.find((m) => m.type === 'object') as ObjectSchemaNode | undefined
      const email = objectMember?.properties?.find((p) => p.name === 'email')

      expect(email?.schema.type).toBe('email')
    })
  })

  describe('operations', () => {
    it('converts all operations', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)

      expect(root.operations).toHaveLength(3)
    })

    it('sets operationId, method, path, tags', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')

      expect(listPets?.method).toBe('GET')
      expect(listPets?.path).toBe('/pets')
      expect(listPets?.tags).toContain('pets')
      expect(listPets?.summary).toBe('List all pets')
    })

    it('sets deprecated flag', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.deprecated).toBe(true)
    })

    it('uses uppercase HTTP method per RFC 9110', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      for (const op of root.operations) {
        expect(op.method).toBe(op.method.toUpperCase())
      }
    })

    it('converts query parameters', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const limit = listPets?.parameters.find((p) => p.name === 'limit')

      expect(limit?.in).toBe('query')
      expect(limit?.required).toBe(false)
      expect(limit?.schema.type).toBe('integer')
    })

    it('converts path parameters', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const petId = getPet?.parameters.find((p) => p.name === 'petId')

      expect(petId?.in).toBe('path')
      expect(petId?.required).toBe(true)
      expect(petId?.schema.type).toBe('integer')
    })

    it('converts requestBody', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const createPet = root.operations.find((op) => op.operationId === 'createPet')

      expect(createPet?.requestBody).toBeDefined()
      expect(createPet?.requestBody?.type).toBe('ref')
    })

    it('converts responses with statusCode and schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.description).toBe('A list of pets')
      expect(ok?.schema?.type).toBe('ref')
    })

    it('converts responses without a body schema', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const getPet = root.operations.find((op) => op.operationId === 'getPetById')
      const notFound = getPet?.responses.find((r) => r.statusCode === '404')

      expect(notFound?.description).toBe('Not found')
      expect(notFound?.schema).toBeUndefined()
    })

    it('sets mediaType on responses', async () => {
      const oas = await buildMinimalOas()
      const root = createOasParser().buildAst(oas)
      const listPets = root.operations.find((op) => op.operationId === 'listPets')
      const ok = listPets?.responses.find((r) => r.statusCode === '200')

      expect(ok?.mediaType).toBe('application/json')
    })
  })
})

describe('convertSchema return type narrowing', () => {
  const parser = createOasParser()

  it('narrows to RefSchemaNode when $ref is present', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet' })
    expectTypeOf(node).toEqualTypeOf<RefSchemaNode>()
  })

  it('narrows to ObjectSchemaNode when type is object', () => {
    const node = parser.convertSchema({ type: 'object' })
    expectTypeOf(node).toEqualTypeOf<ObjectSchemaNode>()
  })

  it('narrows to ArraySchemaNode when type is array', () => {
    const node = parser.convertSchema({ type: 'array' })
    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('narrows to EnumSchemaNode when enum is present', () => {
    const node = parser.convertSchema({ enum: ['a', 'b'] })
    expectTypeOf(node).toEqualTypeOf<EnumSchemaNode>()
  })

  it('narrows to CompositeSchemaNode when oneOf is present', () => {
    const node = parser.convertSchema({ oneOf: [{ type: 'string' }, { type: 'number' }] })
    expectTypeOf(node).toEqualTypeOf<CompositeSchemaNode>()
  })

  it('narrows to CompositeSchemaNode when anyOf is present', () => {
    const node = parser.convertSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] })
    expectTypeOf(node).toEqualTypeOf<CompositeSchemaNode>()
  })

  it('narrows to ScalarSchemaNode for string type', () => {
    const node = parser.convertSchema({ type: 'string' })
    expectTypeOf(node).toEqualTypeOf<ScalarSchemaNode>()
  })

  it('narrows to ScalarSchemaNode for number type', () => {
    const node = parser.convertSchema({ type: 'number' })
    expectTypeOf(node).toEqualTypeOf<ScalarSchemaNode>()
  })

  it('narrows to ScalarSchemaNode for integer type', () => {
    const node = parser.convertSchema({ type: 'integer' })
    expectTypeOf(node).toEqualTypeOf<ScalarSchemaNode>()
  })

  it('narrows to ScalarSchemaNode for boolean type', () => {
    const node = parser.convertSchema({ type: 'boolean' })
    expectTypeOf(node).toEqualTypeOf<ScalarSchemaNode>()
  })

  it('falls back to SchemaNode for an untyped empty schema', () => {
    const node = parser.convertSchema({})
    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
  })
})

describe('convertSchema readOnly / writeOnly', () => {
  const parser = createOasParser()

  it('sets readOnly: true when marked', () => {
    const node = parser.convertSchema({ type: 'string', readOnly: true })

    expect(node.readOnly).toBe(true)
  })

  it('sets writeOnly: true when marked', () => {
    const node = parser.convertSchema({ type: 'string', writeOnly: true })

    expect(node.writeOnly).toBe(true)
  })

  it('leaves readOnly / writeOnly undefined when not set', () => {
    const node = parser.convertSchema({ type: 'string' })

    expect(node.readOnly).toBeUndefined()
    expect(node.writeOnly).toBeUndefined()
  })

  it('propagates readOnly on object schema', () => {
    const node = parser.convertSchema({ type: 'object', readOnly: true })

    expect(node.readOnly).toBe(true)
  })

  it('propagates writeOnly on array schema', () => {
    const node = parser.convertSchema({ type: 'array', writeOnly: true })

    expect(node.writeOnly).toBe(true)
  })

  it('propagates readOnly on enum schema', () => {
    const node = parser.convertSchema({ enum: ['a', 'b'], readOnly: true })

    expect(node.readOnly).toBe(true)
  })

  it('propagates readOnly on ref schema siblings', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', readOnly: true })

    expect(node.readOnly).toBe(true)
  })

  it('propagates pattern on ref sibling when type is string', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', type: 'string', pattern: '^[a-z]+$' })

    expect(node.pattern).toBe('^[a-z]+$')
  })

  it('drops pattern on ref sibling when type is not string', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', pattern: '^[a-z]+$' })

    expect(node.pattern).toBeUndefined()
  })
})

describe('convertSchema deprecated', () => {
  const parser = createOasParser()

  it('sets deprecated: true when marked', () => {
    const node = parser.convertSchema({ type: 'string', deprecated: true })

    expect(node.deprecated).toBe(true)
  })

  it('leaves deprecated undefined when not set', () => {
    const node = parser.convertSchema({ type: 'string' })

    expect(node.deprecated).toBeUndefined()
  })

  it('propagates deprecated on object schema', () => {
    const node = parser.convertSchema({ type: 'object', deprecated: true })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on array schema', () => {
    const node = parser.convertSchema({ type: 'array', deprecated: true })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on enum schema', () => {
    const node = parser.convertSchema({ enum: ['a', 'b'], deprecated: true })

    expect(node.deprecated).toBe(true)
  })

  it('propagates deprecated on ref schema siblings', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', deprecated: true })

    expect(node.deprecated).toBe(true)
  })
})

describe('convertSchema default', () => {
  const parser = createOasParser()

  it('passes through a normal default value', () => {
    const node = parser.convertSchema({ type: 'string', default: 'hello' })

    expect(node.default).toBe('hello')
  })

  it('passes through a falsy-but-non-null default (0)', () => {
    const node = parser.convertSchema({ type: 'number', default: 0 })

    expect(node.default).toBe(0)
  })

  it('passes through a falsy-but-non-null default (false)', () => {
    const node = parser.convertSchema({ type: 'boolean', default: false })

    expect(node.default).toBe(false)
  })

  it('drops default: null when schema is nullable (defaultNullAndNullable)', () => {
    const node = parser.convertSchema({ type: 'string', nullable: true, default: null })

    expect(node.default).toBeUndefined()
  })

  it('keeps default: null when schema is not nullable', () => {
    const node = parser.convertSchema({ type: 'string', default: null })

    expect(node.default).toBeNull()
  })

  it('drops default: null for nullable enum', () => {
    const node = parser.convertSchema({ enum: ['a', 'b'], nullable: true, default: null })

    expect(node.default).toBeUndefined()
  })

  it('drops default: null for nullable ref sibling', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', nullable: true, default: null })

    expect(node.default).toBeUndefined()
  })
})

describe('convertSchema object properties', () => {
  const parser = createOasParser()

  it('required + not nullable → required: true, optional/nullish undefined', () => {
    const node = parser.convertSchema({
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'integer' } },
    }) as ObjectSchemaNode
    const prop = node.properties?.find((p) => p.name === 'id')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + not nullable → optional: true', () => {
    const node = parser.convertSchema({
      type: 'object',
      properties: { tag: { type: 'string' } },
    }) as ObjectSchemaNode
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.optional).toBe(true)
    expect(prop?.schema.nullish).toBeUndefined()
    expect(prop?.schema.nullable).toBeUndefined()
  })

  it('not required + nullable → nullish: true', () => {
    const node = parser.convertSchema({
      type: 'object',
      properties: { tag: { type: 'string', nullable: true } },
    }) as ObjectSchemaNode
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(false)
    expect(prop?.schema.nullish).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullable).toBe(true)
  })

  it('required + nullable → nullable: true, optional/nullish undefined', () => {
    const node = parser.convertSchema({
      type: 'object',
      required: ['tag'],
      properties: { tag: { type: 'string', nullable: true } },
    }) as ObjectSchemaNode
    const prop = node.properties?.find((p) => p.name === 'tag')

    expect(prop?.required).toBe(true)
    expect(prop?.schema.nullable).toBe(true)
    expect(prop?.schema.optional).toBeUndefined()
    expect(prop?.schema.nullish).toBeUndefined()
  })
})

describe('convertSchema nullable', () => {
  const parser = createOasParser()

  it('sets nullable via nullable: true (OAS 3.0)', () => {
    const node = parser.convertSchema({ type: 'string', nullable: true })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via x-nullable: true', () => {
    const node = parser.convertSchema({ type: 'string', 'x-nullable': true } as Parameters<typeof parser.convertSchema>[0])

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via type array including null (OAS 3.1)', () => {
    const node = parser.convertSchema({ type: ['string', 'null'] })

    expect(node.nullable).toBe(true)
  })

  it('sets nullable via null in enum values (OAS 3.0 convention)', () => {
    const node = parser.convertSchema({ enum: ['a', 'b', null] })

    expect(node.nullable).toBe(true)
  })

  it('strips null from enum values when nullable via null in enum', () => {
    const node = parser.convertSchema({ enum: ['a', 'b', null] }) as EnumSchemaNode

    expect(node.enumValues).toEqual(['a', 'b'])
  })

  it('does not set nullable when not specified', () => {
    const node = parser.convertSchema({ type: 'string' })

    expect(node.nullable).toBeUndefined()
  })

  it('propagates nullable from object schema', () => {
    const node = parser.convertSchema({ type: 'object', nullable: true })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from array schema', () => {
    const node = parser.convertSchema({ type: 'array', nullable: true })

    expect(node.nullable).toBe(true)
  })

  it('propagates nullable from ref schema siblings', () => {
    const node = parser.convertSchema({ $ref: '#/components/schemas/Pet', nullable: true })

    expect(node.nullable).toBe(true)
  })
})

describe('convertSchema constraints', () => {
  const parser = createOasParser()

  describe('array: minItems / maxItems', () => {
    it('maps minItems to min', () => {
      const node = parser.convertSchema({ type: 'array', minItems: 2 })

      expect(node.min).toBe(2)
    })

    it('maps maxItems to max', () => {
      const node = parser.convertSchema({ type: 'array', maxItems: 10 })

      expect(node.max).toBe(10)
    })

    it('maps both minItems and maxItems', () => {
      const node = parser.convertSchema({ type: 'array', minItems: 1, maxItems: 5 })

      expect(node.min).toBe(1)
      expect(node.max).toBe(5)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ type: 'array' })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('string: minLength / maxLength', () => {
    it('maps minLength to min', () => {
      const node = parser.convertSchema({ type: 'string', minLength: 3 })

      expect(node.min).toBe(3)
    })

    it('maps maxLength to max', () => {
      const node = parser.convertSchema({ type: 'string', maxLength: 255 })

      expect(node.max).toBe(255)
    })

    it('maps both minLength and maxLength', () => {
      const node = parser.convertSchema({ type: 'string', minLength: 1, maxLength: 100 })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ type: 'string' })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('number: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parser.convertSchema({ type: 'number', minimum: 0 })

      expect(node.min).toBe(0)
    })

    it('maps maximum to max', () => {
      const node = parser.convertSchema({ type: 'number', maximum: 999 })
      expect(node.max).toBe(999)
    })

    it('maps both minimum and maximum', () => {
      const node = parser.convertSchema({ type: 'number', minimum: 1, maximum: 100 })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parser.convertSchema({ type: 'number', exclusiveMinimum: 0 })

      expect(node.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parser.convertSchema({ type: 'number', exclusiveMaximum: 100 })

      expect(node.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parser.convertSchema({ type: 'number', exclusiveMinimum: true })

      expect(node.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ type: 'number' })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })

  describe('integer: minimum / maximum', () => {
    it('maps minimum to min', () => {
      const node = parser.convertSchema({ type: 'integer', minimum: 1 })

      expect(node.min).toBe(1)
    })

    it('maps maximum to max', () => {
      const node = parser.convertSchema({ type: 'integer', maximum: 100 })

      expect(node.max).toBe(100)
    })

    it('maps both minimum and maximum', () => {
      const node = parser.convertSchema({ type: 'integer', minimum: 1, maximum: 100 })

      expect(node.min).toBe(1)
      expect(node.max).toBe(100)
    })

    it('maps numeric exclusiveMinimum', () => {
      const node = parser.convertSchema({ type: 'integer', exclusiveMinimum: 0 })

      expect(node.exclusiveMinimum).toBe(0)
    })

    it('maps numeric exclusiveMaximum', () => {
      const node = parser.convertSchema({ type: 'integer', exclusiveMaximum: 100 })

      expect(node.exclusiveMaximum).toBe(100)
    })

    it('ignores boolean exclusiveMinimum (OAS 3.0 style)', () => {
      const node = parser.convertSchema({ type: 'integer', exclusiveMinimum: true })

      expect(node.exclusiveMinimum).toBeUndefined()
    })

    it('leaves min/max undefined when not set', () => {
      const node = parser.convertSchema({ type: 'integer' })

      expect(node.min).toBeUndefined()
      expect(node.max).toBeUndefined()
    })
  })
})

describe('createOasParser options', () => {
  describe('emptySchemaType', () => {
    it('defaults to unknown for a schema with no type information', () => {
      const parser = createOasParser()
      const node = parser.convertSchema({})

      expect(node.type).toBe('unknown')
    })

    it('emptySchemaType: any returns any for an empty schema', () => {
      const parser = createOasParser({ emptySchemaType: 'any' })
      const node = parser.convertSchema({})

      expect(node.type).toBe('any')
    })

    it('emptySchemaType: void returns void for an empty schema', () => {
      const parser = createOasParser({ emptySchemaType: 'void' })
      const node = parser.convertSchema({})

      expect(node.type).toBe('void')
    })

    it('emptySchemaType: unknown returns unknown for an empty schema', () => {
      const parser = createOasParser({ emptySchemaType: 'unknown' })
      const node = parser.convertSchema({})

      expect(node.type).toBe('unknown')
    })

    it('emptySchemaType does not affect typed schemas', () => {
      const parser = createOasParser({ emptySchemaType: 'any' })
      const node = parser.convertSchema({ type: 'string' })

      expect(node.type).toBe('string')
    })
  })
})

describe('buildAst snapshots', async () => {
  const oas = await buildMinimalOas()
  const root = createOasParser().buildAst(oas)

  it('full RootNode', () => {
    expect(root).toMatchSnapshot()
  })

  it.each([{ operationId: 'listPets' }, { operationId: 'createPet' }, { operationId: 'getPetById' }])('operation $operationId', ({ operationId }) => {
    const op = root.operations.find((o) => o.operationId === operationId)
    expect(op).toMatchSnapshot()
  })

  it.each([
    { name: 'Pet', label: 'object with required props' },
    { name: 'PetList', label: 'array of refs' },
    { name: 'Status', label: 'enum' },
    { name: 'PetOrError', label: 'oneOf / union' },
    { name: 'FullPet', label: 'allOf / intersection with format fields' },
  ])('schema $name ($label)', ({ name }) => {
    const schema = root.schemas.find((s) => s.name === name)
    expect(schema).toMatchSnapshot()
  })
})
