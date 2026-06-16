import type { Node } from './nodes/index.ts'

// Node constructors, grouped under the `factory` namespace the way the TypeScript compiler exposes
// `ts.factory.createX`. Aggregating them here lets `export * as factory from './factory.ts'` in the
// barrel surface every `createX` alongside the `createFile`/`update` helpers from a single module.
export { createArrowFunction, createBreak, createConst, createFunction, createJsx, createText, createType } from './nodes/code.ts'
export { createContent } from './nodes/content.ts'
export { createExport, createFile, createImport, createSource } from './nodes/file.ts'
export type { UserFileNode } from './nodes/file.ts'
export { createFunctionParameter, createFunctionParameters, createIndexedAccessType, createObjectBindingPattern, createTypeLiteral } from './nodes/function.ts'
export { createInput } from './nodes/input.ts'
export { createOperation } from './nodes/operation.ts'
export { createOutput } from './nodes/output.ts'
export { createParameter } from './nodes/parameter.ts'
export { createProperty } from './nodes/property.ts'
export { createRequestBody } from './nodes/requestBody.ts'
export { createResponse } from './nodes/response.ts'
export { createSchema } from './nodes/schema.ts'

/**
 * Identity-preserving node update: returns `node` unchanged when every field in
 * `changes` already equals (by reference) the current value, otherwise a new node
 * with the changes applied.
 *
 * Mirrors the TypeScript compiler's `factory.updateX` contract. Pair it with the
 * structural sharing in {@link transform} so a no-op rewrite does not allocate and
 * downstream passes can detect "nothing changed" by identity. Comparison is shallow,
 * so a structurally equal but newly allocated array or object counts as a change.
 *
 * @example
 * ```ts
 * update(node, { name: node.name })        // -> same `node` reference
 * update(node, { name: 'renamed' })        // -> new node, `name` replaced
 * ```
 */
export function update<T extends Node>(node: T, changes: Partial<T>): T {
  for (const key in changes) {
    if (changes[key] !== node[key as keyof T]) {
      return { ...node, ...changes }
    }
  }

  return node
}
