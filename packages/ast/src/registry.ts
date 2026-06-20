import type { NodeDef } from './defineNode.ts'
import { arrowFunctionDef, breakDef, constDef, functionDef, jsxDef, textDef, typeDef } from './nodes/code.ts'
import { contentDef } from './nodes/content.ts'
import { exportDef, fileDef, importDef, sourceDef } from './nodes/file.ts'
import { inputDef } from './nodes/input.ts'
import { operationDef } from './nodes/operation.ts'
import { outputDef } from './nodes/output.ts'
import { parameterDef } from './nodes/parameter.ts'
import { propertyDef } from './nodes/property.ts'
import { requestBodyDef } from './nodes/requestBody.ts'
import { responseDef } from './nodes/response.ts'
import { schemaDef } from './nodes/schema.ts'

// Surface every def from one place so the package barrel re-exports them with `export * from './registry.ts'`.
// Adding a node means adding its `defineNode` to a `nodes/*.ts` file and listing it in `nodeDefs` below, nothing else.
export {
  arrowFunctionDef,
  breakDef,
  constDef,
  contentDef,
  exportDef,
  fileDef,
  functionDef,
  importDef,
  inputDef,
  jsxDef,
  operationDef,
  outputDef,
  parameterDef,
  propertyDef,
  requestBodyDef,
  responseDef,
  schemaDef,
  sourceDef,
  textDef,
  typeDef,
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
] satisfies ReadonlyArray<NodeDef>
