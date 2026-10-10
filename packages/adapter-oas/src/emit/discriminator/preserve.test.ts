import { describe, expect, it } from 'vitest'
import { createDiscriminantNode, findDiscriminators } from './preserve.ts'

describe('createDiscriminantNode', () => {
  it('creates an object with a single required enum property', () => {
    const node = createDiscriminantNode({ propertyName: 'type', values: ['cat'] })

    expect(node).toMatchObject({
      type: 'object',
      properties: [{ name: 'type', required: true, schema: { type: 'enum', enumValues: ['cat'] } }],
    })
  })

  it('keeps every value when the discriminant covers several keys', () => {
    const node = createDiscriminantNode({ propertyName: 'kind', values: ['dog', 'hound'] })

    expect(node).toMatchObject({
      type: 'object',
      properties: [{ name: 'kind', required: true, schema: { type: 'enum', enumValues: ['dog', 'hound'] } }],
    })
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
