import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Format-agnostic metadata about the API document.
 * Adapters populate whichever fields are available in their source format.
 */
export type RootMeta = {
  /** API title (from `info.title` in OAS/AsyncAPI). */
  title?: string
  /** API version string (from `info.version` in OAS/AsyncAPI). */
  version?: string
  /**
   * Resolved base URL for the API.
   * OAS: derived from `servers[serverIndex].url` with variable substitution.
   * AsyncAPI: derived from `servers[serverIndex].url`.
   * Drizzle / schema-only formats: not set.
   */
  baseURL?: string
}

/**
 * Top-level container for all schemas and operations in a single API document.
 */
export type RootNode = BaseNode & {
  kind: 'Root'
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
  /** Format-agnostic document metadata populated by the adapter. */
  meta?: RootMeta
}
