import jsonpointer from 'jsonpointer'
import { isReference } from './guards.ts'
import type { Document } from './types.ts'

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
  if ($ref === '') {
    return null
  }
  if ($ref.startsWith('#')) {
    $ref = globalThis.decodeURIComponent($ref.substring(1))
  } else {
    return null
  }
  const current = jsonpointer.get(document, $ref)

  if (!current) {
    throw new Error(`Could not find a definition for ${origRef}.`)
  }
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
