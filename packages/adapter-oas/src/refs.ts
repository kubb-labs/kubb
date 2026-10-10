import { type Diagnostic, Diagnostics } from '@kubb/kit'
import type { ast } from '@kubb/kit'
import { isReference } from './oas.ts'
import type { Document, SchemaObject } from './types.ts'

/**
 * Parses a schema for a resolved `$ref` target. Passed in at call time (rather than imported)
 * so `refs.ts` stays independent of the parser/converter layer.
 */
type RefNodeParser = (entry: { schema: SchemaObject; name?: string | null }) => ast.SchemaNode

/**
 * The `$ref` service bound to one document: pointer resolution, existence checks, and
 * resolved-node parsing, each with its own instance-scoped memoization.
 */
export type Refs = ReturnType<typeof createRefs>

/**
 * Creates the `$ref` resolution service for one document. One pointer walk backs every method.
 *
 * @example
 * ```ts
 * const refs = createRefs(document)
 * refs.resolve<SchemaObject>('#/components/schemas/Pet')
 * refs.resolve<SchemaObject>('#/components/schemas/Pet', { report: false })
 * refs.exists('#/components/schemas/Pet')
 * refs.resolveNode('#/components/schemas/Pet', parseSchema)
 * refs.deref<ResponseObject>(operation.schema.responses?.['200'])
 * refs.derefKeepingRef(parameter)
 * ```
 */
export function createRefs(document: Document) {
  const pointerCache = new Map<string, unknown>()
  const resolvedNodeCache = new Map<string, ast.SchemaNode | null>()
  const resolvingRefs = new Set<string>()

  function walkPointer<T>($ref: string): { applicable: boolean; value: T | null } {
    const trimmed = $ref.trim()
    if (trimmed === '' || !trimmed.startsWith('#')) {
      return { applicable: false, value: null }
    }
    const pointer = trimmed.substring(1)

    if (pointerCache.has(pointer)) {
      return { applicable: true, value: pointerCache.get(pointer) as T }
    }

    // Split before decoding so an encoded `%2F` stays inside its token, then unescape `~1` and `~0` (RFC 6901).
    const current = pointer
      .split('/')
      .filter(Boolean)
      .map((token) => globalThis.decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~'))
      .reduce((obj: unknown, key: string) => (obj as Record<string, unknown>)?.[key], document as unknown)

    if (current) {
      pointerCache.set(pointer, current)
    }

    return { applicable: true, value: (current as T) ?? null }
  }

  /**
   * Resolves a local `#/...` JSON pointer. Returns `null` for an empty or non-local ref.
   * `report: true` (default) reports a `refNotFound` diagnostic into the active build (or throws
   * outside one) when the pointer cannot be resolved. `report: false` resolves to `null` silently,
   * for a speculative lookup where a missing ref is not an error.
   */
  function resolve<T = unknown>(refPath: string, options?: { report?: boolean }): T | null {
    const { applicable, value } = walkPointer<T>(refPath)
    if (!applicable || value || options?.report === false) return value

    const diagnostic: Diagnostic = {
      code: Diagnostics.code.refNotFound,
      severity: 'error',
      message: `Could not find a definition for ${refPath}.`,
      help: 'Add the schema under `components.schemas`, or fix the `$ref`. Run `kubb validate` to check the spec.',
      location: { kind: 'schema', pointer: refPath, ref: refPath },
    }
    if (!Diagnostics.report(diagnostic)) {
      throw new Diagnostics.Error(diagnostic)
    }
    return null
  }

  /**
   * Returns `true` when a `$ref` path resolves to a component the document actually defines.
   * A circular ref still resolves to an existing target, so this stays `true` for cycles and only
   * goes `false` for a `$ref` that points at a component the spec never declares.
   */
  function exists(refPath: string): boolean {
    return !!resolve(refPath, { report: false })
  }

  /**
   * Resolves a `$ref` to its parsed node via `parse`, guarding against cycles and memoizing per
   * instance. Returns `null` when the ref is currently being resolved (a cycle) or cannot be
   * resolved (e.g. a minimal document in a unit test).
   */
  function resolveNode(refPath: string, parse: RefNodeParser): ast.SchemaNode | null {
    if (resolvingRefs.has(refPath)) return null

    if (!resolvedNodeCache.has(refPath)) {
      let resolved: ast.SchemaNode | null = null
      try {
        const referenced = resolve<SchemaObject>(refPath)
        if (referenced) {
          resolvingRefs.add(refPath)
          resolved = parse({ schema: referenced })
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
   */
  function deref<T = unknown>(value: unknown): T | null {
    if (!isReference(value)) {
      return value ? (value as T) : null
    }

    const resolved = resolve<T>(value.$ref)
    return resolved && !isReference(resolved) ? resolved : null
  }

  /** Resolves a `$ref` object but keeps the `$ref` field on the result; other values pass through. */
  function derefKeepingRef<T = unknown>(value?: T): T {
    if (isReference(value)) {
      return { ...value, ...resolve(value.$ref), $ref: value.$ref }
    }

    return value as T
  }

  return { resolve, exists, resolveNode, deref, derefKeepingRef }
}
