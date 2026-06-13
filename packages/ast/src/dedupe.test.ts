import { describe, expect, it } from 'vitest'
import { applyDedupe, buildDedupePlan } from './dedupe.ts'
import { createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { schemaSignature } from './signature.ts'

function stringEnum(values: Array<string>, extra: Partial<Parameters<typeof createSchema>[0]> = {}): SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, ...extra } as Parameters<typeof createSchema>[0])
}

const isCandidate = (node: SchemaNode) => node.type === 'enum' || node.type === 'object'
const nameFor = (node: SchemaNode) => node.name ?? null
const refFor = (name: string) => `#/components/schemas/${name}`

describe('buildDedupePlan', () => {
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

    const plan = buildDedupePlan([pet, order], { isCandidate, nameFor, refFor })

    expect(plan.hoisted).toHaveLength(1)
    expect(plan.hoisted[0]).toMatchObject({ enumValues: ['active', 'inactive'], kind: 'Schema', name: 'PetStatus', primitive: 'string', type: 'enum' })

    const enumSignature = schemaSignature(stringEnum(['active', 'inactive']))
    expect(plan.canonicalBySignature.get(enumSignature)).toStrictEqual({ name: 'PetStatus', ref: '#/components/schemas/PetStatus' })
  })

  it('leaves singletons untouched', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['active'], { name: 'PetStatus' }) })],
    })

    const plan = buildDedupePlan([pet], { isCandidate, nameFor, refFor })

    expect(plan.hoisted).toHaveLength(0)
    expect(plan.canonicalBySignature.size).toBe(0)
  })

  it('reuses an existing top-level name instead of hoisting', () => {
    const cat = createSchema({ type: 'object', name: 'Cat', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })
    const dog = createSchema({ type: 'object', name: 'Dog', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })

    const plan = buildDedupePlan([cat, dog], { isCandidate, nameFor, refFor })

    expect(plan.hoisted).toHaveLength(0)
    const objectSignature = schemaSignature(cat)
    expect(plan.canonicalBySignature.get(objectSignature)).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('records later top-level names with the same content as aliases of the first', () => {
    const cat = createSchema({ type: 'object', name: 'Cat', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })
    const dog = createSchema({ type: 'object', name: 'Dog', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })

    const plan = buildDedupePlan([cat, dog], { isCandidate, nameFor, refFor })

    expect(plan.aliasNames.get('Dog')).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
    expect(plan.aliasNames.has('Cat')).toBe(false)
  })

  it('ignores nodes the candidate predicate rejects', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['a', 'b'], { name: 'PetStatus' }) })],
    })
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'state', schema: stringEnum(['a', 'b'], { name: 'OrderState' }) })],
    })

    // Only objects are candidates here, so the duplicated enum is left alone — and the two
    // objects have distinct shapes, so nothing is deduplicated.
    const plan = buildDedupePlan([pet, order], { isCandidate: (node) => node.type === 'object', nameFor, refFor })

    expect(plan.hoisted).toHaveLength(0)
    expect(plan.canonicalBySignature.size).toBe(0)
  })

  it('honors minOccurrences', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['a', 'b'], { name: 'PetStatus' }) })],
    })
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'state', schema: stringEnum(['a', 'b'], { name: 'OrderState' }) })],
    })

    const plan = buildDedupePlan([pet, order], { isCandidate, nameFor, refFor, minOccurrences: 3 })

    expect(plan.canonicalBySignature.size).toBe(0)
  })
})

describe('applyDedupe', () => {
  const enumNode = stringEnum(['active', 'inactive'], { name: 'PetStatus' })
  const enumSignature = schemaSignature(enumNode)
  const lookups = {
    canonicalBySignature: new Map([[enumSignature, { name: 'PetStatus', ref: '#/components/schemas/PetStatus' }]]),
    aliasNames: new Map<string, { name: string; ref: string }>(),
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

    const result = narrowSchema(applyDedupe(order, lookups), 'object')!
    const stateSchema = result.properties.find((prop) => prop.name === 'state')!.schema

    expect(narrowSchema(stateSchema, 'ref')).toMatchObject({
      kind: 'Schema',
      name: 'PetStatus',
      optional: true,
      ref: '#/components/schemas/PetStatus',
      type: 'ref',
    })
  })

  it('keeps the root when skipRootMatch is set', () => {
    const result = applyDedupe(enumNode, lookups, true)
    expect(result.type).toBe('enum')

    const reffed = applyDedupe(enumNode, lookups)
    expect(reffed.type).toBe('ref')
  })

  it('returns the same reference when nothing matches', () => {
    const node = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })
    expect(applyDedupe(node, lookups)).toBe(node)
  })

  it('repoints a ref to a duplicate top-level schema at the canonical one', () => {
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'pet', schema: createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }) })],
    })
    const aliased = {
      canonicalBySignature: new Map<string, { name: string; ref: string }>(),
      aliasNames: new Map([['Dog', { name: 'Cat', ref: '#/components/schemas/Cat' }]]),
    }

    const result = narrowSchema(applyDedupe(order, aliased), 'object')!
    const petSchema = narrowSchema(result.properties.find((prop) => prop.name === 'pet')?.schema, 'ref')

    expect({ name: petSchema?.name, ref: petSchema?.ref }).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('leaves a ref to the canonical schema untouched', () => {
    const ref = createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })
    const aliased = {
      canonicalBySignature: new Map<string, { name: string; ref: string }>(),
      aliasNames: new Map([['Dog', { name: 'Cat', ref: '#/components/schemas/Cat' }]]),
    }

    expect(applyDedupe(ref, aliased)).toBe(ref)
  })
})
