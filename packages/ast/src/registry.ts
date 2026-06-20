import type { NodeDef } from './defineNode.ts'
import { arrowFunctionDef, breakDef, constDef, functionDef, jsxDef, textDef, typeDef } from './nodes/code.ts'
import { contentDef } from './nodes/content.ts'
import {
  arrayExpressionDef,
  arrowExpressionDef,
  asDef,
  callDef,
  identifierDef,
  literalDef,
  memberDef,
  objectExpressionDef,
  rawExpressionDef,
  spreadDef,
} from './nodes/expression.ts'
import { exportDef, fileDef, importDef, sourceDef } from './nodes/file.ts'
import { functionParameterDef, functionParametersDef, indexedAccessTypeDef, objectBindingPatternDef, typeLiteralDef } from './nodes/function.ts'
import { inputDef } from './nodes/input.ts'
import { operationDef } from './nodes/operation.ts'
import { outputDef } from './nodes/output.ts'
import { parameterDef } from './nodes/parameter.ts'
import { propertyDef } from './nodes/property.ts'
import { requestBodyDef } from './nodes/requestBody.ts'
import { responseDef } from './nodes/response.ts'
import { schemaDef } from './nodes/schema.ts'
import {
  typeArrayDef,
  typeIntersectionDef,
  typeKeywordDef,
  typeLiteralTypeDef,
  typeObjectDef,
  typeOmitDef,
  typeReferenceDef,
  typeTupleDef,
  typeUnionDef,
  typeUrlTemplateDef,
} from './nodes/type.ts'

// Surface every def from one place so the package barrel re-exports them with `export * from './registry.ts'`.
// Adding a node means adding its `defineNode` to a `nodes/*.ts` file and listing it in `nodeDefs` below, nothing else.
export {
  arrayExpressionDef,
  arrowExpressionDef,
  arrowFunctionDef,
  asDef,
  breakDef,
  callDef,
  constDef,
  contentDef,
  exportDef,
  fileDef,
  functionDef,
  functionParameterDef,
  functionParametersDef,
  identifierDef,
  importDef,
  indexedAccessTypeDef,
  inputDef,
  jsxDef,
  literalDef,
  memberDef,
  objectBindingPatternDef,
  objectExpressionDef,
  operationDef,
  outputDef,
  parameterDef,
  propertyDef,
  rawExpressionDef,
  requestBodyDef,
  responseDef,
  schemaDef,
  sourceDef,
  spreadDef,
  textDef,
  typeArrayDef,
  typeDef,
  typeIntersectionDef,
  typeKeywordDef,
  typeLiteralDef,
  typeLiteralTypeDef,
  typeObjectDef,
  typeOmitDef,
  typeReferenceDef,
  typeTupleDef,
  typeUnionDef,
  typeUrlTemplateDef,
}

/**
 * Every node definition. Adding a node means adding its `defineNode` to one
 * `nodes/*.ts` file and listing it here. The visitor tables in `visitor.ts` derive from it.
 */
export const nodeDefs = [
  inputDef,
  outputDef,
  operationDef,
  requestBodyDef,
  contentDef,
  responseDef,
  schemaDef,
  propertyDef,
  parameterDef,
  functionParameterDef,
  functionParametersDef,
  typeLiteralDef,
  indexedAccessTypeDef,
  objectBindingPatternDef,
  constDef,
  typeDef,
  functionDef,
  arrowFunctionDef,
  textDef,
  breakDef,
  jsxDef,
  importDef,
  exportDef,
  sourceDef,
  fileDef,
  identifierDef,
  literalDef,
  memberDef,
  callDef,
  objectExpressionDef,
  arrayExpressionDef,
  arrowExpressionDef,
  spreadDef,
  asDef,
  rawExpressionDef,
  typeKeywordDef,
  typeReferenceDef,
  typeLiteralTypeDef,
  typeArrayDef,
  typeUnionDef,
  typeIntersectionDef,
  typeTupleDef,
  typeObjectDef,
  typeUrlTemplateDef,
  typeOmitDef,
] satisfies ReadonlyArray<NodeDef>
