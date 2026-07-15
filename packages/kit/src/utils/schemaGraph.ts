import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

/**
 * Returns `true` when a schema, or anything nested inside it, references a circular schema.
 *
 * Pass `excludeName` to skip refs to a specific schema, which helps when self-references are handled
 * on their own. Pair it with `ast.findCircularSchemas()` to decide where lazy wrappers go.
 *
 * @note Stops at the first matching circular ref.
 */
export function containsCircularRef(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false

  for (const _ of ast.collect<true>(node, {
    schema(child) {
      if (child.type !== 'ref') return null
      const name = ast.resolveRefName(child)
      return name && name !== excludeName && circularSchemas.has(name) ? true : null
    },
  })) {
    return true
  }

  return false
}
