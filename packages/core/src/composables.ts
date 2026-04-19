import { dirname, relative } from 'node:path'
import type { ImportNode, OperationNode, SchemaNode } from '@kubb/ast'
import { createImport } from '@kubb/ast'
import { getContextStore } from './generatorContext.ts'
import type { OutputEntry } from './OutputRegistry.ts'

// ─── kubb:spec ────────────────────────────────────────────────────────────────

/** Returns all schema nodes from the parsed spec. */
export function getSchemas(): Array<SchemaNode> {
  return (getContextStore().ctx.inputNode?.schemas ?? []) as Array<SchemaNode>
}

/** Returns the schema node with the given name, or undefined. */
export function getSchema(name: string): SchemaNode | undefined {
  return getSchemas().find((s) => s.name === name)
}

/** Returns all operation nodes from the parsed spec. */
export function getOperations(): Array<OperationNode> {
  return (getContextStore().ctx.inputNode?.operations ?? []) as Array<OperationNode>
}

/** Returns the operation node with the given operationId, or undefined. */
export function getOperation(operationId: string): OperationNode | undefined {
  return getOperations().find((op) => op.operationId === operationId)
}

/** Returns all operations that carry the given tag. */
export function getOperationsByTag(tag: string): Array<OperationNode> {
  return getOperations().filter((op) => op.tags?.includes(tag))
}

/** Returns the node currently being processed (schema or operation), or null during the operations-batch call. */
export function getCurrentNode(): SchemaNode | OperationNode | null {
  return getContextStore().currentNode
}

/** Returns the InputNode metadata (title, version, baseURL, description). */
export function getInputMeta() {
  return getContextStore().ctx.inputNode?.meta
}

// ─── kubb:outputs ─────────────────────────────────────────────────────────────

/**
 * Queries the OutputRegistry and returns all matching entries.
 * Entries are only present for plugins that tagged their files with `meta: { kind: '...' }`.
 */
export function queryOutputs(filter: Partial<Pick<OutputEntry, 'nodeId' | 'nodeKind' | 'plugin' | 'kind'>>): Array<OutputEntry> {
  return getContextStore().ctx.driver.outputRegistry.query(filter)
}

/**
 * Resolves a cross-plugin output to a ready-to-use `ImportNode`.
 *
 * @param query.schema    - Name of the schema node (exclusive with `operation`)
 * @param query.operation - operationId of the operation (exclusive with `schema`)
 * @param query.plugin    - The plugin that produced the output (e.g. `'plugin-ts'`)
 * @param query.kind      - The semantic kind of the output (e.g. `'type'`, `'zod'`)
 * @param query.from      - Absolute path of the file that will contain the import
 *
 * Returns an `ImportNode` ready to add to a `FileNode`, or `null` if no match.
 */
export function resolveImport(query: { schema?: string; operation?: string; plugin: string; kind?: string; from: string }): ImportNode | null {
  const registry = getContextStore().ctx.driver.outputRegistry
  const nodeId = query.schema ?? query.operation ?? ''
  const nodeKind: 'schema' | 'operation' = query.schema ? 'schema' : 'operation'

  const entry = registry.resolve({ nodeId, nodeKind, plugin: query.plugin, kind: query.kind })
  if (!entry || entry.exports.length === 0) return null

  const rel = relative(dirname(query.from), entry.file)
  const importPath = rel.startsWith('.') ? rel : `./${rel}`

  return createImport({
    name: entry.exports,
    path: importPath,
    isTypeOnly: entry.kind === 'type',
  })
}
