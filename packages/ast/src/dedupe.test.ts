import { describe, expect, it } from 'vitest'
import { applyDedupe, buildDedupePlan, isSchemaEqual, schemaSignature } from './dedupe.ts'
import { createProperty, createSchema } from './factory.ts'
import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/schema.ts'

function stringEnum(values: Array<string>, extra: Partial<Parameters<typeof createSchema>[0]> = {}): SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, ...extra } as Parameters<typeof createSchema>[0])
}

const isCandidate = (node: SchemaNode) => node.type === 'enum' || node.type === 'object'
const nameFor = (node: SchemaNode) => node.name ?? null
const refFor = (name: string) => `#/components/schemas/${name}`

describe('schemaSignature', () => {
  it('ignores documentation and usage-slot fields', () => {
    const a = stringEnum(['a', 'b'], { description: 'one', example: 'a', deprecated: true, optional: true })
    const b = stringEnum(['a', 'b'], { title: 'two' })

    expect(schemaSignature(a)).toBe(schemaSignature(b))
    expect(isSchemaEqual(a, b)).toBe(true)
  })

  it('distinguishes by enum values', () => {
    expect(isSchemaEqual(stringEnum(['a', 'b']), stringEnum(['a', 'c']))).toBe(false)
  })

  it('distinguishes by nullable', () => {
    expect(isSchemaEqual(stringEnum(['a']), stringEnum(['a'], { nullable: true }))).toBe(false)
  })

  it('distinguishes objects by property name and required', () => {
    const base = createSchema({ type: 'object', properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'string' }) })] })
    const renamed = createSchema({ type: 'object', properties: [createProperty({ name: 'key', required: true, schema: createSchema({ type: 'string' }) })] })

    expect(isSchemaEqual(base, renamed)).toBe(false)
  })
})

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
    expect(plan.hoisted[0]!.name).toBe('PetStatus')
    expect(plan.hoisted[0]!.type).toBe('enum')

    const enumSignature = schemaSignature(stringEnum(['active', 'inactive']))
    expect(plan.canonicalBySignature.get(enumSignature)).toEqual({ name: 'PetStatus', ref: '#/components/schemas/PetStatus' })
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
    expect(plan.canonicalBySignature.get(objectSignature)).toEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('respects skip', () => {
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

    const plan = buildDedupePlan([pet, order], { isCandidate, nameFor, refFor, skip: (node) => node.type === 'enum' })

    expect(plan.hoisted).toHaveLength(0)
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
  const canonicalBySignature = new Map([[enumSignature, { name: 'PetStatus', ref: '#/components/schemas/PetStatus' }]])

  it('replaces a duplicated occurrence with a ref and prunes', () => {
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'state', schema: stringEnum(['active', 'inactive']) }),
        createProperty({ name: 'total', schema: createSchema({ type: 'number' }) }),
      ],
    })

    const result = narrowSchema(applyDedupe(order, canonicalBySignature), 'object')!
    const stateSchema = result.properties.find((prop) => prop.name === 'state')!.schema
    const ref = narrowSchema(stateSchema, 'ref')

    expect(ref?.name).toBe('PetStatus')
    expect(ref?.ref).toBe('#/components/schemas/PetStatus')
  })

  it('keeps the root when skipRootMatch is set', () => {
    const result = applyDedupe(enumNode, canonicalBySignature, true)
    expect(result.type).toBe('enum')

    const reffed = applyDedupe(enumNode, canonicalBySignature)
    expect(reffed.type).toBe('ref')
  })

  it('returns the same reference when nothing matches', () => {
    const node = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })
    expect(applyDedupe(node, canonicalBySignature)).toBe(node)
  })
})
