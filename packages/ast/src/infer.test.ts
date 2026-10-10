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
  it('returns the schema node variant when given an AST-shaped type', () => {
    expectTypeOf<InferSchemaNode<{ type: 'string' }>>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'number' }>>().toEqualTypeOf<NumberSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'enum' }>>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'union' }>>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'intersection' }>>().toEqualTypeOf<IntersectionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'tuple' }>>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'ref' }>>().toEqualTypeOf<RefSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'datetime' }>>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'date' }>>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'time' }>>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'url' }>>().toEqualTypeOf<UrlSchemaNode>()
  })

  it('returns the schema node variant when given a JSON-Schema-shaped type', () => {
    expectTypeOf<InferSchemaNode<{ allOf: [{ type: 'string' }] }>>().toEqualTypeOf<SchemaNode>()
    expectTypeOf<InferSchemaNode<{ allOf: [{ type: 'string' }, { type: 'number' }] }>>().toEqualTypeOf<IntersectionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ oneOf: [{ type: 'string' }] }>>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ anyOf: [{ type: 'string' }] }>>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ $ref: '#/components/schemas/Pet' }>>().toEqualTypeOf<RefSchemaNode>()
    expectTypeOf<InferSchemaNode<{ enum: ['a', 'b'] }>>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<InferSchemaNode<{ const: 'a' }>>().toEqualTypeOf<EnumSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'object' }>>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<InferSchemaNode<{ additionalProperties: true }>>().toEqualTypeOf<ObjectSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'array' }>>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<InferSchemaNode<{ prefixItems: [{ type: 'string' }] }>>().toEqualTypeOf<ArraySchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date' }>>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'time' }>>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }>>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, 'date'>>().toEqualTypeOf<DateSchemaNode>()
  })
})
