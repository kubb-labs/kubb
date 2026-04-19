/**
 * TypeScript ambient declarations for Kubb virtual modules.
 *
 * Add to your tsconfig.json to enable types for kubb:* imports:
 *   { "compilerOptions": { "types": ["@kubb/core/virtual-modules"] } }
 *
 * Or add a reference in a .d.ts file in your project:
 *   /// <reference types="@kubb/core/virtual-modules" />
 *
 * The virtual module loader must be registered for runtime use:
 *   node --import @kubb/core/register
 */

declare module 'kubb:spec' {
  import type { OperationNode, SchemaNode } from '@kubb/ast'
  import type { InputMeta } from '@kubb/ast'

  /** Returns all schema nodes from the parsed OpenAPI spec. */
  export function getSchemas(): Array<SchemaNode>

  /** Returns the schema node with the given name, or undefined. */
  export function getSchema(name: string): SchemaNode | undefined

  /** Returns all operation nodes from the parsed spec. */
  export function getOperations(): Array<OperationNode>

  /** Returns the operation node with the given operationId, or undefined. */
  export function getOperation(operationId: string): OperationNode | undefined

  /** Returns all operations that carry the given tag. */
  export function getOperationsByTag(tag: string): Array<OperationNode>

  /**
   * Returns the node currently being processed (schema or operation).
   * Returns null during the operations-batch (operations()) call.
   */
  export function getCurrentNode(): SchemaNode | OperationNode | null

  /** Returns the InputNode metadata (title, version, baseURL, description). */
  export function getInputMeta(): InputMeta | undefined
}

declare module 'kubb:outputs' {
  import type { ImportNode } from '@kubb/ast'
  import type { OutputEntry } from '@kubb/core'

  /**
   * Queries the OutputRegistry and returns all matching entries.
   * Only plugins that tagged their files with `meta: { kind: '...' }` appear here.
   */
  export function queryOutputs(filter: Partial<Pick<OutputEntry, 'nodeId' | 'nodeKind' | 'plugin' | 'kind'>>): Array<OutputEntry>

  /**
   * Resolves a cross-plugin output to a ready-to-use ImportNode.
   *
   * @example
   * // Get the TypeScript type for the Pet schema from plugin-ts,
   * // as an import relative to the current file being generated:
   * const imp = resolveImport({ schema: 'Pet', plugin: 'plugin-ts', kind: 'type', from: myFilePath })
   * // imp → { name: ['Pet'], path: '../types/pet.ts', isTypeOnly: true }
   */
  export function resolveImport(query: { schema?: string; operation?: string; plugin: string; kind?: string; from: string }): ImportNode | null
}
