import type { ast } from '@kubb/ast'
import { type Diagnostic, Diagnostics } from '@kubb/core'
import { isReference } from './oas.ts'
import type { Document, SchemaObject } from './types.ts'

const _refCache = new WeakMap<Document, Map<string, unknown>>()

/**
 * Walks a local `#/...` JSON pointer against `document`, memoized per document. `applicable` is
 * `false` for an empty or non-local ref (the caller should not treat that as a failed lookup).
 * Shared by `resolveRef`'s reporting walk and `createRefs().resolve`'s silent walk, so both use
 * the same trimming and caching instead of two separate implementations.
 */
function walkPointer<T>(document: Document, $ref: string): { applicable: boolean; value: T | null } {
  const trimmed = $ref.trim()
  if (trimmed === '' || !trimmed.startsWith('#')) {
    return { applicable: false, value: null }
  }
  const pointer = globalThis.decodeURIComponent(trimmed.substring(1))

  let docCache = _refCache.get(document)
  if (!docCache) {
    docCache = new Map()
    _refCache.set(document, docCache)
  }

  if (docCache.has(pointer)) {
    return { applicable: true, value: docCache.get(pointer) as T }
  }

  const current = pointer
    .split('/')
    .filter(Boolean)
    .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], document as unknown)

  if (current) {
    docCache.set(pointer, current)
  }

  return { applicable: true, value: (current as T) ?? null }
}

/**
 * Resolves a local JSON pointer reference from a document.
 *
 * Accepts `#/...` refs. Returns `null` for an empty or non-local ref. When the pointer cannot be
 * resolved, reports a `refNotFound` diagnostic into the active build and returns `null`. Outside a
 * build there is no sink to collect it, so it throws instead.
 *
 * @example
 * ```ts
 * resolveRef<SchemaObject>(document, '#/components/schemas/Pet')
 * ```
 */
export function resolveRef<T = unknown>(document: Document, $ref: string): T | null {
  const { applicable, value } = walkPointer<T>(document, $ref)
  if (!applicable) return null
  if (value) return value

  const diagnostic: Diagnostic = {
    code: Diagnostics.code.refNotFound,
    severity: 'error',
    message: `Could not find a definition for ${$ref}.`,
    help: 'Add the schema under `components.schemas`, or fix the `$ref`. Run `kubb validate` to check the spec.',
    location: { kind: 'schema', pointer: $ref, ref: $ref },
  }
  // Report the unresolved ref into the active build and resolve to null, like any
  // other unresolvable ref. The build collects it and keeps going. Outside a build there is no
  // sink, so throw rather than silently returning null.
  if (!Diagnostics.report(diagnostic)) {
    throw new Diagnostics.Error(diagnostic)
  }
  return null
}

/**
 * Resolves a `$ref` object while preserving the original `$ref` field on the result.
 *
 * Useful for parser flows that need both dereferenced fields and pointer
 * identity (for naming/import purposes). Non-reference values are returned as-is.
 *
 * @example
 * ```ts
 * dereferenceWithRef(document, { $ref: '#/components/schemas/Pet' })
 * // { $ref: '#/components/schemas/Pet', type: 'object', properties: { ... } }
 * ```
 */
export function dereferenceWithRef<T = unknown>(document: Document, schema?: T): T {
  if (isReference(schema)) {
    return {
      ...schema,
      ...resolveRef(document, schema.$ref),
      $ref: schema.$ref,
    }
  }

  return schema as T
}

/**
 * Parses a schema for a resolved `$ref` target. Passed in at call time (rather than imported)
 * so `refs.ts` stays independent of the parser/converter layer.
 */
type RefNodeParser = (entry: { schema: SchemaObject; name?: string | null }, rawOptions?: Partial<ast.ParserOptions>) => ast.SchemaNode

/**
 * The `$ref` service bound to one document: pointer resolution, existence checks, and
 * resolved-node parsing, each with its own instance-scoped memoization.
 */
export type Refs = ReturnType<typeof createRefs>

