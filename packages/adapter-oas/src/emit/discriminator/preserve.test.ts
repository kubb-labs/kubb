import { describe, expect, it } from 'vitest'
import { createDiscriminantNode, findDiscriminator } from './preserve.ts'

describe('createDiscriminantNode', () => {
  it('creates an object with a single required enum property', () => {
    const node = createDiscriminantNode({ propertyName: 'type', value: 'cat' })

    expect(node.type).toBe('object')
    if (node.type !== 'object') return
    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('type')
    expect(node.properties?.[0]?.required).toBe(true)
    expect(node.properties?.[0]?.schema.type).toBe('enum')
  })

  it('enum has exactly one value matching the input', () => {
    const node = createDiscriminantNode({ propertyName: 'kind', value: 'dog' })

    if (node.type !== 'object') return
    const enumNode = node.properties?.[0]?.schema
    if (!enumNode || enumNode.type !== 'enum') return
    expect(enumNode.enumValues).toStrictEqual(['dog'])
  })
})

describe('findDiscriminator', () => {
  it('returns the mapping key for a matching discriminator ref', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
    }

    expect(findDiscriminator(mapping, '#/components/schemas/Dog')).toBe('dog')
  })

  it.each([
    {
      label: 'mapping is missing',
      mapping: undefined,
      ref: '#/components/schemas/Dog' as string | undefined,
    },
    {
      label: 'ref is missing',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: undefined,
    },
    {
      label: 'ref does not match any mapping entry',
      mapping: { cat: '#/components/schemas/Cat' },
      ref: '#/components/schemas/Dog',
    },
  ])('returns null when $label', ({ mapping, ref }) => {
    expect(findDiscriminator(mapping, ref)).toBeNull()
  })
})
