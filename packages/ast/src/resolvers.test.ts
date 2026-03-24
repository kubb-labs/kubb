import { describe, expect, it } from 'vitest'
import { createProperty, createSchema } from './factory.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { childName, collectImports, enumPropName, findDiscriminator } from './resolvers.ts'

describe('findDiscriminator', () => {
  it('returns the mapping key for a matching discriminator ref', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
    }

    expect(findDiscriminator(mapping, '#/components/schemas/Dog')).toBe('dog')
  })

  it.each([
    { label: 'mapping is missing', mapping: undefined, ref: '#/components/schemas/Dog' as string | undefined },
    { label: 'ref is missing', mapping: { cat: '#/components/schemas/Cat' }, ref: undefined },
    { label: 'ref does not match any mapping entry', mapping: { cat: '#/components/schemas/Cat' }, ref: '#/components/schemas/Dog' },
  ])('returns undefined when $label', ({ mapping, ref }) => {
    expect(findDiscriminator(mapping, ref)).toBeNull()
  })
})

describe('childName', () => {
  it('returns undefined when parentName is undefined', () => {
    expect(childName(undefined, 'params')).toBeNull()
  })

  it('returns PascalCase of `parentName + propName`', () => {
    expect(childName('Order', 'params')).toBe('OrderParams')
    expect(childName('Order', 'shipping_address')).toBe('OrderShippingAddress')
  })
})

describe('enumPropName', () => {
  it('combines parentName, propName, and enumSuffix', () => {
    expect(enumPropName('Order', 'status', 'enum')).toBe('OrderStatusEnum')
  })

  it('works without parentName and with a custom suffix', () => {
    expect(enumPropName(undefined, 'status', 'enum')).toBe('StatusEnum')
    expect(enumPropName('Order', 'status', 'Type')).toBe('OrderStatusType')
  })
})

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

    expect(result).toEqual([])
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

    expect(result).toEqual([])
  })

  it('collects nested ref imports', () => {
    const node = createSchema({
      type: 'object',
      properties: [createProperty({ name: 'pet', schema: createSchema({ type: 'ref', ref: '#/components/schemas/Pet', name: 'Pet' }) })],
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
