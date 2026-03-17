import { createProperty, createSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
import type { SchemaObject } from './oas/types.ts'
import { applyDiscriminatorEnum, extractRefName, getImports, mergeAdjacentAnonymousObjects } from './utils.ts'

describe('extractRefName', () => {
  it('extracts the last path segment from a $ref string', () => {
    expect(extractRefName('#/components/schemas/Order')).toBe('Order')
  })

  it('extracts from response refs', () => {
    expect(extractRefName('#/components/responses/NotFound')).toBe('NotFound')
  })

  it('falls back to the full string when no slash is present', () => {
    expect(extractRefName('SomeName')).toBe('SomeName')
  })
})

describe('applyDiscriminatorEnum', () => {
  const baseSchema: SchemaObject = {
    type: 'object',
    discriminator: {
      propertyName: 'type',
      mapping: {
        dog: '#/components/schemas/Dog',
        cat: '#/components/schemas/Cat',
      },
    },
    properties: {
      type: { type: 'string' },
    },
  } as SchemaObject

  it('returns schema unchanged when there is no discriminator', () => {
    const schema: SchemaObject = { type: 'object', properties: { id: { type: 'string' } } } as SchemaObject

    expect(applyDiscriminatorEnum(schema)).toBe(schema)
  })

  it('returns schema unchanged when discriminator property is not in properties', () => {
    const schema: SchemaObject = {
      type: 'object',
      discriminator: { propertyName: 'kind', mapping: { a: '#/a' } },
      properties: {},
    } as SchemaObject

    expect(applyDiscriminatorEnum(schema)).toBe(schema)
  })

  it('widens enum to all mapping keys when no specificValue', () => {
    const result = applyDiscriminatorEnum(baseSchema)

    expect((result.properties!['type'] as SchemaObject).enum).toEqual(['dog', 'cat'])
    // discriminator key is kept when no specificValue
    expect((result as any).discriminator).toBeDefined()
  })

  it('narrows enum to the single specificValue', () => {
    const result = applyDiscriminatorEnum(baseSchema, 'dog')

    expect((result.properties!['type'] as SchemaObject).enum).toEqual(['dog'])
  })

  it('strips the discriminator key when specificValue is provided', () => {
    const result = applyDiscriminatorEnum(baseSchema, 'cat')

    expect((result as any).discriminator).toBeUndefined()
  })

  it('preserves other properties when narrowing', () => {
    const result = applyDiscriminatorEnum(baseSchema, 'dog')

    expect(result.properties).toHaveProperty('type')
    expect(result.type).toBe('object')
  })
})

describe('mergeAdjacentAnonymousObjects', () => {
  function makeObject(props: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: 'object',
      name,
      properties: props.map((p) => createProperty({ name: p, schema: createSchema({ type: 'string' }) as SchemaNode })),
    }) as SchemaNode
  }

  function makeRef(name: string): SchemaNode {
    return createSchema({ type: 'ref', ref: `#/components/schemas/${name}`, name }) as SchemaNode
  }

  it('returns an empty array unchanged', () => {
    expect(mergeAdjacentAnonymousObjects([])).toEqual([])
  })

  it('passes through a single anonymous object unchanged', () => {
    const node = makeObject(['a'])

    expect(mergeAdjacentAnonymousObjects([node])).toEqual([node])
  })

  it('merges two adjacent anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'])])

    expect(result).toHaveLength(1)
    const merged = result[0] as any
    expect(merged.type).toBe('object')
    expect(merged.properties).toHaveLength(2)
    expect(merged.properties[0].name).toBe('a')
    expect(merged.properties[1].name).toBe('b')
  })

  it('merges three consecutive anonymous objects into one', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b']), makeObject(['c'])])

    expect(result).toHaveLength(1)
    expect((result[0] as any).properties).toHaveLength(3)
  })

  it('does not merge named objects', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a'], 'Foo'), makeObject(['b'], 'Bar')])

    expect(result).toHaveLength(2)
  })

  it('does not merge across a named-object boundary', () => {
    const result = mergeAdjacentAnonymousObjects([makeObject(['a']), makeObject(['b'], 'Named'), makeObject(['c'])])

    expect(result).toHaveLength(3)
  })

  it('does not merge a ref node with an anonymous object', () => {
    const result = mergeAdjacentAnonymousObjects([makeRef('Address'), makeObject(['streetNumber']), makeObject(['streetName'])])

    expect(result).toHaveLength(2)
    // ref stays, the two anon objects merge
    expect(result[0]).toMatchObject({ type: 'ref' })
    expect((result[1] as any).properties).toHaveLength(2)
  })

  it('preserves the name from the base object when merging with anonymous follower', () => {
    const namedFollower = makeObject(['x'], 'SomeModel')
    const anon = makeObject(['y'])
    const result = mergeAdjacentAnonymousObjects([namedFollower, anon])

    // Named object is a boundary — not merged
    expect(result).toHaveLength(2)
  })
})

describe('getImports', () => {
  function makeRefNode(ref: string, name: string): SchemaNode {
    return createSchema({ type: 'ref', ref, name }) as SchemaNode
  }

  function makeStringNode(): SchemaNode {
    return createSchema({ type: 'string' }) as SchemaNode
  }

  const nameMapping = new Map<string, string>()

  it('returns an empty array for a non-ref node', () => {
    const result = getImports({
      node: makeStringNode(),
      nameMapping,
      resolve: () => ({ name: 'Foo', path: './foo.ts' }),
    })
    expect(result).toEqual([])
  })

  it('returns an import for a ref node when resolver returns a result', () => {
    const result = getImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping,
      resolve: (name) => (name === 'Pet' ? { name: 'PetType', path: './pet.ts' } : undefined),
    })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: ['PetType'], path: './pet.ts' })
  })

  it('returns empty when resolver returns undefined', () => {
    const result = getImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping,
      resolve: () => undefined,
    })
    expect(result).toEqual([])
  })

  it('applies nameMapping collision-resolved name before calling resolve', () => {
    const mapping = new Map([['Pet', 'PetRenamed']])
    let resolvedWith: string | undefined

    getImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping: mapping,
      resolve: (name) => {
        resolvedWith = name
        return { name, path: './x.ts' }
      },
    })

    expect(resolvedWith).toBe('PetRenamed')
  })
})
