import type { Streamable } from '@internals/utils'
import { defineNode } from '../node.ts'
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
}

/**
 * Input AST node that contains all schemas and operations for one API document.
 * Produced by the adapter and consumed by all Kubb plugins.
 *
 * `Stream` switches `schemas` and `operations` between eager `Array`s (the default) and lazy
 * `AsyncIterable`s. The streaming variant `InputNode<true>` yields nodes one at a time.
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
 *
 * @example Streaming variant for large specs
 * ```ts
 * for await (const schema of inputNode.schemas) {
 *   // only this one SchemaNode is live here. Previous ones are GC-eligible
 * }
 * ```
 */
export type InputNode<Stream extends boolean = false> = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Input'
  /**
   * All schema nodes in the document.
   */
  schemas: Streamable<SchemaNode, Stream>
  /**
   * All operation nodes in the document.
   */
  operations: Streamable<OperationNode, Stream>
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
 * Creates an `InputNode`. Pass `stream: true` for the streaming variant whose `schemas` and
 * `operations` are `AsyncIterable` sources. Otherwise it builds the eager variant with array
 * `schemas`/`operations`. Both variants get the defaulted `meta`.
 *
 * @example Eager
 * ```ts
 * const input = createInput()
 * // { kind: 'Input', schemas: [], operations: [] }
 * ```
 *
 * @example Streaming
 * ```ts
 * const node = createInput({ stream: true, schemas: schemasIterable, operations: operationsIterable, meta: { title: 'My API' } })
 * ```
 */
export function createInput<Stream extends boolean = false>(options: Partial<Omit<InputNode<Stream>, 'kind'>> & { stream?: Stream } = {}): InputNode<Stream> {
  const { stream, ...overrides } = options
  // Streaming inputs carry AsyncIterable sources, so skip the array defaults that
  // inputDef.create applies for the eager variant. Keep the meta default.
  if (stream) {
    return { kind: 'Input', meta: { circularNames: [], enumNames: [] }, ...overrides } as InputNode<Stream>
  }

  return inputDef.create(overrides as Partial<Omit<InputNode, 'kind'>>) as InputNode<Stream>
}
