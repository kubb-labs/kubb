import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Basic metadata for an API document.
 * Adapters fill fields that exist in their source format.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet API', version: '1.0.0' }
 * ```
 */
export type InputMeta = {
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
 * @deprecated Use `InputMeta` instead.
 */
export type RootMeta = InputMeta

/**
 * Input AST node that contains all schemas and operations for one API document.
 * Produced by the adapter and consumed by all Kubb plugins.
 *
 * @example
 * ```ts
 * const input: InputNode = {
 *   kind: 'Input',
 *   schemas: [],
 *   operations: [],
 * }
 * ```
 */
export type InputNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Input'
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
  meta?: InputMeta
}

/**
 * @deprecated Use `InputNode` instead.
 */
export type RootNode = InputNode
