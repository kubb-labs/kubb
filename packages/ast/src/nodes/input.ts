import { defineNode } from '../defineNode.ts'
import type { BaseNode } from './base.ts'
import type { OperationNode } from './operation.ts'
import type { SchemaNode } from './schema.ts'

/**
 * Metadata for an API document, populated by the adapter and available to every generator.
 *
 * All fields are plain JSON-serializable values, no `Set`, no `Map`, no class instances.
 * Computed fields (`circularNames`, `enumNames`) are pre-calculated once during the adapter
 * pre-scan so generators never need to iterate the full schema list themselves.
 *
 * @example
 * ```ts
 * const meta: InputMeta = { title: 'Pet Store', version: '1.0.0', baseURL: 'https://api.example.com/v2', circularNames: [], enumNames: [] }
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
   * Computed once during the adapter pre-scan, so a generator never has to
   * call `findCircularSchemas` itself.
   *
   * Convert to a `Set` once at the start of a generator, not per-schema,
   * so lookups stay O(1) without repeated allocations.
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
   * Computed once during the adapter pre-scan, so a generator never has to
   * filter the schema list itself.
   *
   * Convert to a `Set` once at the start of a generator when you need repeated
   * membership checks, so each check stays O(1) instead of an array scan.
   *
   * @example Check if a referenced schema is an enum
   * `const enums = new Set(meta.enumNames)`
   * `const isEnum = enums.has(schemaName)`
   */
  enumNames: ReadonlyArray<string>
  /**
   * Maps a renamed component pointer (e.g. `#/components/schemas/Order`) to the
   * collision-corrected schema name the adapter emits (e.g. `OrderSchema`).
   * Populated by the adapter during parsing, so `resolver.imports` can resolve a raw
   * `$ref` to the name of the file that is actually generated. Refs that keep their
   * pointer's last segment as their name are not recorded, so the record stays empty
   * (or absent) for documents without renames.
   */
  nameMapping?: Readonly<Record<string, string>>
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
 *   meta: { circularNames: [], enumNames: [] },
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
 * Definition for the {@link InputNode}.
 */
export const inputDef = defineNode<InputNode, Partial<Omit<InputNode, 'kind'>>>({
  kind: 'Input',
  defaults: { schemas: [], operations: [], meta: { circularNames: [], enumNames: [] } },
  children: ['schemas', 'operations'],
  visitorKey: 'input',
})

/**
 * Creates an `InputNode`, defaulting `schemas`/`operations` to empty arrays and `meta` per
 * {@link inputDef}.
 *
 * @example
 * ```ts
 * const input = createInput()
 * // { kind: 'Input', schemas: [], operations: [] }
 * ```
 */
export function createInput(overrides: Partial<Omit<InputNode, 'kind'>> = {}): InputNode {
  return inputDef.create(overrides)
}
