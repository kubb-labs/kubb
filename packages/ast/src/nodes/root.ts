import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 *
 * All fields are plain JSON-serializable values — no `Set`, no `Map`, no class instances.
 * Computed fields (`circularNames`, `enumNames`) are pre-calculated once during the adapter
 * pre-scan so generators never need to iterate the full schema list themselves.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet Store', version: '1.0.0', baseURL: 'https://petstore.swagger.io/v2', circularNames: [], enumNames: [] }
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
  baseURL?: string | null
  /**
   * Names of schemas that participate in a circular reference chain.
   * Computed once during the adapter pre-scan — use this instead of calling
   * `findCircularSchemas` per generator call.
   *
   * Convert to a `Set` once at the start of a generator, not per-schema,
   * to keep lookup O(1) without repeated allocations.
   *
   * @example Wrap a circular schema in z.lazy()
   * ```ts
   * const circular = new Set(meta.circularNames)
   * if (circular.has(schema.name)) { ... }
   * ```
   */
  circularNames: ReadonlyArray<string>
  /**
   * Names of schemas whose type is `enum`.
   * Computed once during the adapter pre-scan — use this instead of filtering
   * schemas per generator call.
   *
   * Convert to a `Set` once at the start of a generator when you need repeated
   * membership checks, rather than calling `.includes()` per schema.
   *
   * @example Check if a referenced schema is an enum
   * `const enums = new Set(meta.enumNames)`
   * `const isEnum = enums.has(schemaName)`
   */
  enumNames: ReadonlyArray<string>
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
   * Document metadata populated by the adapter.
   */
  meta: InputMeta
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
