import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildDiscriminatorChildMap, createDiscriminantNode, findDiscriminator, patchDiscriminatorNode } from './discriminator.ts'

function refSchema(name: string) {
  return ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })
}

function enumSchema(values: Array<string>) {
  return ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: values })
}

function objectSchema(props: Array<{ name: string; schema: ast.SchemaNode }>) {
  return ast.factory.createSchema({
    type: 'object',
    properties: props.map((p) => ast.factory.createProperty({ name: p.name, required: true, schema: p.schema })),
  })
}

describe('buildDiscriminatorChildMap', () => {
  it('returns an empty map when no schemas carry a discriminator', () => {
    const map = buildDiscriminatorChildMap([])
    expect(map.size).toBe(0)
  })

  it('skips union schemas without a discriminatorPropertyName', () => {
    const union = ast.factory.createSchema({ type: 'union', members: [refSchema('Cat'), refSchema('Dog')] })
    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })

  it('builds child entries from a top-level discriminated union (Case 1)', () => {
    const member = ast.factory.createSchema({
      type: 'intersection',
      members: [refSchema('Cat'), objectSchema([{ name: 'kind', schema: enumSchema(['cat']) }])],
    })
    const union = ast.factory.createSchema({
      type: 'union',
      members: [member],
      discriminatorPropertyName: 'kind',
    })

    const map = buildDiscriminatorChildMap([union])
    expect(map.get('Cat')).toStrictEqual({ propertyName: 'kind', enumValues: ['cat'] })
  })

  it('unwraps an intersection wrapping a discriminated union (Case 2)', () => {
    const innerMember = ast.factory.createSchema({
      type: 'intersection',
      members: [refSchema('Dog'), objectSchema([{ name: 'kind', schema: enumSchema(['dog']) }])],
    })
    const innerUnion = ast.factory.createSchema({
      type: 'union',
      members: [innerMember],
      discriminatorPropertyName: 'kind',
    })
    const outerIntersection = ast.factory.createSchema({ type: 'intersection', members: [innerUnion] })

    const map = buildDiscriminatorChildMap([outerIntersection])
    expect(map.get('Dog')).toStrictEqual({ propertyName: 'kind', enumValues: ['dog'] })
  })

  it('merges enum values when the same child appears in multiple parents', () => {
    const memberA = ast.factory.createSchema({
      type: 'intersection',
      members: [refSchema('Pet'), objectSchema([{ name: 'kind', schema: enumSchema(['cat']) }])],
    })
    const memberB = ast.factory.createSchema({
      type: 'intersection',
      members: [refSchema('Pet'), objectSchema([{ name: 'kind', schema: enumSchema(['kitten']) }])],
    })
    const unionA = ast.factory.createSchema({ type: 'union', members: [memberA], discriminatorPropertyName: 'kind' })
    const unionB = ast.factory.createSchema({ type: 'union', members: [memberB], discriminatorPropertyName: 'kind' })

    const map = buildDiscriminatorChildMap([unionA, unionB])
    expect(map.get('Pet')).toStrictEqual({ propertyName: 'kind', enumValues: ['cat', 'kitten'] })
  })

  it('skips members that are not intersections', () => {
    const union = ast.factory.createSchema({
      type: 'union',
      members: [refSchema('Cat')],
      discriminatorPropertyName: 'kind',
    })
    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })

  it('skips members missing the discriminant property', () => {
    const member = ast.factory.createSchema({
      type: 'intersection',
      members: [refSchema('Cat'), objectSchema([{ name: 'other', schema: enumSchema(['x']) }])],
    })
    const union = ast.factory.createSchema({ type: 'union', members: [member], discriminatorPropertyName: 'kind' })

    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })
})

describe('patchDiscriminatorNode', () => {
  it('returns the node unchanged when it is not an object schema', () => {
    const node = ast.factory.createSchema({ type: 'string' })
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })
    expect(result).toBe(node)
  })

  it('adds the discriminant property when absent', () => {
    const node = objectSchema([{ name: 'id', schema: ast.factory.createSchema({ type: 'integer' }) }])
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })

    const obj = ast.narrowSchema(result, 'object')
    expect(obj?.properties.map((p) => p.name)).toStrictEqual(['id', 'kind'])
    const kind = obj?.properties.find((p) => p.name === 'kind')
    expect(ast.narrowSchema(kind!.schema, 'enum')?.enumValues).toStrictEqual(['cat'])
  })

  it('replaces an existing property with the same name', () => {
    const node = objectSchema([{ name: 'kind', schema: ast.factory.createSchema({ type: 'string' }) }])
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })

    const obj = ast.narrowSchema(result, 'object')
    expect(obj?.properties).toHaveLength(1)
    const kind = obj?.properties[0]
    expect(kind?.name).toBe('kind')
    expect(ast.narrowSchema(kind!.schema, 'enum')?.enumValues).toStrictEqual(['cat'])
  })
})

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
