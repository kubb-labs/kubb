import { createProperty, createSchema } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import { describe, expect, it } from 'vitest'
import { getImports, resolveRefs } from './refResolver.ts'

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

describe('resolveRefs', () => {
  it('resolves ref node name via resolveName callback', () => {
    const node = createSchema({ type: 'ref', ref: 'Pet', name: 'Pet' }) as SchemaNode
    const result = resolveRefs({ node, nameMapping: new Map(), resolveName: (name) => `${name}Type` })

    expect(result.name).toBe('PetType')
  })

  it('applies nameMapping before calling resolveName', () => {
    const node = createSchema({ type: 'ref', ref: 'Pet', name: 'Pet' }) as SchemaNode
    const result = resolveRefs({
      node,
      nameMapping: new Map([['Pet', 'OrderPet']]),
      resolveName: (name) => `${name}Type`,
    })

    expect(result.name).toBe('OrderPetType')
  })

  it('resolves enum node name via resolveEnumName callback', () => {
    const node = createSchema({ type: 'enum', name: 'Status', primitive: 'string', enumValues: ['a', 'b'] }) as SchemaNode
    const result = resolveRefs({
      node,
      nameMapping: new Map(),
      resolveName: (name) => `${name}Type`,
      resolveEnumName: (name) => `${name}Enum`,
    })

    expect(result.name).toBe('StatusEnum')
  })

  it('falls back to resolveName when resolveEnumName is not provided', () => {
    const node = createSchema({ type: 'enum', name: 'Status', primitive: 'string', enumValues: ['a', 'b'] }) as SchemaNode
    const result = resolveRefs({
      node,
      nameMapping: new Map(),
      resolveName: (name) => `${name}Type`,
    })

    expect(result.name).toBe('StatusType')
  })

  it('leaves non-ref and non-enum nodes unchanged', () => {
    const node = createSchema({ type: 'string' }) as SchemaNode
    const result = resolveRefs({ node, nameMapping: new Map(), resolveName: (name) => `${name}Type` })

    expect(result).toStrictEqual(node)
  })

  it('handles nested refs inside object properties', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'pet', schema: createSchema({ type: 'ref', ref: 'Pet', name: 'Pet' }) })],
    }) as SchemaNode
    const result = resolveRefs({ node, nameMapping: new Map(), resolveName: (name) => `${name}Type` })
    const objectNode = result.type === 'object' ? result : undefined
    const refNode = objectNode?.properties?.[0]?.schema

    expect(refNode?.name).toBe('PetType')
  })

  it('handles refs inside union members', () => {
    const node = createSchema({
      type: 'union',
      members: [createSchema({ type: 'ref', ref: 'Pet', name: 'Pet' }), createSchema({ type: 'ref', ref: 'Error', name: 'Error' })],
    }) as SchemaNode
    const result = resolveRefs({ node, nameMapping: new Map(), resolveName: (name) => `${name}Type` })
    const unionNode = result.type === 'union' ? result : undefined

    expect(unionNode?.members?.[0]?.name).toBe('PetType')
    expect(unionNode?.members?.[1]?.name).toBe('ErrorType')
  })
})
