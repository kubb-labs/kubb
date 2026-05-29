/**
 * Returns the last path segment of a reference string.
 *
 * Example: `#/components/schemas/Pet` becomes `Pet`.
 *
 * @example
 * ```ts
 * extractRefName('#/components/schemas/Pet') // 'Pet'
 * ```
 */
export function extractRefName(ref: string): string {
  return ref.split('/').at(-1) ?? ref
}
