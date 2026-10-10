import { ast } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast'

/**
 * Returns `true` when a schema, or anything nested inside it, references a circular schema.
 *
 * Pass `excludeName` to skip refs to a specific schema, which helps when self-references are handled
 * on their own. Pair it with `ast.findCircularSchemas()` to decide where lazy wrappers go.
 *
 * @note Reads the memoized `ast.collectSchemaRefs()` set, so a schema is scanned once across plugins.
 */
export function containsCircularRef(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false

  for (const name of ast.collectSchemaRefs(node)) {
    if (name !== excludeName && circularSchemas.has(name)) return true
  }

  return false
}
