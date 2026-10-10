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
  ScalarSchemaNode,
  SchemaNode,
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
  UrlSchemaNode,
} from './nodes/schema.ts'

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

  it('returns the scalar and union nodes for primitive, null, and multi-type schemas', () => {
    expectTypeOf<InferSchemaNode<{ type: 'integer' }>>().toEqualTypeOf<NumberSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'boolean' }>>().toEqualTypeOf<ScalarSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: ['string', 'null'] }>>().toEqualTypeOf<UnionSchemaNode>()
    expectTypeOf<InferSchemaNode<{ const: null }>>().toEqualTypeOf<ScalarSchemaNode>()
  })

  it('falls back to the constraint keywords when no type is given', () => {
    expectTypeOf<InferSchemaNode<{ minLength: 1 }>>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<InferSchemaNode<{ maxLength: 10 }>>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<InferSchemaNode<{ pattern: '^a' }>>().toEqualTypeOf<StringSchemaNode>()
    expectTypeOf<InferSchemaNode<{ minimum: 0 }>>().toEqualTypeOf<NumberSchemaNode>()
    expectTypeOf<InferSchemaNode<{ maximum: 100 }>>().toEqualTypeOf<NumberSchemaNode>()
  })

  it('returns SchemaNode when no entry matches', () => {
    expectTypeOf<InferSchemaNode<{}>>().toEqualTypeOf<SchemaNode>()
  })
})

describe('date types', () => {
  it('resolves format date-time from the dateType option', () => {
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, 'string'>>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, 'stringOffset'>>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, 'stringLocal'>>().toEqualTypeOf<DatetimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, 'date'>>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<InferSchemaNode<{ type: 'string'; format: 'date-time' }, 'date'>>().toEqualTypeOf<DateSchemaNode>()
  })

  it('maps date-time to a plain string when dateType is false', () => {
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, false>>().toEqualTypeOf<StringSchemaNode>()
  })

  it('falls back to the string result for the object dateType form', () => {
    expectTypeOf<InferSchemaNode<{ format: 'date-time' }, { dateTime: 'date' }>>().toEqualTypeOf<DatetimeSchemaNode>()
  })

  it('keeps format date and time independent of dateType', () => {
    expectTypeOf<InferSchemaNode<{ format: 'date' }, 'date'>>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'time' }, 'date'>>().toEqualTypeOf<TimeSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'date' }, false>>().toEqualTypeOf<DateSchemaNode>()
    expectTypeOf<InferSchemaNode<{ format: 'time' }, false>>().toEqualTypeOf<TimeSchemaNode>()
  })
})
