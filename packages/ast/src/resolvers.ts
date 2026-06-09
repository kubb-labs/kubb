import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { collect } from './visitor.ts'
import { extractRefName } from './utils/index.ts'

/**
 * Collects import entries for all `ref` schema nodes in `node`.
 */
export function collectImports<TImport>({
  node,
  nameMapping,
  resolve,
}: {
  node: SchemaNode
  nameMapping: Map<string, string>
  resolve: (schemaName: string) => TImport | null
}): Array<TImport> {
  return collect<TImport>(node, {
    schema(schemaNode): TImport | null {
      const schemaRef = narrowSchema(schemaNode, 'ref')
      if (!schemaRef?.ref) return null

      const rawName = extractRefName(schemaRef.ref)
      const schemaName = nameMapping.get(rawName) ?? rawName
      const result = resolve(schemaName)
      if (!result) return null

      return result
    },
  })
}
