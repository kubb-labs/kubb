import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildDiscriminatorChildMap, patchDiscriminatorNode } from './discriminator.ts'

function refSchema(name: string) {
  return ast.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })
}

function enumSchema(values: Array<string>) {
  return ast.createSchema({ type: 'enum', primitive: 'string', enumValues: values })
}

function objectSchema(props: Array<{ name: string; schema: ast.SchemaNode }>) {
  return ast.createSchema({
    type: 'object',
    properties: props.map((p) => ast.createProperty({ name: p.name, required: true, schema: p.schema })),
  })
}

describe('buildDiscriminatorChildMap', () => {
  it('returns an empty map when no schemas carry a discriminator', () => {
    const map = buildDiscriminatorChildMap([])
    expect(map.size).toBe(0)
  })

  it('skips union schemas without a discriminatorPropertyName', () => {
    const union = ast.createSchema({ type: 'union', members: [refSchema('Cat'), refSchema('Dog')] })
    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })

  it('builds child entries from a top-level discriminated union (Case 1)', () => {
    const member = ast.createSchema({
      type: 'intersection',
      members: [refSchema('Cat'), objectSchema([{ name: 'kind', schema: enumSchema(['cat']) }])],
    })
    const union = ast.createSchema({
      type: 'union',
      members: [member],
      discriminatorPropertyName: 'kind',
    })

    const map = buildDiscriminatorChildMap([union])
    expect(map.get('Cat')).toStrictEqual({ propertyName: 'kind', enumValues: ['cat'] })
  })

  it('unwraps an intersection wrapping a discriminated union (Case 2)', () => {
    const innerMember = ast.createSchema({
      type: 'intersection',
      members: [refSchema('Dog'), objectSchema([{ name: 'kind', schema: enumSchema(['dog']) }])],
    })
    const innerUnion = ast.createSchema({
      type: 'union',
      members: [innerMember],
      discriminatorPropertyName: 'kind',
    })
    const outerIntersection = ast.createSchema({ type: 'intersection', members: [innerUnion] })

    const map = buildDiscriminatorChildMap([outerIntersection])
    expect(map.get('Dog')).toStrictEqual({ propertyName: 'kind', enumValues: ['dog'] })
  })

  it('merges enum values when the same child appears in multiple parents', () => {
    const memberA = ast.createSchema({
      type: 'intersection',
      members: [refSchema('Pet'), objectSchema([{ name: 'kind', schema: enumSchema(['cat']) }])],
    })
    const memberB = ast.createSchema({
      type: 'intersection',
      members: [refSchema('Pet'), objectSchema([{ name: 'kind', schema: enumSchema(['kitten']) }])],
    })
    const unionA = ast.createSchema({ type: 'union', members: [memberA], discriminatorPropertyName: 'kind' })
    const unionB = ast.createSchema({ type: 'union', members: [memberB], discriminatorPropertyName: 'kind' })

    const map = buildDiscriminatorChildMap([unionA, unionB])
    expect(map.get('Pet')).toStrictEqual({ propertyName: 'kind', enumValues: ['cat', 'kitten'] })
  })

  it('skips members that are not intersections', () => {
    const union = ast.createSchema({
      type: 'union',
      members: [refSchema('Cat')],
      discriminatorPropertyName: 'kind',
    })
    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })

  it('skips members missing the discriminant property', () => {
    const member = ast.createSchema({
      type: 'intersection',
      members: [refSchema('Cat'), objectSchema([{ name: 'other', schema: enumSchema(['x']) }])],
    })
    const union = ast.createSchema({ type: 'union', members: [member], discriminatorPropertyName: 'kind' })

    const map = buildDiscriminatorChildMap([union])
    expect(map.size).toBe(0)
  })
})

describe('patchDiscriminatorNode', () => {
  it('returns the node unchanged when it is not an object schema', () => {
    const node = ast.createSchema({ type: 'string' })
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })
    expect(result).toBe(node)
  })

  it('adds the discriminant property when absent', () => {
    const node = objectSchema([{ name: 'id', schema: ast.createSchema({ type: 'integer' }) }])
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })

    const obj = ast.narrowSchema(result, 'object')
    expect(obj?.properties.map((p) => p.name)).toStrictEqual(['id', 'kind'])
    const kind = obj?.properties.find((p) => p.name === 'kind')
    expect(ast.narrowSchema(kind!.schema, 'enum')?.enumValues).toStrictEqual(['cat'])
  })

  it('replaces an existing property with the same name', () => {
    const node = objectSchema([{ name: 'kind', schema: ast.createSchema({ type: 'string' }) }])
    const result = patchDiscriminatorNode(node, { propertyName: 'kind', enumValues: ['cat'] })

    const obj = ast.narrowSchema(result, 'object')
    expect(obj?.properties).toHaveLength(1)
    const kind = obj?.properties[0]
    expect(kind?.name).toBe('kind')
    expect(ast.narrowSchema(kind!.schema, 'enum')?.enumValues).toStrictEqual(['cat'])
  })
})
