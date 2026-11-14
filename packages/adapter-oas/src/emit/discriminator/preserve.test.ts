import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { createSchemaParser } from '../../parser.ts'
import { createRefs } from '../../refs.ts'
import type { Document, SchemaObject } from '../../types.ts'
import {
  extractDiscriminatedAllOfMembers,
  findDiscriminators,
  getDefaultMappingRef,
  getMappingKeys,
  narrowUnionMembers,
  propertyTypeOf,
  removeInheritedDiscriminator,
  typedKeys,
} from './preserve.ts'

function setup(schemas: Record<string, unknown>) {
  const document = { openapi: '3.1.0', info: { title: 'Pets', version: '1' }, paths: {}, components: { schemas } } as Document
  const refs = createRefs(document)
  return { refs, parse: createSchemaParser({ document, refs }) }
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })

/** The enum values a narrowed member pins its discriminator property to, or `null` when it was not narrowed. */
function narrowedValues(node: ast.SchemaNode, propertyName: string): Array<unknown> | null {
  const intersection = ast.schema.narrow(node, 'intersection')
  if (!intersection) return null
  const literal = ast.schema.narrow(intersection.members!.at(-1), 'object')
  const property = literal?.properties?.find((prop) => prop.name === propertyName)
  return ast.schema.narrow(property?.schema, 'enum')?.enumValues ?? null
}

describe('typedKeys', () => {
  it.each([
    { keys: ['1', '2.5'], propertyType: 'integer', expected: [1, 2.5] },
    { keys: ['', ' ', 'abc', 'Infinity'], propertyType: 'number', expected: ['', ' ', 'abc', 'Infinity'] },
    { keys: ['TRUE', 'false', 'yes'], propertyType: 'boolean', expected: [true, false, 'yes'] },
    { keys: ['1', 'true'], propertyType: 'string', expected: ['1', 'true'] },
  ])('types $keys as $propertyType', ({ keys, propertyType, expected }) => {
    expect(typedKeys({ keys, propertyType })).toStrictEqual(expected)
  })
})

describe('propertyTypeOf', () => {
  it('follows $refs and allOf members, and reads a nullable type array as its non-null type', () => {
    const { refs } = setup({
      Base: { type: 'object', properties: { kind: { type: ['integer', 'null'] } } },
      Child: { allOf: [ref('Base'), { type: 'object' }] },
    })

    expect(propertyTypeOf({ schema: ref('Child'), propertyName: 'kind', refs })).toBe('integer')
  })

  it('stops on a $ref cycle', () => {
    const { refs } = setup({ Loop: { allOf: [ref('Loop')] } })

    expect(propertyTypeOf({ schema: ref('Loop'), propertyName: 'kind', refs })).toBeUndefined()
  })
})

describe('getDefaultMappingRef', () => {
  it.each([
    { defaultMapping: 'Other', expected: '#/components/schemas/Other' },
    { defaultMapping: '#/components/schemas/Other', expected: '#/components/schemas/Other' },
    { defaultMapping: undefined, expected: undefined },
  ])('reads $defaultMapping as $expected', ({ defaultMapping, expected }) => {
    expect(getDefaultMappingRef({ propertyName: 'kind', defaultMapping })).toBe(expected)
  })
})

describe('findDiscriminators', () => {
  it('returns every key that maps to the ref', () => {
    const mapping = { dog: '#/components/schemas/Dog', cat: '#/components/schemas/Cat', hound: '#/components/schemas/Dog' }

    expect(findDiscriminators({ mapping, ref: '#/components/schemas/Dog' })).toStrictEqual(['dog', 'hound'])
    expect(findDiscriminators({ mapping, ref: undefined })).toStrictEqual([])
  })
})

describe('getMappingKeys', () => {
  it('adds the keys of a nested discriminator on the same property, and survives a cycle', () => {
    const { refs } = setup({
      Dog: {
        oneOf: [ref('Puppy')],
        discriminator: { propertyName: 'kind', mapping: { puppy: '#/components/schemas/Puppy', self: '#/components/schemas/Dog' } },
      },
      Puppy: { type: 'object' },
    })

    expect(getMappingKeys({ discriminator: { propertyName: 'kind', mapping: { dog: '#/components/schemas/Dog' } }, refs })).toStrictEqual([
      'dog',
      'puppy',
      'self',
    ])
  })

  it('ignores a nested discriminator on another property', () => {
    const { refs } = setup({
      Dog: { oneOf: [ref('Puppy')], discriminator: { propertyName: 'breed', mapping: { puppy: '#/components/schemas/Puppy' } } },
      Puppy: { type: 'object' },
    })

    expect(getMappingKeys({ discriminator: { propertyName: 'kind', mapping: { dog: '#/components/schemas/Dog' } }, refs })).toStrictEqual(['dog'])
  })
})

