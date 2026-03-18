import type { OperationNode } from './operation.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { ResponseNode } from './response.ts'
import type { RootNode } from './root.ts'
import type { SchemaNode } from './schema.ts'

export type { BaseNode, NodeKind } from './base.ts'
export type { HttpStatusCode, MediaType, StatusCode } from './http.ts'
export type { HttpMethod, OperationNode } from './operation.ts'
export type { ParameterLocation, ParameterNode } from './parameter.ts'
export type { PropertyNode } from './property.ts'
export type { ResponseNode } from './response.ts'
export type { RootMeta, RootNode } from './root.ts'
export type {
  ArraySchemaNode,
  ComplexSchemaType,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  EnumValueNode,
  IntersectionSchemaNode,
  NumberSchemaNode,
  ObjectSchemaNode,
  PrimitiveSchemaType,
  RefSchemaNode,
  ScalarSchemaNode,
  ScalarSchemaType,
  SchemaNode,
  SchemaNodeByType,
  SchemaType,
  SpecialSchemaType,
  StringSchemaNode,
  TimeSchemaNode,
  UnionSchemaNode,
  UrlSchemaNode,
} from './schema.ts'

/**
 * Discriminated union of every AST node.
 *
 * Using a concrete union (instead of the bare `BaseNode` alias) lets
 * TypeScript narrow the type automatically inside `switch (node.kind)`
 * blocks, eliminating the need for manual `as TypeName` casts.
 */
export type Node = RootNode | OperationNode | SchemaNode | PropertyNode | ParameterNode | ResponseNode
