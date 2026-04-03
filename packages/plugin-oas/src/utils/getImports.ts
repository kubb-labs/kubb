import type { KubbFile } from '@kubb/core'
import { SchemaGenerator } from '../SchemaGenerator.ts'
import type { Schema } from '../SchemaMapper'
import { schemaKeywords } from '../SchemaMapper'

/**
 * Get imports from a schema tree by extracting all ref schemas that are importable
 */
export function getImports(tree: Array<Schema>): Array<KubbFile.Import> {
  const refs = SchemaGenerator.deepSearch(tree, schemaKeywords.ref)

  if (!refs) return []

  return refs
    .map((item) => {
      if (!item.args.path || !item.args.isImportable) {
        return undefined
      }

      return {
        name: [item.args.name],
        path: item.args.path,
      } satisfies KubbFile.Import
    })
    .filter((x): x is NonNullable<typeof x> => x !== undefined)
}
