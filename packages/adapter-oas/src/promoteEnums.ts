import { ast } from '@kubb/ast'
import { SCHEMA_REF_PREFIX } from './constants.ts'

/**
 * Collects inline enums to lift to the top level, keyed by the name the parser derived for them
 * (e.g. `PetStatusEnum`). An enum already defined as a top-level component is left as-is, and a
 * name that recurs maps to the first definition so each name yields one shared type.
 */
export function collectInlineEnums(roots: ReadonlyArray<ast.Node>, topLevelNames: ReadonlySet<string>): Map<string, ast.SchemaNode> {
  const promoted = new Map<string, ast.SchemaNode>()

  for (const root of roots) {
    const isSchemaRoot = root.kind === 'Schema'
    for (const node of ast.collect<ast.SchemaNode>(root, { schema: (schemaNode) => schemaNode })) {
      if (node.type !== 'enum' || !node.name) continue
      // Skip a top-level enum component (it is already its own type) and any enum whose name a
      // component already owns.
      if (isSchemaRoot && node === root) continue
      if (topLevelNames.has(node.name)) continue
      if (!promoted.has(node.name)) promoted.set(node.name, { ...node, optional: undefined, nullish: undefined })
    }
  }

  return promoted
}

/**
 * Replaces every promoted inline enum in `node` with a `ref` to its lifted definition, keeping the
 * occurrence's usage-slot and documentation fields.
 */
export function refPromotedEnums<T extends ast.Node>(node: T, promoted: ReadonlyMap<string, ast.SchemaNode>): T {
  if (promoted.size === 0) return node

  return ast.transform(node, {
    schema(schemaNode) {
      if (schemaNode.type !== 'enum' || !schemaNode.name || !promoted.has(schemaNode.name)) return undefined

      return ast.factory.createSchema({
        type: 'ref',
        name: schemaNode.name,
        ref: `${SCHEMA_REF_PREFIX}${schemaNode.name}`,
        optional: schemaNode.optional,
        nullish: schemaNode.nullish,
        readOnly: schemaNode.readOnly,
        writeOnly: schemaNode.writeOnly,
        deprecated: schemaNode.deprecated,
        description: schemaNode.description,
        default: schemaNode.default,
        examples: schemaNode.examples,
      })
    },
  }) as T
}
