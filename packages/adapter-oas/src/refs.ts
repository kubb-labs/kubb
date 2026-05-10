import { isReference } from './guards.ts'
import type { Document } from './types.ts'

const refCache = new WeakMap<Document, Map<string, unknown | null>>()

/**
 * Resolves a local JSON pointer reference from a document.
 *
 * Accepts `#/...` refs. Returns `null` for empty or non-local refs.
 * Throws when the pointer cannot be resolved.
 *
 * @example
 * ```ts
 * resolveRef<SchemaObject>(document, '#/components/schemas/Pet') // SchemaObject | null
 * ```
 */
export function resolveRef<T = unknown>(document: Document, $ref: string): T | null {
  const origRef = $ref
  $ref = $ref.trim()
  const documentCache = refCache.get(document)
  if (documentCache?.has($ref)) {
    return documentCache.get($ref) as T | null
  }

  if ($ref === '') {
    cacheRef(document, $ref, null)
    return null
  }
  if ($ref.startsWith('#')) {
    $ref = globalThis.decodeURIComponent($ref.substring(1))
  } else {
    cacheRef(document, $ref, null)
    return null
  }
  const current = $ref
    .split('/')
    .filter(Boolean)
    .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], document as unknown)

  if (!current) {
    throw new Error(`Could not find a definition for ${origRef}.`)
  }
  cacheRef(document, origRef.trim(), current)
  return current as T
}

function cacheRef(document: Document, $ref: string, value: unknown | null): void {
  const documentCache = refCache.get(document) ?? new Map<string, unknown | null>()
  documentCache.set($ref, value)
  refCache.set(document, documentCache)
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
