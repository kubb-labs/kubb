import { describe, expect, it } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { collectImports } from './resolvers.ts'

describe('collectImports()', () => {
  function makeRefNode(ref: string, name: string): SchemaNode {
    return createSchema({ type: 'ref', ref, name }) as SchemaNode
  }

  function makeStringNode(): SchemaNode {
    return createSchema({ type: 'string' }) as SchemaNode
  }

  const nameMapping = new Map<string, string>()

  it('returns an empty array for non-ref nodes', () => {
    const result = collectImports({
      node: makeStringNode(),
      nameMapping,
      resolve: () => ({ name: 'Foo', path: './foo.ts' }),
    })

    expect(result).toStrictEqual([])
  })

  it('returns an import entry for ref nodes when resolve() returns a value', () => {
    const result = collectImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping,
      resolve: (name) => (name === 'Pet' ? { name: 'PetType', path: './pet.ts' } : undefined),
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'PetType', path: './pet.ts' })
  })

  it('applies the collision-resolved name from nameMapping before resolve()', () => {
    const mapping = new Map([['Pet', 'PetRenamed']])
    let resolvedWith: string | undefined

    collectImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping: mapping,
      resolve: (name) => {
        resolvedWith = name
        return { name, path: './x.ts' }
      },
    })

    expect(resolvedWith).toBe('PetRenamed')
  })

  it('returns an empty array when resolve() returns undefined', () => {
    const result = collectImports({
      node: makeRefNode('#/components/schemas/Pet', 'Pet'),
      nameMapping,
      resolve: () => undefined,
    })

    expect(result).toStrictEqual([])
  })

  it('collects nested ref imports', () => {
    const node = createSchema({
      type: 'object',
      properties: [
        createProperty({
          name: 'pet',
          schema: createSchema({
            type: 'ref',
            ref: '#/components/schemas/Pet',
            name: 'Pet',
          }),
        }),
      ],
    }) as SchemaNode

    const result = collectImports({
      node,
      nameMapping,
      resolve: (name) => (name === 'Pet' ? { name: 'PetType', path: './pet.ts' } : undefined),
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'PetType', path: './pet.ts' })
  })
})
