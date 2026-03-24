import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Basic metadata for an API document.
 * Adapters fill fields that exist in their source format.
 *
 * @example
 * ```ts
 * const meta: RootMeta = { title: 'Pet API', version: '1.0.0' }
 * ```
 */
export type RootMeta = {
  /**
   * API title (from `info.title` in OAS/AsyncAPI).
   */
  title?: string
  /**
   * API description (from `info.description` in OAS/AsyncAPI).
   */
  description?: string
  /**
   * API version string (from `info.version` in OAS/AsyncAPI).
   */
  version?: string
  /**
   * Resolved API base URL.
   * For OpenAPI and AsyncAPI, this comes from the selected server URL.
   */
  baseURL?: string
}

/**
 * Root AST node that contains all schemas and operations for one API document.
 *
 * @example
 * ```ts
 * const root: RootNode = {
 *   kind: 'Root',
 *   schemas: [],
 *   operations: [],
 * }
 * ```
 */
export type RootNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Root'
  /**
   * All schema nodes in the document.
   */
  schemas: Array<SchemaNode>
  /**
   * All operation nodes in the document.
   */
  operations: Array<OperationNode>
  /**
   * Optional document metadata populated by the adapter.
   */
  meta?: RootMeta
}
