import type { ArrowFunctionNode, ConstNode, FunctionNode, TypeNode } from './code.ts'
import type { ContentNode } from './content.ts'
import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { FunctionParamNode } from './function.ts'
import type { InputNode } from './input.ts'
import type { OperationNode } from './operation.ts'
import type { OutputNode } from './output.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

export type { NodeKind } from './base.ts'
export type { ArrowFunctionNode, BreakNode, CodeNode, ConstNode, FunctionNode, JSDocNode, JsxNode, TextNode, TypeNode } from './code.ts'
export type { ContentNode } from './content.ts'
export type { ExportNode, FileNode, ImportNode, SourceNode, UserFileNode } from './file.ts'
export type {
  FunctionParamKind,
  FunctionParameterNode,
  FunctionParametersNode,
  FunctionParamNode,
  IndexedAccessTypeNode,
  ObjectBindingPatternNode,
  TypeExpression,
  TypeLiteralNode,
} from './function.ts'
export type { InputMeta, InputNode } from './input.ts'
export type { GenericOperationNode, HttpMethod, HttpOperationNode, OperationNode } from './operation.ts'
export type { OutputNode } from './output.ts'
export type { ParameterLocation, ParameterNode } from './parameter.ts'
export type { PropertyNode } from './property.ts'
export type { RequestBodyNode } from './requestBody.ts'
export type { ResponseNode, StatusCode } from './response.ts'
export type {
  ArraySchemaNode,
  DateSchemaNode,
  DatetimeSchemaNode,
  EnumSchemaNode,
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
  | RequestBodyNode
  | ContentNode
  | FunctionParamNode
  | FileNode
  | ImportNode
  | ExportNode
  | SourceNode
  | ConstNode
  | TypeNode
  | FunctionNode
  | ArrowFunctionNode