/**
 * Creates the `$ref` resolution service for one document.
 *
 * Replaces what used to be six overlapping resolvers (a reporting walk, a silent walk, an
 * existence check, and a resolve-then-parse-into-a-node step, each with its own cache) with one
 * pointer walk and one explicit `report` contract for a missing ref: `report: true` (the default)
 * reports a `refNotFound` diagnostic (or throws outside a build), `report: false` resolves to
 * `null` silently for a speculative lookup.
 *
 * @example
 * ```ts
 * const refs = createRefs(document)
 * refs.resolve<SchemaObject>('#/components/schemas/Pet')
 * refs.resolve<SchemaObject>('#/components/schemas/Pet', { report: false })
 * refs.exists('#/components/schemas/Pet')
 * refs.resolveNode('#/components/schemas/Pet', parseSchema)
 * refs.deref<ResponseObject>(operation.schema.responses?.['200'])
 * ```
 */
export function createRefs(document: Document) {
  const resolvedNodeCache = new Map<string, ast.SchemaNode | null>()
  const existenceCache = new Map<string, boolean>()
  const resolvingRefs = new Set<string>()

  /**
   * Resolves a local `#/...` JSON pointer. Returns `null` for an empty or non-local ref.
   * `report: true` (default) reports a `refNotFound` diagnostic into the active build (or throws
   * outside one) when the pointer cannot be resolved. `report: false` resolves to `null` silently,
   * for a speculative lookup where a missing ref is not an error.
   */
  function resolve<T = unknown>(refPath: string, options?: { report?: boolean }): T | null {
    if (options?.report === false) {
      const { applicable, value } = walkPointer<T>(document, refPath)
      return applicable ? value : null
    }

    return resolveRef<T>(document, refPath)
  }

  /**
   * Returns `true` when a `$ref` path resolves to a component the document actually defines.
   * A circular ref still resolves to an existing target, so this stays `true` for cycles and only
   * goes `false` for a `$ref` that points at a component the spec never declares. Memoized.
   */
  function exists(refPath: string): boolean {
    if (!existenceCache.has(refPath)) {
      existenceCache.set(refPath, !!resolve(refPath, { report: false }))
    }
    return existenceCache.get(refPath) ?? false
  }

  /**
   * Resolves a `$ref` to its parsed node via `parse`, guarding against cycles and memoizing per
   * instance. Returns `null` when the ref is currently being resolved (a cycle) or cannot be
   * resolved (e.g. a minimal document in a unit test).
   */
  function resolveNode(refPath: string, parse: RefNodeParser, rawOptions?: Partial<ast.ParserOptions>): ast.SchemaNode | null {
    if (resolvingRefs.has(refPath)) return null

    if (!resolvedNodeCache.has(refPath)) {
      let resolved: ast.SchemaNode | null = null
      try {
        const referenced = resolve<SchemaObject>(refPath)
        if (referenced) {
          resolvingRefs.add(refPath)
          resolved = parse({ schema: referenced }, rawOptions)
          resolvingRefs.delete(refPath)
        }
      } catch {
        // Ref cannot be resolved in this document (e.g. unit tests with minimal documents).
      }
      resolvedNodeCache.set(refPath, resolved)
    }

    return resolvedNodeCache.get(refPath) ?? null
  }

  /**
   * Resolves a `$ref` value without mutating anything: when `value` holds a `$ref`, returns the
   * resolved target. Returns `null` when the value is empty, cannot be resolved, or is still a
   * `$ref` after resolving (e.g. a document with no component registry). A non-`$ref` value is
   * returned as-is.
   *
   * @example
   * ```ts
   * refs.deref<ResponseObject>(operation.schema.responses?.['200'])
   * ```
   */
  function deref<T = unknown>(value: unknown): T | null {
    if (!isReference(value)) {
      return value ? (value as T) : null
    }

    const resolved = resolve<T>(value.$ref)
    return resolved && !isReference(resolved) ? resolved : null
  }

  return { resolve, exists, resolveNode, deref }
}
