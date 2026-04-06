import type { ArrowFunctionNode, ConstNode, FunctionNode, TypeDeclarationNode } from './code.ts'
import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { FunctionParamNode, TypeNode as TypeExprNode } from './function.ts'
import type { OperationNode } from './operation.ts'
import type { OutputNode } from './output.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { ResponseNode } from './response.ts'
import type { InputNode } from './root.ts'
import type { SchemaNode } from './schema.ts'

export type { BaseNode, NodeKind } from './base.ts'
export type { ArrowFunctionNode, CodeNode, ConstNode, FunctionNode, JSDocNode, TypeDeclarationNode } from './code.ts'
export type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
export type { FunctionNodeType, FunctionParameterNode, FunctionParametersNode, FunctionParamNode, ParameterGroupNode } from './function.ts'
export type { HttpStatusCode, MediaType, StatusCode } from './http.ts'
export type { HttpMethod, OperationNode } from './operation.ts'
export type { OutputNode } from './output.ts'
export type { ParameterLocation, ParameterNode } from './parameter.ts'
export type { PropertyNode } from './property.ts'
export type { ResponseNode } from './response.ts'
export type { InputMeta, InputNode } from './root.ts'
export type {
  ArraySchemaNode,
  ComplexSchemaType,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
  EnumValueNode,
  FormatStringSchemaNode,
  IntersectionSchemaNode,
  Ipv4SchemaNode,
  Ipv6SchemaNode,
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
 * Combined type-related AST node.
 *
 * - `kind: 'Type'` — A language-agnostic type expression used in function parameter annotations.
 *   Comes in three variants: `reference` (plain name), `struct` (inline object type), `member` (indexed access).
 * - `kind: 'TypeDeclaration'` — A TypeScript `type X = ...` alias declaration node, mirroring the
 *   `Type` component from `@kubb/react-fabric`.
 */
export type TypeNode = TypeExprNode | TypeDeclarationNode

/**
 * Union of all AST node types.
 *
 * This lets TypeScript narrow types in `switch (node.kind)` blocks.
 *
 * @example
 * ```ts
 * function getKind(node: Node): string {
 *   switch (node.kind) {
 *     case 'Input':
 *       return 'input'
 *     case 'Output':
 *       return 'output'
 *     default:
 *       return 'other'
 *   }
 * }
 * ```
 */
export type Node =
  | InputNode
  | OutputNode
  | OperationNode
  | SchemaNode
  | PropertyNode
  | ParameterNode
  | ResponseNode
  | FunctionParamNode
  | FileNode
  | ImportNode
  | ExportNode
  | SourceNode
  | ConstNode
  | TypeExprNode
  | TypeDeclarationNode
  | FunctionNode
  | ArrowFunctionNode
