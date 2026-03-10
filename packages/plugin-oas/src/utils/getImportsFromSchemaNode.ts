import { type SchemaNode, walk } from '@internals/ast'
import type { KubbFile } from '@kubb/fabric-core/types'

type Options = {
  getFile: (name: string) => KubbFile.File | undefined
  getName: (name: string) => string
  /**
   * Path of the file being generated. Any ref that resolves to this same path
   * is skipped to prevent self-imports, regardless of name transformations applied
   * by resolveName/resolvePath.
   */
  currentFilePath?: string
}

/**
 * Get imports from a SchemaNode tree by walking all ref-type nodes and resolving
 * each referenced schema name to a file path via the provided resolver.
 *
 * Drop-in replacement for `getImports(schema.tree)` that works with the AST layer
 * instead of the Schema[] keyword tree.
 *
 * `getName` resolves OAS schema ref names (e.g. `'tag.Tag'`) to valid TypeScript
 * identifiers (e.g. `'TagTag'`) used in the generated import statement.
 *
 * Refs are skipped when:
 * - The ref name equals the root node's own name (direct self-reference)
 * - The resolved file path equals `currentFilePath` (same-file import)
 */
export function getImportsFromSchemaNode(node: SchemaNode, options: Options): Array<KubbFile.Import> {
  const { getFile, getName, currentFilePath } = options
  const imports = new Map<string, KubbFile.Import>()

  walk(node, {
    visitSchema(schema) {
      if (schema.type !== 'ref' || !schema.ref || schema.ref === node.name) return

      const file = getFile(schema.ref)
      if (!file) return
      if (currentFilePath && file.path === currentFilePath) return

      imports.set(schema.ref, { name: [getName(schema.ref)], path: file.path })
    },
  })

  return [...imports.values()]
}
