import { describe, expectTypeOf, it } from 'vitest'
import type { InferSchema } from './infer.ts'
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
    type Node = InferSchema<{ allOf: [{ type: 'string' }] }>

    expectTypeOf<Node>().toEqualTypeOf<SchemaNode>()
  })

  it('infers IntersectionSchemaNode for multi-member allOf', () => {
    type Node = InferSchema<{ allOf: [{ type: 'string' }, { type: 'number' }] }>

    expectTypeOf<Node>().toEqualTypeOf<IntersectionSchemaNode>()
  })

  it('infers UnionSchemaNode for oneOf and anyOf', () => {
    type OneOfNode = InferSchema<{ oneOf: [{ type: 'string' }] }>
    type AnyOfNode = InferSchema<{ anyOf: [{ type: 'string' }] }>

    expectTypeOf<OneOfNode>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<AnyOfNode>().toEqualTypeOf<UnionSchemaNode>()
  })

  it('infers RefSchemaNode from $ref', () => {
    type Node = InferSchema<{ $ref: '#/components/schemas/Pet' }>

    expectTypeOf<Node>().toEqualTypeOf<RefSchemaNode>()
  })

  it('infers EnumSchemaNode from enum and const', () => {
    type EnumNode = InferSchema<{ enum: ['a', 'b'] }>
    type ConstNode = InferSchema<{ const: 'a' }>

    expectTypeOf<EnumNode>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<ConstNode>().toEqualTypeOf<EnumSchemaNode>()
  })

  it('infers ObjectSchemaNode and ArraySchemaNode from structural hints', () => {
    type ObjectNode = InferSchema<{ type: 'object' }>
    type AdditionalPropsNode = InferSchema<{ additionalProperties: true }>
    type ArrayNode = InferSchema<{ type: 'array' }>
    type PrefixItemsNode = InferSchema<{ prefixItems: [{ type: 'string' }] }>

    expectTypeOf<ObjectNode>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<AdditionalPropsNode>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<ArrayNode>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<PrefixItemsNode>().toEqualTypeOf<ArraySchemaNode>()
  })

  it('infers date/time variants', () => {
    type DateNode = InferSchema<{ format: 'date' }>
    type TimeNode = InferSchema<{ format: 'time' }>
    type DateTimeStringNode = InferSchema<{ format: 'date-time' }>
    type DateTimeDateNode = InferSchema<{ format: 'date-time' }, 'date'>

    expectTypeOf<DateNode>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<TimeNode>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<DateTimeStringNode>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<DateTimeDateNode>().toEqualTypeOf<DateSchemaNode>()
  })

  it('infers scalar nodes', () => {
    type StringNode = InferSchema<{ type: 'string' }>
    type NumberNode = InferSchema<{ type: 'number' }>

    expectTypeOf<StringNode>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<NumberNode>().toEqualTypeOf<NumberSchemaNode>()
  })

  it('infers AST-native schema variants', () => {
    type EnumNode = InferSchema<{ type: 'enum' }>
    type UnionNode = InferSchema<{ type: 'union' }>
    type IntersectionNode = InferSchema<{ type: 'intersection' }>
    type TupleNode = InferSchema<{ type: 'tuple' }>
    type RefNode = InferSchema<{ type: 'ref' }>
    type DatetimeNode = InferSchema<{ type: 'datetime' }>
    type DateNode = InferSchema<{ type: 'date' }>
    type TimeNode = InferSchema<{ type: 'time' }>
    type UrlNode = InferSchema<{ type: 'url' }>

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
