import { type Diagnostic, Diagnostics } from '@kubb/core'
import { isReference } from './oas.ts'
import type { Document } from './types.ts'

const _refCache = new WeakMap<Document, Map<string, unknown>>()

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
  const origRef = $ref
  $ref = $ref.trim()
  if ($ref === '') {
    return null
  }
  if (!$ref.startsWith('#')) return null
  $ref = globalThis.decodeURIComponent($ref.substring(1))

  let docCache = _refCache.get(document)
  if (!docCache) {
    docCache = new Map()
    _refCache.set(document, docCache)
  }

  if (docCache.has($ref)) {
    return docCache.get($ref) as T
  }

  const current = $ref
    .split('/')
    .filter(Boolean)
    .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], document as unknown)

  if (!current) {
    const diagnostic: Diagnostic = {
      code: Diagnostics.code.refNotFound,
      severity: 'error',
      message: `Could not find a definition for ${origRef}.`,
      help: 'Add the schema under `components.schemas`, or fix the `$ref`. Run `kubb validate` to check the spec.',
      location: { kind: 'schema', pointer: origRef, ref: origRef },
    }
    // Report the unresolved ref into the active build and resolve to null, like any
    // other unresolvable ref. The build collects it and keeps going. Outside a build there is no
    // sink, so throw rather than silently returning null.
    if (!Diagnostics.report(diagnostic)) {
      throw new Diagnostics.Error(diagnostic)
    }
    return null
  }

  docCache.set($ref, current)
  return current as T
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
 * Resolves a `$ref` slot in place: when `container[key]` holds a `$ref`, replaces it with the
 * resolved value and returns that value. Returns `null` when the slot is empty, cannot be resolved,
 * or is still a `$ref` after resolving. A non-`$ref` value is returned untouched, without writing.
 *
 * @example
 * ```ts
 * derefInPlace<ResponseObject>({ document, container: operation.schema.responses, key: '200' })
 * ```
 */
export function derefInPlace<T = unknown>({
  document,
  container,
  key,
}: {
  document: Document
  container: Record<string, unknown>
  key: string | number
}): T | null {
  const value = container[key]
  if (!isReference(value)) {
    return value ? (value as T) : null
  }

  const resolved = resolveRef<T>(document, value.$ref)
  container[key] = resolved
  return resolved && !isReference(resolved) ? resolved : null
}