describe('removeInheritedDiscriminator', () => {
  it('drops an inline discriminator only when a $ref sibling declares one on the same property', () => {
    const { refs } = setup({ Pet: { type: 'object', discriminator: { propertyName: 'kind' } } })
    const same = { type: 'object', discriminator: { propertyName: 'kind', mapping: { a: '#/components/schemas/A' } } } as SchemaObject
    const other = { type: 'object', discriminator: { propertyName: 'breed' } } as SchemaObject

    const [, kept, dropped] = removeInheritedDiscriminator({ members: [ref('Pet'), other, same], refs })

    expect(kept).toBe(other)
    expect(dropped).toStrictEqual({ type: 'object' })
  })
})

describe('narrowUnionMembers', () => {
  it('narrows mapped members with typed values and leaves the default member and non-object members alone', () => {
    const { refs, parse } = setup({
      One: { type: 'object', properties: { code: { type: 'integer' } } },
      Other: { type: 'object', properties: { code: { type: 'integer' } } },
      List: { type: 'array', items: { type: 'string' } },
    })
    const discriminator = {
      propertyName: 'code',
      mapping: { '1': '#/components/schemas/One', '2': '#/components/schemas/List' },
      defaultMapping: 'Other',
    }

    const [one, other, list] = narrowUnionMembers({
      unionMembers: [ref('One'), ref('Other'), ref('List')],
      discriminator,
      sharedPropertiesNode: undefined,
      parse,
      name: 'Shape',
      refs,
    })

    expect(narrowedValues(one!, 'code')).toStrictEqual([1])
    expect(other).toMatchObject({ type: 'ref', name: 'Other' })
    expect(list).toMatchObject({ type: 'ref', name: 'List' })
  })

  it('uses the schema name without a mapping, unless the member already pins the property', () => {
    const { refs, parse } = setup({
      Cat: { type: 'object', properties: { petType: { type: 'string' } } },
      Dog: { type: 'object', properties: { petType: { const: 'dog' } } },
    })

    const [cat, dog] = narrowUnionMembers({
      unionMembers: [ref('Cat'), ref('Dog')],
      discriminator: { propertyName: 'petType' },
      sharedPropertiesNode: undefined,
      parse,
      name: 'Pet',
      refs,
    })

    expect(narrowedValues(cat!, 'petType')).toStrictEqual(['Cat'])
    expect(narrowedValues(dog!, 'petType')).toBeNull()
  })

  it('narrows the shared property node, or falls back to a literal when it lacks the property', () => {
    const { refs, parse } = setup({ Cat: { type: 'object' } })
    const shared = (name: string) =>
      ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: 'string', description: 'shared' }) }),
          ast.factory.createProperty({ name: 'extra', schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })
    const narrow = (sharedPropertiesNode: ast.SchemaNode) =>
      narrowUnionMembers({
        unionMembers: [ref('Cat')],
        discriminator: { propertyName: 'petType', mapping: { cat: '#/components/schemas/Cat' } },
        sharedPropertiesNode,
        parse,
        name: 'Pet',
        refs,
      })[0]!

    const fromShared = ast.schema.narrow(ast.schema.narrow(narrow(shared('petType')), 'intersection')!.members![1], 'object')!
    expect(fromShared.properties!.map((prop) => prop.name)).toStrictEqual(['petType'])
    expect(narrowedValues(narrow(shared('petType')), 'petType')).toStrictEqual(['cat'])
    expect(narrowedValues(narrow(shared('other')), 'petType')).toStrictEqual(['cat'])
  })
})

describe('extractDiscriminatedAllOfMembers', () => {
  it('replaces a discriminated oneOf parent with the child discriminant value', () => {
    const { refs } = setup({
      Pet: {
        oneOf: [ref('Cat')],
        discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } },
        properties: { kind: { type: 'string' } },
      },
      Cat: { allOf: [ref('Pet'), { type: 'object' }] },
    })
    const inline = { type: 'object' } as SchemaObject

    expect(extractDiscriminatedAllOfMembers({ allOfMembers: [ref('Pet'), inline], name: 'Cat', refs })).toStrictEqual({
      members: [inline],
      discriminantValues: [{ propertyName: 'kind', values: ['cat'] }],
    })
  })

  it('keeps a parent that declares a discriminator without a union', () => {
    const { refs } = setup({
      Pet: { type: 'object', discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } } },
      Cat: { allOf: [ref('Pet')] },
    })

    expect(extractDiscriminatedAllOfMembers({ allOfMembers: [ref('Pet')], name: 'Cat', refs })).toStrictEqual({
      members: [ref('Pet')],
      discriminantValues: [],
    })
  })
})
