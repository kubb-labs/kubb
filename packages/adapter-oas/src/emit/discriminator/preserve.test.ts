import { describe, expect, it } from 'vitest'
import { createDiscriminantNode, findDiscriminators } from './preserve.ts'

describe('createDiscriminantNode', () => {
  it('creates an object with a single required enum property', () => {
    const node = createDiscriminantNode({ propertyName: 'type', values: ['cat'] })

    expect(node.type).toBe('object')
    if (node.type !== 'object') return
    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('type')
    expect(node.properties?.[0]?.required).toBe(true)
    expect(node.properties?.[0]?.schema.type).toBe('enum')
  })

  it('enum has exactly one value matching the input', () => {
    const node = createDiscriminantNode({ propertyName: 'kind', values: ['dog'] })

    if (node.type !== 'object') return
    const enumNode = node.properties?.[0]?.schema
    if (!enumNode || enumNode.type !== 'enum') return
    expect(enumNode.enumValues).toStrictEqual(['dog'])
  })

  it('keeps every value when the discriminant covers several keys', () => {
    const node = createDiscriminantNode({ propertyName: 'kind', values: ['dog', 'hound'] })

    if (node.type !== 'object') return
    const enumNode = node.properties?.[0]?.schema
    if (!enumNode || enumNode.type !== 'enum') return
    expect(enumNode.enumValues).toStrictEqual(['dog', 'hound'])
  })
})

describe('findDiscriminators', () => {
  it('returns every key that maps onto the same ref', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
      hound: '#/components/schemas/Dog',
      puppy: '#/components/schemas/Dog',
    }

    expect(findDiscriminators(mapping, '#/components/schemas/Dog')).toStrictEqual(['dog', 'hound', 'puppy'])
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
  ])('returns an empty list when $label', ({ mapping, ref }) => {
    expect(findDiscriminators(mapping, ref)).toStrictEqual([])
  })
})
