import type { ArrowFunctionNode, BreakNode, ConstNode, FunctionNode, JsxNode, TextNode, TypeNode } from './code.ts'
import type { ContentNode } from './content.ts'
import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { InputNode } from './input.ts'
import type { OperationNode } from './operation.ts'
import type { OutputNode } from './output.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

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
  | FileNode
  | ImportNode
  | ExportNode
  | SourceNode
  | ConstNode
  | TypeNode
  | FunctionNode
  | ArrowFunctionNode
  | TextNode
  | BreakNode
  | JsxNode
