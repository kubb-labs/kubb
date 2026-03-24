import { pascalCase } from '@internals/utils'
import { narrowSchema } from './guards.ts'
import type { SchemaNode } from './nodes/schema.ts'
import { extractRefName } from './refs.ts'
import { collect } from './visitor.ts'

export function findDiscriminator(mapping: Record<string, string> | undefined, ref: string | undefined): string | undefined {
  if (!mapping || !ref) return undefined
  return Object.entries(mapping).find(([, value]) => value === ref)?.[0]
}

export function childName(parentName: string | undefined, propName: string): string | undefined {
  return parentName ? pascalCase([parentName, propName].join(' ')) : undefined
}

export function enumPropName(parentName: string | undefined, propName: string, enumSuffix: string): string {
  return pascalCase([parentName, propName, enumSuffix].filter(Boolean).join(' '))
}

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
  resolve: (schemaName: string) => TImport | undefined
}): Array<TImport> {
  return collect<TImport>(node, {
    schema(schemaNode): TImport | undefined {
      const schemaRef = narrowSchema(schemaNode, 'ref')
      if (!schemaRef?.ref) return

      const rawName = extractRefName(schemaRef.ref)
      const schemaName = nameMapping.get(rawName) ?? rawName
      const result = resolve(schemaName)
      if (!result) return

      return result
    },
  })
}
