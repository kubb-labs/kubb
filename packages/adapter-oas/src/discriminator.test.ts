import { describe, expect, it } from 'vitest'
import { createDiscriminantNode, resolveDiscriminatorValue } from './discriminator.ts'

describe('createDiscriminantNode', () => {
  it('creates an object with a single required enum property', () => {
    const node = createDiscriminantNode('type', 'cat')

    expect(node.type).toBe('object')
    if (node.type !== 'object') return
    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('type')
    expect(node.properties?.[0]?.required).toBe(true)
    expect(node.properties?.[0]?.schema.type).toBe('enum')
  })

  it('enum has exactly one value matching the input', () => {
    const node = createDiscriminantNode('kind', 'dog')

    if (node.type !== 'object') return
    const enumNode = node.properties?.[0]?.schema
    if (!enumNode || enumNode.type !== 'enum') return
    expect(enumNode.enumValues).toEqual(['dog'])
  })

  it('property name matches the input', () => {
    const node = createDiscriminantNode('discriminator', 'foo')

    if (node.type !== 'object') return
    expect(node.properties?.[0]?.name).toBe('discriminator')
  })
})

describe('resolveDiscriminatorValue', () => {
  it('returns the mapping key when ref matches a value', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
      dog: '#/components/schemas/Dog',
    }

    expect(resolveDiscriminatorValue(mapping, '#/components/schemas/Dog')).toBe('dog')
  })

  it('returns undefined when ref does not match any value', () => {
    const mapping = {
      cat: '#/components/schemas/Cat',
    }

    expect(resolveDiscriminatorValue(mapping, '#/components/schemas/Dog')).toBeUndefined()
  })

  it('returns undefined when mapping is undefined', () => {
    expect(resolveDiscriminatorValue(undefined, '#/components/schemas/Dog')).toBeUndefined()
  })

  it('returns undefined when ref is undefined', () => {
    expect(resolveDiscriminatorValue({ cat: '#/components/schemas/Cat' }, undefined)).toBeUndefined()
  })
})
