import { describe, expect, it } from 'vitest'
import { createRoot, createSchema } from './factory.ts'
import { buildFixture } from './mocks.ts'
import { buildRefMap, extractRefName, refMapToObject, resolveRef } from './refs.ts'

describe('extractRefName', () => {
  it('extracts schema name from component schema refs', () => {
    expect(extractRefName('#/components/schemas/Order')).toBe('Order')
  })

  it('extracts name from component response refs', () => {
    expect(extractRefName('#/components/responses/NotFound')).toBe('NotFound')
  })

  it('falls back to the full string when no slash is present', () => {
    expect(extractRefName('SomeName')).toBe('SomeName')
  })
})

describe('buildRefMap', () => {
  it('indexes all named schemas', () => {
    const map = buildRefMap(buildFixture())

    expect(map.size).toBe(6)
    for (const name of ['Pet', 'NewPet', 'PetList', 'Error', 'PetOrError', 'FullPet']) {
      expect(map.has(name)).toBe(true)
    }
  })

  it('skips unnamed (inline) schemas', () => {
    const root = createRoot({
      schemas: [createSchema({ type: 'object' }), createSchema({ name: 'Named', type: 'string' })],
    })
    const map = buildRefMap(root)

    expect(map.size).toBe(1)
    expect(map.has('Named')).toBe(true)
  })
})

describe('resolveRef', () => {
  it.each([
    { ref: 'Pet' },
    { ref: 'NewPet' },
    { ref: 'PetList' },
    { ref: 'Error' },
    { ref: 'PetOrError' },
    { ref: 'FullPet' },
  ])('resolves $ref to the correct SchemaNode', ({ ref }) => {
    const map = buildRefMap(buildFixture())
    const node = resolveRef(map, ref)

    expect(node?.kind).toBe('Schema')
    expect(node?.name).toBe(ref)
  })

  it('returns undefined for unknown refs', () => {
    const map = buildRefMap(buildFixture())

    expect(resolveRef(map, 'Unknown')).toBeUndefined()
  })
})

describe('refMapToObject', () => {
  it('serializes the full map to a plain object with all named schemas', () => {
    const map = buildRefMap(buildFixture())
    const obj = refMapToObject(map)

    expect(Object.keys(obj).sort()).toEqual(['Error', 'FullPet', 'NewPet', 'Pet', 'PetList', 'PetOrError'])

    expect(obj['Pet']).toEqual({
      kind: 'Schema',
      name: 'Pet',
      type: 'object',
      properties: [
        { kind: 'Property', name: 'id', required: true, schema: { kind: 'Schema', type: 'integer' } },
        { kind: 'Property', name: 'name', required: true, schema: { kind: 'Schema', type: 'string' } },
      ],
    })

    expect(obj['PetList']).toEqual({
      kind: 'Schema',
      name: 'PetList',
      type: 'array',
      items: [{ kind: 'Schema', type: 'ref', ref: 'Pet' }],
    })

    expect(obj['PetOrError']).toEqual({
      kind: 'Schema',
      name: 'PetOrError',
      type: 'union',
      members: [
        { kind: 'Schema', type: 'ref', ref: 'Pet' },
        { kind: 'Schema', type: 'ref', ref: 'Error' },
      ],
    })

    expect(obj['FullPet']).toEqual({
      kind: 'Schema',
      name: 'FullPet',
      type: 'intersection',
      members: [
        { kind: 'Schema', type: 'ref', ref: 'Pet' },
        {
          kind: 'Schema',
          type: 'object',
          properties: [
            { kind: 'Property', name: 'createdAt', required: false, schema: { kind: 'Schema', type: 'datetime', optional: true, nullish: undefined } },
          ],
        },
      ],
    })
  })
})
