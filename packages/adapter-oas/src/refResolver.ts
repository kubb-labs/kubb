import { collect, narrowSchema, schemaTypes, transform } from '@kubb/ast'
import type { SchemaNode } from '@kubb/ast/types'
import type { KubbFile } from '@kubb/fabric-core/types'
import { extractRefName } from './utils.ts'

/**
 * Collects import entries for all `ref` schema nodes in `node`.
 */
export function getImports({
  node,
  nameMapping,
  resolve,
}: {
  node: SchemaNode
  nameMapping: Map<string, string>
  resolve: (schemaName: string) => { name: string; path: string } | undefined
}): Array<KubbFile.Import> {
  return collect<KubbFile.Import>(node, {
    schema(schemaNode): KubbFile.Import | undefined {
      if (schemaNode.type !== 'ref' || !schemaNode.ref) return

      const rawName = extractRefName(schemaNode.ref)
      const schemaName = nameMapping.get(rawName) ?? rawName
      const result = resolve(schemaName)
      if (!result) return

      return { name: [result.name], path: result.path }
    },
  })
}

/**
 * Walks a schema tree and resolves `ref`/`enum` names through callbacks.
 */
export function resolveRefs({
  node,
  nameMapping,
  resolveName,
  resolveEnumName,
}: {
  node: SchemaNode
  nameMapping: Map<string, string>
  resolveName: (ref: string) => string | undefined
  resolveEnumName?: (name: string) => string | undefined
}): SchemaNode {
  return transform(node, {
    schema(schemaNode) {
      const schemaRef = narrowSchema(schemaNode, schemaTypes.ref)

      if (schemaRef && (schemaRef.ref || schemaRef.name)) {
        const rawRef = schemaRef.ref ?? schemaRef.name!
        const resolved = resolveName(nameMapping.get(rawRef) ?? rawRef)
        if (resolved) {
          return { ...schemaNode, name: resolved }
        }
      }

      if (schemaNode.type === 'enum' && schemaNode.name) {
        const resolved = (resolveEnumName ?? resolveName)(schemaNode.name)
        if (resolved) {
          return { ...schemaNode, name: resolved }
        }
      }
    },
  }) as SchemaNode
}
