export { httpMethods, schemaTypes } from './constants.ts'
export { applyDedupe, buildDedupePlan } from './dedupe.ts'
export { defineSchemaDialect } from './dialect.ts'
// Node constructors, also published as the `@kubb/ast/factory` subpath, mirroring `ts.factory.createX`.
export * as factory from './factory.ts'
export { isHttpOperationNode, narrowSchema } from './guards.ts'
export { applyMacros, composeMacros, defineMacro } from './macro.ts'
export type { Macro } from './macro.ts'
export { defineNode } from './node.ts'
export type { NodeDef } from './node.ts'
export { syncOptionality } from './node.ts'
// Every node def plus `nodeDefs` in one line, so adding a node never edits this barrel. The visitor
// tables derived from `nodeDefs` stay internal to `visitor.ts`.
export * from './registry.ts'
export { createPrinterFactory, definePrinter } from './printer.ts'
export { signatureOf } from './signature.ts'
export type * from './types.ts'
// The node/AST helpers in ./utils/ live on the `@kubb/ast/utils` subpath, not the root barrel.
export { extractStringsFromNodes } from './utils/extractStringsFromNodes.ts'
export { collect, transform, walk } from './visitor.ts'
