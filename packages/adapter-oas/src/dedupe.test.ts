import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { apply, type DedupeContext, plan } from './dedupe.ts'

const { createProperty, createSchema } = ast.factory
const { narrowSchema, signatureOf } = ast

type SchemaNode = ast.SchemaNode

function stringEnum(values: Array<string>, extra: Partial<Parameters<typeof createSchema>[0]> = {}): SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, ...extra } as Parameters<typeof createSchema>[0])
}

function context(extra: Partial<DedupeContext> = {}): DedupeContext {
  return { circularSchemas: new Set(), usedNames: new Set(), ...extra }
}

describe('plan', () => {
  it('hoists an inline shape duplicated across schemas', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'status', schema: stringEnum(['active', 'inactive'], { name: 'PetStatus' }) }),
        createProperty({ name: 'id', schema: createSchema({ type: 'string' }) }),
      ],
    })
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'state', schema: stringEnum(['active', 'inactive'], { name: 'OrderState' }) }),
        createProperty({ name: 'total', schema: createSchema({ type: 'number' }) }),
      ],
    })

    const dedupePlan = plan([pet, order], context())

    expect(dedupePlan.extracted).toHaveLength(1)
    expect(dedupePlan.extracted[0]).toMatchObject({ enumValues: ['active', 'inactive'], kind: 'Schema', name: 'PetStatus', primitive: 'string', type: 'enum' })

    const enumSignature = signatureOf(stringEnum(['active', 'inactive']))
    expect(dedupePlan.targetBySignature.get(enumSignature)).toStrictEqual({ name: 'PetStatus', ref: '#/components/schemas/PetStatus' })
  })

  it('leaves singletons untouched', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['active'], { name: 'PetStatus' }) })],
    })

    const dedupePlan = plan([pet], context())

    expect(dedupePlan.extracted).toHaveLength(0)
    expect(dedupePlan.targetBySignature.size).toBe(0)
  })

  it('reuses an existing top-level name instead of extracting', () => {
    const cat = createSchema({ type: 'object', name: 'Cat', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })
    const dog = createSchema({ type: 'object', name: 'Dog', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })

    const dedupePlan = plan([cat, dog], context())

    expect(dedupePlan.extracted).toHaveLength(0)
    const objectSignature = signatureOf(cat)
    expect(dedupePlan.targetBySignature.get(objectSignature)).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('records later top-level names with the same content as aliases of the first', () => {
    const cat = createSchema({ type: 'object', name: 'Cat', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })
    const dog = createSchema({ type: 'object', name: 'Dog', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })

    const dedupePlan = plan([cat, dog], context())

    expect(dedupePlan.targetByName.get('Dog')).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
    expect(dedupePlan.targetByName.has('Cat')).toBe(false)
  })

  it('rejects object shapes that are part of a circular chain', () => {
    // Two structurally identical objects whose name is flagged circular: neither is deduplicated.
    const node = createSchema({
      type: 'object',
      name: 'Tree',
      properties: [createProperty({ name: 'self', schema: createSchema({ type: 'ref', name: 'Tree', ref: '#/components/schemas/Tree' }) })],
    })
    const other = createSchema({
      type: 'object',
      name: 'Tree',
      properties: [createProperty({ name: 'self', schema: createSchema({ type: 'ref', name: 'Tree', ref: '#/components/schemas/Tree' }) })],
    })

    const dedupePlan = plan([node, other], context({ circularSchemas: new Set(['Tree']) }))

    expect(dedupePlan.targetBySignature.size).toBe(0)
    expect(dedupePlan.extracted).toHaveLength(0)
  })

  it('resolves a extracted name against usedNames', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'status', schema: stringEnum(['active', 'inactive'], { name: 'Status' }) }),
        createProperty({ name: 'state', schema: stringEnum(['active', 'inactive'], { name: 'Status' }) }),
      ],
    })

    const dedupePlan = plan([pet], context({ usedNames: new Set(['Status']) }))

    expect(dedupePlan.extracted[0]).toMatchObject({ name: 'Status2' })
  })
})

describe('apply', () => {
  const enumNode = stringEnum(['active', 'inactive'], { name: 'PetStatus' })
  const enumSignature = signatureOf(enumNode)
  const lookups = {
    targetBySignature: new Map([[enumSignature, { name: 'PetStatus', ref: '#/components/schemas/PetStatus' }]]),
    targetByName: new Map<string, { name: string; ref: string }>(),
  }

  it('replaces a duplicated occurrence with a ref and prunes', () => {
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'state', schema: stringEnum(['active', 'inactive']) }),
        createProperty({ name: 'total', schema: createSchema({ type: 'number' }) }),
      ],
    })

    const result = narrowSchema(apply(order, lookups), 'object')!
    const stateSchema = result.properties.find((prop) => prop.name === 'state')!.schema

    expect(narrowSchema(stateSchema, 'ref')).toMatchObject({
      kind: 'Schema',
      name: 'PetStatus',
      ref: '#/components/schemas/PetStatus',
      type: 'ref',
    })
  })

  it('keeps the root when skipRootMatch is set', () => {
    const result = apply(enumNode, lookups, true)
    expect(result.type).toBe('enum')

    const reffed = apply(enumNode, lookups)
    expect(reffed.type).toBe('ref')
  })

  it('returns the same reference when nothing matches', () => {
    const node = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })
    expect(apply(node, lookups)).toBe(node)
  })

  it('repoints a ref to a duplicate top-level schema at the shared one', () => {
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'pet', schema: createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }) })],
    })
    const aliased = {
      targetBySignature: new Map<string, { name: string; ref: string }>(),
      targetByName: new Map([['Dog', { name: 'Cat', ref: '#/components/schemas/Cat' }]]),
    }

    const result = narrowSchema(apply(order, aliased), 'object')!
    const petSchema = narrowSchema(result.properties.find((prop) => prop.name === 'pet')?.schema, 'ref')

    expect({ name: petSchema?.name, ref: petSchema?.ref }).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('leaves a ref to the shared schema untouched', () => {
    const ref = createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })
    const aliased = {
      targetBySignature: new Map<string, { name: string; ref: string }>(),
      targetByName: new Map([['Dog', { name: 'Cat', ref: '#/components/schemas/Cat' }]]),
    }

    expect(apply(ref, aliased)).toBe(ref)
  })
})
