import { describe, expect, it } from 'vitest'
import { createInput, createSchema } from './factory.ts'
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
    const input = createInput({
      schemas: [createSchema({ type: 'object' }), createSchema({ name: 'Named', type: 'string' })],
    })
    const map = buildRefMap(input)

    expect(map.size).toBe(1)
    expect(map.has('Named')).toBe(true)
  })
})

describe('resolveRef', () => {
  it.each([{ ref: 'Pet' }, { ref: 'NewPet' }, { ref: 'PetList' }, { ref: 'Error' }, { ref: 'PetOrError' }, { ref: 'FullPet' }])(
    'resolves $ref to the correct SchemaNode',
    ({ ref }) => {
      const map = buildRefMap(buildFixture())
      const node = resolveRef(map, ref)

      expect(node?.kind).toBe('Schema')
      expect(node?.name).toBe(ref)
    },
  )

  it('returns null for unknown refs', () => {
    const map = buildRefMap(buildFixture())

    expect(resolveRef(map, 'Unknown')).toBeNull()
  })
})

describe('refMapToObject', () => {
  it('serializes the full map to a plain object with all named schemas', () => {
    const map = buildRefMap(buildFixture())
    const obj = refMapToObject(map)

    expect(Object.keys(obj).sort()).toStrictEqual(['Error', 'FullPet', 'NewPet', 'Pet', 'PetList', 'PetOrError'])

    expect(obj['Pet']).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "name": "Pet",
        "primitive": "object",
        "properties": [
          {
            "kind": "Property",
            "name": "id",
            "required": true,
            "schema": {
              "kind": "Schema",
              "nullish": undefined,
              "optional": undefined,
              "primitive": "integer",
              "type": "integer",
            },
          },
          {
            "kind": "Property",
            "name": "name",
            "required": true,
            "schema": {
              "kind": "Schema",
              "nullish": undefined,
              "optional": undefined,
              "primitive": "string",
              "type": "string",
            },
          },
        ],
        "type": "object",
      }
    `)

    expect(obj['PetList']).toMatchInlineSnapshot(`
      {
        "items": [
          {
            "kind": "Schema",
            "primitive": undefined,
            "ref": "Pet",
            "type": "ref",
          },
        ],
        "kind": "Schema",
        "name": "PetList",
        "primitive": "array",
        "type": "array",
      }
    `)

    expect(obj['PetOrError']).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "members": [
          {
            "kind": "Schema",
            "primitive": undefined,
            "ref": "Pet",
            "type": "ref",
          },
          {
            "kind": "Schema",
            "primitive": undefined,
            "ref": "Error",
            "type": "ref",
          },
        ],
        "name": "PetOrError",
        "primitive": undefined,
        "type": "union",
      }
    `)

    expect(obj['FullPet']).toMatchInlineSnapshot(`
      {
        "kind": "Schema",
        "members": [
          {
            "kind": "Schema",
            "primitive": undefined,
            "ref": "Pet",
            "type": "ref",
          },
          {
            "kind": "Schema",
            "primitive": "object",
            "properties": [
              {
                "kind": "Property",
                "name": "createdAt",
                "required": false,
                "schema": {
                  "kind": "Schema",
                  "nullish": undefined,
                  "optional": true,
                  "primitive": "string",
                  "type": "datetime",
                },
              },
            ],
            "type": "object",
          },
        ],
        "name": "FullPet",
        "primitive": undefined,
        "type": "intersection",
      }
    `)
  })
})
