import { describe, expectTypeOf, it } from 'vitest'
import type { InferSchemaNode } from './infer.ts'
import type {
  ArraySchemaNode,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  IntersectionSchemaNode,
  NumberSchemaNode,
  RefSchemaNode,
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
})
