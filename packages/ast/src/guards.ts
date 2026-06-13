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
 *
 * @deprecated Use `inputDef.is` instead.
 */
export const isInputNode = inputDef.is

/**
 * Returns `true` when the input is an `OutputNode`.
 *
 * @deprecated Use `outputDef.is` instead.
 */
export const isOutputNode = outputDef.is

/**
 * Returns `true` when the input is an `OperationNode`.
 *
 * @deprecated Use `operationDef.is` instead.
 */
export const isOperationNode = operationDef.is

/**
 * Returns `true` when the input is a `RequestBodyNode`.
 *
 * @deprecated Use `requestBodyDef.is` instead.
 */
export const isRequestBodyNode = requestBodyDef.is

/**
 * Returns `true` when the input is a `ContentNode`.
 *
 * @deprecated Use `contentDef.is` instead.
 */
export const isContentNode = contentDef.is

/**
 * Returns `true` when the input is a `ResponseNode`.
 *
 * @deprecated Use `responseDef.is` instead.
 */
export const isResponseNode = responseDef.is

/**
 * Returns `true` when the input is a `SchemaNode`.
 *
 * @deprecated Use `schemaDef.is` instead.
 */
export const isSchemaNode = schemaDef.is

/**
 * Returns `true` when the input is a `PropertyNode`.
 *
 * @deprecated Use `propertyDef.is` instead.
 */
export const isPropertyNode = propertyDef.is

/**
 * Returns `true` when the input is a `ParameterNode`.
 *
 * @deprecated Use `parameterDef.is` instead.
 */
export const isParameterNode = parameterDef.is

/**
 * Returns `true` when the input is a `FunctionParameterNode`.
 *
 * @deprecated Use `functionParameterDef.is` instead.
 */
export const isFunctionParameterNode = functionParameterDef.is

/**
 * Returns `true` when the input is a `ParameterGroupNode`.
 *
 * @deprecated Use `parameterGroupDef.is` instead.
 */
export const isParameterGroupNode = parameterGroupDef.is

/**
 * Returns `true` when the input is a `FunctionParametersNode`.
 *
 * @deprecated Use `functionParametersDef.is` instead.
 */
export const isFunctionParametersNode = functionParametersDef.is

/**
 * Returns `true` when the input is a `ParamsTypeNode`.
 *
 * @deprecated Use `paramsTypeDef.is` instead.
 */
export const isParamsTypeNode = paramsTypeDef.is

/**
 * Returns `true` when the input is a `ConstNode`.
 *
 * @deprecated Use `constDef.is` instead.
 */
export const isConstNode = constDef.is

/**
 * Returns `true` when the input is a `TypeNode`.
 *
 * @deprecated Use `typeDef.is` instead.
 */
export const isTypeNode = typeDef.is

/**
 * Returns `true` when the input is a `FunctionNode`.
 *
 * @deprecated Use `functionDef.is` instead.
 */
export const isFunctionNode = functionDef.is

/**
 * Returns `true` when the input is an `ArrowFunctionNode`.
 *
 * @deprecated Use `arrowFunctionDef.is` instead.
 */
export const isArrowFunctionNode = arrowFunctionDef.is

/**
 * Returns `true` when the input is a `TextNode`.
 *
 * @deprecated Use `textDef.is` instead.
 */
export const isTextNode = textDef.is

/**
 * Returns `true` when the input is a `BreakNode`.
 *
 * @deprecated Use `breakDef.is` instead.
 */
export const isBreakNode = breakDef.is

/**
 * Returns `true` when the input is a `JsxNode`.
 *
 * @deprecated Use `jsxDef.is` instead.
 */
export const isJsxNode = jsxDef.is

/**
 * Returns `true` when the input is a `FileNode`.
 *
 * @deprecated Use `fileDef.is` instead.
 */
export const isFileNode = fileDef.is

/**
 * Returns `true` when the input is an `ImportNode`.
 *
 * @deprecated Use `importDef.is` instead.
 */
export const isImportNode = importDef.is

/**
 * Returns `true` when the input is an `ExportNode`.
 *
 * @deprecated Use `exportDef.is` instead.
 */
export const isExportNode = exportDef.is

/**
 * Returns `true` when the input is a `SourceNode`.
 *
 * @deprecated Use `sourceDef.is` instead.
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
