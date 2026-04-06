import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { FunctionParamNode, ParamsTypeNode } from './function.ts'
import type { OperationNode } from './operation.ts'
import type { OutputNode } from './output.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { ResponseNode } from './response.ts'
import type { InputNode } from './root.ts'
import type { SchemaNode } from './schema.ts'
import type { ArrowFunctionNode, ConstNode, FunctionNode, TypeNode } from './code.ts'

export type { BaseNode, NodeKind } from './base.ts'
export type { ArrowFunctionNode, CodeNode, ConstNode, FunctionNode, JSDocNode, TypeDeclarationNode, TypeNode } from './code.ts'
export type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
export type { FunctionNodeType, FunctionParamNode, FunctionParameterNode, FunctionParametersNode, ParameterGroupNode, ParamsTypeNode } from './function.ts'
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
  | TypeNode
  | ParamsTypeNode
  | FunctionNode
  | ArrowFunctionNode
