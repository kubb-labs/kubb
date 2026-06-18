import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { type DedupeContext, plan } from './dedupe.ts'

const { createProperty, createSchema } = ast.factory
const { narrowSchema } = ast

type SchemaNode = ast.SchemaNode

function stringEnum(values: Array<string>, extra: Partial<Parameters<typeof createSchema>[0]> = {}): SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, ...extra } as Parameters<typeof createSchema>[0])
}

function context(extra: Partial<DedupeContext> = {}): DedupeContext {
  return { circularSchemas: new Set(), ...extra }
}

/**
 * A plan with a top-level `Status` enum and an inline copy of the same shape inside `Pet`, so the
 * inline copy collapses into a ref at the named `Status`.
 */
function namedEnumPlan() {
  const status = stringEnum(['active', 'inactive'], { name: 'Status' })
  const pet = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [createProperty({ name: 'status', schema: stringEnum(['active', 'inactive'], { name: 'PetStatus' }) })],
  })

  return { status, pet, dedupePlan: plan([status, pet], context()) }
}

/**
 * A plan where `Dog` duplicates `Cat`, so `Cat` is the shared target and `Dog` an alias.
 */
function catDogPlan() {
  const cat = createSchema({ type: 'object', name: 'Cat', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })
  const dog = createSchema({ type: 'object', name: 'Dog', properties: [createProperty({ name: 'sound', schema: createSchema({ type: 'string' }) })] })

  return { cat, dog, dedupePlan: plan([cat, dog], context()) }
}

describe('plan', () => {
  it('collapses an inline copy into the named component it matches', () => {
    const { pet, dedupePlan } = namedEnumPlan()

    const applied = narrowSchema(dedupePlan.apply(pet), 'object')!
    const statusSchema = applied.properties.find((prop) => prop.name === 'status')!.schema
    expect(narrowSchema(statusSchema, 'ref')).toMatchObject({ name: 'Status', ref: '#/components/schemas/Status', type: 'ref' })
  })

  it('leaves an inline shape inline when no named component matches', () => {
    // The same enum shape appears in two component properties, but no top-level schema names it,
    // so it is not hoisted — each copy stays inline.
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['active', 'inactive'], { name: 'PetStatus' }) })],
    })
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'state', schema: stringEnum(['active', 'inactive'], { name: 'OrderState' }) })],
    })

    const dedupePlan = plan([pet, order], context())

    expect(dedupePlan.apply(order)).toBe(order)
  })

  it('leaves singletons untouched', () => {
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [createProperty({ name: 'status', schema: stringEnum(['active'], { name: 'PetStatus' }) })],
    })

    const dedupePlan = plan([pet], context())

    expect(dedupePlan.apply(pet)).toBe(pet)
  })

  it('reuses an existing top-level name instead of duplicating', () => {
    const { cat, dedupePlan } = catDogPlan()

    expect(dedupePlan.isAlias('Dog')).toBe(true)
    // Cat is the shared target, so it keeps its own object root.
    expect(dedupePlan.applyTopLevel(cat).type).toBe('object')
  })

  it('records later top-level names with the same content as aliases of the first', () => {
    const { dog, dedupePlan } = catDogPlan()

    expect(dedupePlan.isAlias('Dog')).toBe(true)
    expect(dedupePlan.isAlias('Cat')).toBe(false)

    // The duplicate top-level Dog becomes a ref alias to Cat, keeping its own name.
    const aliased = narrowSchema(dedupePlan.applyTopLevel(dog), 'ref')
    expect({ name: aliased?.name, ref: aliased?.ref }).toStrictEqual({ name: 'Dog', ref: '#/components/schemas/Cat' })
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

    expect(dedupePlan.isAlias('Tree')).toBe(false)
    expect(dedupePlan.applyTopLevel(node)).toBe(node)
  })
})

describe('apply', () => {
  it('replaces a duplicated occurrence with a ref and prunes', () => {
    const { dedupePlan } = namedEnumPlan()
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [
        createProperty({ name: 'state', schema: stringEnum(['active', 'inactive']) }),
        createProperty({ name: 'total', schema: createSchema({ type: 'number' }) }),
      ],
    })

    const result = narrowSchema(dedupePlan.apply(order), 'object')!
    const stateSchema = result.properties.find((prop) => prop.name === 'state')!.schema

    expect(narrowSchema(stateSchema, 'ref')).toMatchObject({
      kind: 'Schema',
      name: 'Status',
      ref: '#/components/schemas/Status',
      type: 'ref',
    })
  })

  it('keeps a shared definition root with applyTopLevel but reffs a bare duplicate', () => {
    const { dedupePlan } = namedEnumPlan()
    const enumNode = stringEnum(['active', 'inactive'], { name: 'Status' })

    expect(dedupePlan.applyTopLevel(enumNode).type).toBe('enum')
    expect(dedupePlan.apply(enumNode).type).toBe('ref')
  })

  it('returns the same reference when nothing matches', () => {
    const { dedupePlan } = namedEnumPlan()
    const node = createSchema({ type: 'object', properties: [createProperty({ name: 'id', schema: createSchema({ type: 'string' }) })] })

    expect(dedupePlan.apply(node)).toBe(node)
  })

  it('repoints a ref to a duplicate top-level schema at the shared one', () => {
    const { dedupePlan } = catDogPlan()
    const order = createSchema({
      type: 'object',
      name: 'Order',
      properties: [createProperty({ name: 'pet', schema: createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }) })],
    })

    const result = narrowSchema(dedupePlan.apply(order), 'object')!
    const petSchema = narrowSchema(result.properties.find((prop) => prop.name === 'pet')?.schema, 'ref')

    expect({ name: petSchema?.name, ref: petSchema?.ref }).toStrictEqual({ name: 'Cat', ref: '#/components/schemas/Cat' })
  })

  it('leaves a ref to the shared schema untouched', () => {
    const { dedupePlan } = catDogPlan()
    const ref = createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })

    expect(dedupePlan.apply(ref)).toBe(ref)
  })
})
