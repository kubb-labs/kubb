import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 * All fields are plain JSON-serializable values, no `Set`, no `Map`, no class instances.
 */
export type InputMeta = {
  /** `info.title` from the source document. */
  title?: string
  /** `info.description` from the source document. */
  description?: string
  /** `info.version` from the source document. */
  version?: string
  /** Resolved base URL from the first matching server entry in the source document. */
  baseURL?: string | null
  /**
   * Names of schemas that participate in a circular reference chain, computed once during the
   * adapter pre-scan so a generator never calls `findCircularSchemas` itself. Convert to a `Set`
   * once at the start of a generator, not per schema.
   */
  circularNames: ReadonlyArray<string>
  /**
   * Names of schemas whose type is `enum`, computed once during the adapter pre-scan. Convert to
   * a `Set` once at the start of a generator when you need repeated membership checks.
   */
  enumNames: ReadonlyArray<string>
}

/** All schemas and operations for one API document. Produced by the adapter and consumed by all Kubb plugins. */
export type InputNode = BaseNode & {
  kind: 'Input'
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
  meta: InputMeta
}

/**
 * Creates an `InputNode`, defaulting `schemas`/`operations` to empty arrays and `meta` to empty
 * name lists. Every call allocates fresh defaults so no two inputs share them.
 */
export function createInput(overrides: Partial<Omit<InputNode, 'kind'>> = {}): InputNode {
  return { schemas: [], operations: [], meta: { circularNames: [], enumNames: [] }, ...overrides, kind: 'Input' }
}
