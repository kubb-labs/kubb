import type { ArraySchemaNode, EnumSchemaNode, IntersectionSchemaNode, SchemaNode, UnionSchemaNode } from '@kubb/ast/types'
import { describe, expectTypeOf, it } from 'vitest'
import { Oas } from './oas/Oas.ts'
import { createOasParser } from './parser.ts'

const emptyOas = new Oas({ openapi: '3.0.0', info: { title: '', version: '' }, paths: {} } as any)

describe('InferSchemaNode via convertSchema', () => {
  const parser = createOasParser(emptyOas)

  it('infers SchemaNode for single-member allOf flattening', () => {
    const node = parser.convertSchema({ schema: { allOf: [{ type: 'string' }] } as const })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
  })

  it('infers SchemaNode for single-member allOf with metadata', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }],
        description: 'wrapped',
        deprecated: true,
        nullable: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
  })

  it('infers SchemaNode for single-member allOf $ref', () => {
    const node = parser.convertSchema({ schema: { allOf: [{ $ref: '#/components/schemas/Pet' }], nullable: true } as const })

    expectTypeOf(node).toEqualTypeOf<SchemaNode>()
  })

  it('infers IntersectionSchemaNode for multi-member allOf', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { tag: { type: 'string' } } }],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for allOf with sibling properties', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }],
        properties: { extra: { type: 'string' } },
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for allOf with required resolved from members', () => {
    const node = parser.convertSchema({
      schema: {
        required: ['id'],
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for allOf with outer properties + required', () => {
    const node = parser.convertSchema({
      schema: {
        required: ['id'],
        properties: { id: { type: 'integer' } },
        allOf: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for nullable allOf intersection', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        nullable: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for described/deprecated allOf intersection', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [{ type: 'string' }, { type: 'number' }],
        description: 'combined',
        deprecated: true,
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for merged anonymous allOf objects', () => {
    const node = parser.convertSchema({
      schema: {
        allOf: [
          { type: 'object', properties: { foo: { type: 'string' } } },
          { type: 'object', properties: { bar: { type: 'string' } } },
        ],
      } as const,
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers IntersectionSchemaNode for synthetic+allOf merged objects', () => {
    const node = parser.convertSchema({
      name: 'FullAddress',
      schema: {
        allOf: [
          {
            type: 'object' as const,
            properties: { streetNumber: { type: 'string' as const } },
          },
        ],
        properties: { streetName: { type: 'string' as const } },
        required: ['streetName', 'streetNumber'],
      },
    })

    expectTypeOf(node).toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers ArraySchemaNode for prefixItems tuple', () => {
    const node = parser.convertSchema({ schema: { prefixItems: [{ type: 'string' }] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('infers EnumSchemaNode when enum is present', () => {
    const node = parser.convertSchema({ schema: { enum: ['a', 'b'] } })

    expectTypeOf(node).toEqualTypeOf<EnumSchemaNode>()
  })

  it('infers ArraySchemaNode for array+enum normalization', () => {
    const node = parser.convertSchema({ schema: { type: 'array', enum: ['x', 'y'] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('infers ArraySchemaNode for array+items+enum normalization', () => {
    const node = parser.convertSchema({ schema: { type: 'array', items: { type: 'string' }, enum: ['x', 'y'] } })

    expectTypeOf(node).toEqualTypeOf<ArraySchemaNode>()
  })

  it('infers UnionSchemaNode for OAS 3.1 multi-type array', () => {
    const node = parser.convertSchema({ schema: { type: ['string', 'integer'] } })

    expectTypeOf(node).toEqualTypeOf<UnionSchemaNode>()
  })
})
