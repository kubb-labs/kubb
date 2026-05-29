import { describe, expectTypeOf, it } from 'vitest'
import type { InferSchemaNode } from './infer.ts'
import type {
  ArraySchemaNode,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  IntersectionSchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  RefSchemaNode,
  SchemaNode,
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
  UrlSchemaNode,
} from './nodes/index.ts'

describe('InferSchemaNode', () => {
  it('infers SchemaNode for single-member allOf flattening', () => {
    type Node = InferSchemaNode<{ allOf: [{ type: 'string' }] }>

    expectTypeOf<Node>().toEqualTypeOf<SchemaNode>()
  })

  it('infers IntersectionSchemaNode for multi-member allOf', () => {
    type Node = InferSchemaNode<{
      allOf: [{ type: 'string' }, { type: 'number' }]
    }>

    expectTypeOf<Node>().toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers UnionSchemaNode for oneOf and anyOf', () => {
    type OneOfNode = InferSchemaNode<{ oneOf: [{ type: 'string' }] }>
    type AnyOfNode = InferSchemaNode<{ anyOf: [{ type: 'string' }] }>

    expectTypeOf<OneOfNode>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<AnyOfNode>().toEqualTypeOf<UnionSchemaNode>()
  })

  it('infers RefSchemaNode from $ref', () => {
    type Node = InferSchemaNode<{ $ref: '#/components/schemas/Pet' }>

    expectTypeOf<Node>().toEqualTypeOf<RefSchemaNode>()
  })

  it('infers EnumSchemaNode from enum and const', () => {
    type EnumNode = InferSchemaNode<{ enum: ['a', 'b'] }>
    type ConstNode = InferSchemaNode<{ const: 'a' }>

    expectTypeOf<EnumNode>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<ConstNode>().toEqualTypeOf<EnumSchemaNode>()
  })

  it('infers ObjectSchemaNode and ArraySchemaNode from structural hints', () => {
    type ObjectNode = InferSchemaNode<{ type: 'object' }>
    type AdditionalPropsNode = InferSchemaNode<{ additionalProperties: true }>
    type ArrayNode = InferSchemaNode<{ type: 'array' }>
    type PrefixItemsNode = InferSchemaNode<{ prefixItems: [{ type: 'string' }] }>

    expectTypeOf<ObjectNode>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<AdditionalPropsNode>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<ArrayNode>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<PrefixItemsNode>().toEqualTypeOf<ArraySchemaNode>()
  })

  it('infers date/time variants', () => {
    type DateNode = InferSchemaNode<{ format: 'date' }>
    type TimeNode = InferSchemaNode<{ format: 'time' }>
    type DateTimeStringNode = InferSchemaNode<{ format: 'date-time' }>
    type DateTimeDateNode = InferSchemaNode<{ format: 'date-time' }, 'date'>

    expectTypeOf<DateNode>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<TimeNode>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<DateTimeStringNode>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<DateTimeDateNode>().toEqualTypeOf<DateSchemaNode>()
  })

  it('infers scalar nodes', () => {
    type StringNode = InferSchemaNode<{ type: 'string' }>
    type NumberNode = InferSchemaNode<{ type: 'number' }>

    expectTypeOf<StringNode>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<NumberNode>().toEqualTypeOf<NumberSchemaNode>()
  })

  it('infers AST-native schema variants', () => {
    type EnumNode = InferSchemaNode<{ type: 'enum' }>
    type UnionNode = InferSchemaNode<{ type: 'union' }>
    type IntersectionNode = InferSchemaNode<{ type: 'intersection' }>
    type TupleNode = InferSchemaNode<{ type: 'tuple' }>
    type RefNode = InferSchemaNode<{ type: 'ref' }>
    type DatetimeNode = InferSchemaNode<{ type: 'datetime' }>
    type DateNode = InferSchemaNode<{ type: 'date' }>
    type TimeNode = InferSchemaNode<{ type: 'time' }>
    type UrlNode = InferSchemaNode<{ type: 'url' }>

    expectTypeOf<EnumNode>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<UnionNode>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<IntersectionNode>().toEqualTypeOf<IntersectionSchemaNode>()
    expectTypeOf<TupleNode>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<RefNode>().toEqualTypeOf<RefSchemaNode>()
    expectTypeOf<DatetimeNode>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<DateNode>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<TimeNode>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<UrlNode>().toEqualTypeOf<UrlSchemaNode>()
  })
})
