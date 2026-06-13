import type { NodeDef } from './node.ts'
import { arrowFunctionDef, breakDef, constDef, functionDef, jsxDef, textDef, typeDef } from './nodes/code.ts'
import { contentDef } from './nodes/content.ts'
import { exportDef, fileDef, importDef, sourceDef } from './nodes/file.ts'
import { functionParameterDef, functionParametersDef, parameterGroupDef, paramsTypeDef } from './nodes/function.ts'
import type { Node, NodeKind } from './nodes/index.ts'
import { inputDef } from './nodes/input.ts'
import { operationDef } from './nodes/operation.ts'
import { outputDef } from './nodes/output.ts'
import { parameterDef } from './nodes/parameter.ts'
import { propertyDef } from './nodes/property.ts'
import { requestBodyDef } from './nodes/requestBody.ts'
import { responseDef } from './nodes/response.ts'
import { schemaDef } from './nodes/schema.ts'

/**
 * Every node definition. Adding a node means adding its `defineNode` to one
 * `nodes/*.ts` file and listing it here. The visitor tables below derive from it.
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
  parameterGroupDef,
  functionParametersDef,
  paramsTypeDef,
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

/**
 * Child node fields per node kind, in traversal order (Babel's `VISITOR_KEYS`).
 * Derived from each definition's `children`.
 */
export const VISITOR_KEYS = Object.fromEntries(nodeDefs.flatMap((def) => (def.children ? [[def.kind, def.children] as const] : []))) as Partial<
  Record<NodeKind, ReadonlyArray<string>>
>

/**
 * Maps a node kind to the matching visitor callback name. Derived from each
 * definition's `visitorKey`.
 */
export const VISITOR_KEY_BY_KIND = Object.fromEntries(nodeDefs.flatMap((def) => (def.visitorKey ? [[def.kind, def.visitorKey] as const] : []))) as Partial<
  Record<NodeKind, NonNullable<NodeDef['visitorKey']>>
>

/**
 * Per-kind builders rerun after children are rebuilt. Derived from each
 * definition's `finalize`.
 */
export const nodeFinalizers = Object.fromEntries(
  nodeDefs.flatMap((def) => (def.finalize ? [[def.kind, def.create as unknown as (node: Node) => Node] as const] : [])),
) as Partial<Record<NodeKind, (node: Node) => Node>>
