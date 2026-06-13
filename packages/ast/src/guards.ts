import { arrowFunctionDef, breakDef, constDef, functionDef, jsxDef, textDef, typeDef } from './nodes/code.ts'
import { contentDef } from './nodes/content.ts'
import { exportDef, fileDef, importDef, sourceDef } from './nodes/file.ts'
import { functionParameterDef, functionParametersDef, parameterGroupDef, paramsTypeDef } from './nodes/function.ts'
import type { HttpOperationNode, OperationNode, SchemaNode, SchemaNodeByType } from './nodes/index.ts'
import { inputDef } from './nodes/input.ts'
import { operationDef } from './nodes/operation.ts'
import { outputDef } from './nodes/output.ts'
import { parameterDef } from './nodes/parameter.ts'
import { propertyDef } from './nodes/property.ts'
import { requestBodyDef } from './nodes/requestBody.ts'
import { responseDef } from './nodes/response.ts'
import { schemaDef } from './nodes/schema.ts'

/**
 * Narrows a `SchemaNode` to the variant that matches `type`.
 *
 * @example
 * ```ts
 * const schema = createSchema({ type: 'string' })
 * const stringNode = narrowSchema(schema, 'string') // StringSchemaNode | null
 * ```
 */
export function narrowSchema<T extends SchemaNode['type']>(node: SchemaNode | undefined, type: T): SchemaNodeByType[T] | null {
  return node?.type === type ? (node as SchemaNodeByType[T]) : null
}

/**
 * Returns `true` when the input is an `InputNode`.
 */
export const isInputNode = inputDef.is

/**
 * Returns `true` when the input is an `OutputNode`.
 */
export const isOutputNode = outputDef.is

/**
 * Returns `true` when the input is an `OperationNode`.
 */
export const isOperationNode = operationDef.is

/**
 * Returns `true` when the input is a `RequestBodyNode`.
 */
export const isRequestBodyNode = requestBodyDef.is

/**
 * Returns `true` when the input is a `ContentNode`.
 */
export const isContentNode = contentDef.is

/**
 * Returns `true` when the input is a `ResponseNode`.
 */
export const isResponseNode = responseDef.is

/**
 * Returns `true` when the input is a `SchemaNode`.
 */
export const isSchemaNode = schemaDef.is

/**
 * Returns `true` when the input is a `PropertyNode`.
 */
export const isPropertyNode = propertyDef.is

/**
 * Returns `true` when the input is a `ParameterNode`.
 */
export const isParameterNode = parameterDef.is

/**
 * Returns `true` when the input is a `FunctionParameterNode`.
 */
export const isFunctionParameterNode = functionParameterDef.is

/**
 * Returns `true` when the input is a `ParameterGroupNode`.
 */
export const isParameterGroupNode = parameterGroupDef.is

/**
 * Returns `true` when the input is a `FunctionParametersNode`.
 */
export const isFunctionParametersNode = functionParametersDef.is

/**
 * Returns `true` when the input is a `ParamsTypeNode`.
 */
export const isParamsTypeNode = paramsTypeDef.is

/**
 * Returns `true` when the input is a `ConstNode`.
 */
export const isConstNode = constDef.is

/**
 * Returns `true` when the input is a `TypeNode`.
 */
export const isTypeNode = typeDef.is

/**
 * Returns `true` when the input is a `FunctionNode`.
 */
export const isFunctionNode = functionDef.is

/**
 * Returns `true` when the input is an `ArrowFunctionNode`.
 */
export const isArrowFunctionNode = arrowFunctionDef.is

/**
 * Returns `true` when the input is a `TextNode`.
 */
export const isTextNode = textDef.is

/**
 * Returns `true` when the input is a `BreakNode`.
 */
export const isBreakNode = breakDef.is

/**
 * Returns `true` when the input is a `JsxNode`.
 */
export const isJsxNode = jsxDef.is

/**
 * Returns `true` when the input is a `FileNode`.
 */
export const isFileNode = fileDef.is

/**
 * Returns `true` when the input is an `ImportNode`.
 */
export const isImportNode = importDef.is

/**
 * Returns `true` when the input is an `ExportNode`.
 */
export const isExportNode = exportDef.is

/**
 * Returns `true` when the input is a `SourceNode`.
 */
export const isSourceNode = sourceDef.is

/**
 * Narrows an `OperationNode` to an `HttpOperationNode`, guaranteeing `method` and `path`.
 *
 * @example
 * ```ts
 * if (isHttpOperationNode(node)) {
 *   console.log(node.method, node.path)
 * }
 * ```
 */
export function isHttpOperationNode(node: OperationNode): node is HttpOperationNode {
  return node.protocol === 'http' || (node.method !== undefined && node.path !== undefined)
}
