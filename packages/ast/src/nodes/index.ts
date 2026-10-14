import type { ArrowFunctionNode, BreakNode, ConstNode, FunctionNode, JsxNode, TextNode, TypeNode } from './code.ts'
import type { ContentNode } from './content.ts'
import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { InputNode } from './input.ts'
import type { OperationNode } from './operation.ts'
import type { ParameterNode } from './parameter.ts'
import type { PropertyNode } from './property.ts'
import type { RequestBodyNode } from './requestBody.ts'
import type { ResponseNode } from './response.ts'
import type { SchemaNode } from './schema.ts'

export { createArrowFunction, createBreak, createConst, createFunction, createJsx, createText, createType } from './code.ts'
export { createContent } from './content.ts'
export { createExport, createFile, createImport, createSource } from './file.ts'
export type { UserFileNode } from './file.ts'
export { createInput } from './input.ts'
export { createOperation } from './operation.ts'
export { createParameter } from './parameter.ts'
export { createProperty } from './property.ts'
export { createRequestBody } from './requestBody.ts'
export { createResponse } from './response.ts'
export { createSchema } from './schema.ts'

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
 *     default:
 *       return 'other'
 *   }
 * }
 * ```
 */
export type Node =
  | InputNode
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
