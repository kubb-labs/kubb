import type { SchemaNode } from '../nodes/schema.ts'
import { collectSchemaRefs } from '../utils/schemaGraph.ts'

export {
  collectImportedRefNames as importedNames,
  collectSchemaRefs as refs,
  collectUsedSchemaNames as usedNames,
  findCircularSchemas as circular,
} from '../utils/schemaGraph.ts'

/** Whether a schema, or anything inside it, refers to one of `circularSchemas`, other than `excludeName`. */
export function containsCircular(
  node: SchemaNode | undefined,
  { circularSchemas, excludeName }: { circularSchemas: ReadonlySet<string>; excludeName?: string },
): boolean {
  if (!node || circularSchemas.size === 0) return false
  for (const name of collectSchemaRefs(node)) if (name !== excludeName && circularSchemas.has(name)) return true
  return false
}
