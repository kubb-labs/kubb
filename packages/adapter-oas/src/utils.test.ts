import { createProperty, createSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
import {
  applyDiscriminatorEnum,
  extractRefName,
  getImports,
  mergeAdjacentAnonymousObjects,
} from './utils.ts'

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
  function makeObjectNode(propNames: Array<string>, name?: string): SchemaNode {
    return createSchema({
      type: 'object',
      name,
      properties: propNames.map((p) => createProperty({ name: p, schema: createSchema({ type: 'string' }) as SchemaNode })),
    }) as SchemaNode
  }

  const baseNode = makeObjectNode(['type', 'name'], 'Pet')

  it('returns node unchanged when it is not an object', () => {
    const stringNode = createSchema({ type: 'string' }) as SchemaNode
    const result = applyDiscriminatorEnum({ node: stringNode, propertyName: 'type', values: ['dog'] })

    expect(result).toBe(stringNode)
  })

  it('returns node unchanged when the target property does not exist', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'kind', values: ['dog'] })

    expect(result).toBe(baseNode)
  })

  it('returns node unchanged when properties are empty', () => {
    const emptyObj = createSchema({ type: 'object', properties: [] }) as SchemaNode
    const result = applyDiscriminatorEnum({ node: emptyObj, propertyName: 'type', values: ['dog'] })

    expect(result).toBe(emptyObj)
  })

  it('replaces the discriminator property with an unnamed enum for a single value', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog'] })

    expect(result.type).toBe('object')

    if (result.type !== 'object') return
    const typeProp = result.properties?.find((p) => p.name === 'type')

    expect(typeProp).toBeDefined()
    expect(typeProp!.schema.type).toBe('enum')

    if (typeProp!.schema.type !== 'enum') return

    expect(typeProp!.schema.enumValues).toEqual(['dog'])
    expect(typeProp!.schema.name).toBeUndefined()
  })

  it('replaces the discriminator property with a named enum for multiple values', () => {
    const result = applyDiscriminatorEnum({
      node: baseNode,
      propertyName: 'type',
      values: ['dog', 'cat'],
      enumName: 'PetType',
    })

    expect(result.type).toBe('object')

    if (result.type !== 'object') return
    const typeProp = result.properties?.find((p) => p.name === 'type')

    expect(typeProp).toBeDefined()
    expect(typeProp!.schema.type).toBe('enum')

    if (typeProp!.schema.type !== 'enum') return

    expect(typeProp!.schema.enumValues).toEqual(['dog', 'cat'])
    expect(typeProp!.schema.name).toBe('PetType')
  })

  it('preserves other properties when replacing the discriminator', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog'] })

    if (result.type !== 'object') return
    const nameProp = result.properties?.find((p) => p.name === 'name')

    expect(nameProp).toBeDefined()
    expect(nameProp!.schema.type).toBe('string')
  })

  it('preserves the enum primitive as string', () => {
    const result = applyDiscriminatorEnum({ node: baseNode, propertyName: 'type', values: ['dog'] })

    if (result.type !== 'object') return
    const typeProp = result.properties?.find((p) => p.name === 'type')

    if (typeProp!.schema.type !== 'enum') return

    expect(typeProp!.schema.primitive).toBe('string')
  })

  it('preserves readOnly from the original property schema', () => {
    const readOnlyNode = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', readOnly: true }) as SchemaNode })],
    }) as SchemaNode

    const result = applyDiscriminatorEnum({ node: readOnlyNode, propertyName: 'type', values: ['dog'] })

    if (result.type !== 'object') return
    const typeProp = result.properties?.find((p) => p.name === 'type')

    expect(typeProp!.schema.readOnly).toBe(true)
  })

  it('preserves writeOnly from the original property schema', () => {
    const writeOnlyNode = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'type', schema: createSchema({ type: 'string', writeOnly: true }) as SchemaNode })],
    }) as SchemaNode

    const result = applyDiscriminatorEnum({ node: writeOnlyNode, propertyName: 'type', values: ['dog'] })

    if (result.type !== 'object') return
    const typeProp = result.properties?.find((p) => p.name === 'type')

    expect(typeProp!.schema.writeOnly).toBe(true)
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
