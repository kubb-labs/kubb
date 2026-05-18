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
 * Streaming variant of `InputNode` for memory-efficient processing of large API specs.
 *
 * `schemas` and `operations` are `AsyncIterable` rather than arrays — each `for await`
 * loop creates a fresh parse pass from the cached in-memory document, so multiple
 * consumers (plugins) can iterate independently without keeping all nodes in memory.
 *
 * @example
 * ```ts
 * for await (const schema of inputStreamNode.schemas) {
 *   // only this one SchemaNode is live here; previous ones are GC-eligible
 * }
 * ```
 */
export type InputStreamNode = {
  kind: 'Input'
  /** Lazily parsed schema nodes. Each `for await` creates a fresh parse pass. */
  schemas: AsyncIterable<SchemaNode>
  /** Lazily parsed operation nodes. Each `for await` creates a fresh parse pass. */
  operations: AsyncIterable<OperationNode>
  /** Document metadata — available immediately, before the first yield. */
  meta?: InputMeta
}
