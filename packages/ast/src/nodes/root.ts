import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 *
 * All fields are optional strings so `InputMeta` is always JSON-serializable.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet Store', version: '1.0.0', baseURL: 'https://petstore.swagger.io/v2' }
 * ```
 */
export type InputMeta = {
  /**
   * API title from `info.title` in the source document.
   */
  title?: string
  /**
   * API description from `info.description` in the source document.
   */
  description?: string
  /**
   * API version string from `info.version` in the source document.
   */
  version?: string
  /**
   * Resolved base URL from the first matching server entry in the source document.
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
  /**
   * Lazily parsed schema nodes. Each `for await` creates a fresh parse pass, so
   * multiple plugins can iterate independently without sharing state.
   */
  schemas: AsyncIterable<SchemaNode>
  /**
   * Lazily parsed operation nodes. Each `for await` creates a fresh parse pass, so
   * multiple plugins can iterate independently without sharing state.
   */
  operations: AsyncIterable<OperationNode>
  /**
   * Document metadata available immediately, before the first yielded node.
   */
  meta?: InputMeta
}
