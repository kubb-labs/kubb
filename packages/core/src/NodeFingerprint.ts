import { createHash } from 'node:crypto'
import { collectReferencedSchemaNames, collectUsedSchemaNames, schemaSignature } from '@kubb/ast'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { version as coreVersion } from '../package.json'
import { Fingerprint } from './Fingerprint.ts'

/**
 * Computes the stable identity and content key of a single schema or operation, for partial
 * ("only rerun what changed") rebuilds. The `nodeId` survives content edits and matches a node to
 * its previous-run manifest entry; the `nodeKey` changes whenever anything that affects the node's
 * output changes, so an unchanged key means the cached file can be replayed.
 *
 * All methods are static, so call them as `NodeFingerprint.schemaNodeKey(...)`.
 */
export class NodeFingerprint {
  /**
   * Bumped independently of `Fingerprint.version` when the per-node key inputs change, so stale
   * manifests from older Kubb builds are ignored.
   */
  static version = 1

  /**
   * Stable id for a named schema, or `null` for an inline schema (no name) which is never cached on
   * its own and travels inside its parent's file.
   */
  static schemaNodeId({ pluginName, name }: { pluginName: string; name: string | null | undefined }): string | null {
    return name ? `${pluginName}#schema:${name}` : null
  }

  /**
   * Stable id for an operation, derived from its `operationId`.
   */
  static operationNodeId({ pluginName, operationId }: { pluginName: string; operationId: string }): string {
    return `${pluginName}#operation:${operationId}`
  }

  /**
   * Content key for a schema: its own shape signature plus the shape signatures of every schema it
   * transitively references. The transitive part matters because `schemaSignature` hashes refs by
   * target name only, so a plugin that inlines a referenced schema must still invalidate when that
   * schema's body changes.
   */
  static schemaNodeKey({
    pluginName,
    nodeId,
    resolvedOptions,
    node,
    schemasByName,
  }: {
    pluginName: string
    nodeId: string
    resolvedOptions: unknown
    node: SchemaNode
    schemasByName: Map<string, SchemaNode>
  }): string {
    const referenced = NodeFingerprint.#transitiveSignatures(collectReferencedSchemaNames(node), schemasByName)
    return NodeFingerprint.#hash({ pluginName, nodeId, resolvedOptions, content: { self: schemaSignature(node), referenced } })
  }

  /**
   * Content key for an operation: a structural signature of the operation node (which captures its
   * wiring and any inline schemas) plus the shape signatures of every component schema it uses.
   */
  static operationNodeKey({
    pluginName,
    nodeId,
    resolvedOptions,
    node,
    schemasByName,
  }: {
    pluginName: string
    nodeId: string
    resolvedOptions: unknown
    node: OperationNode
    schemasByName: Map<string, SchemaNode>
  }): string {
    const usedNames = collectUsedSchemaNames([node], [...schemasByName.values()])
    const referenced = NodeFingerprint.#transitiveSignatures(usedNames, schemasByName)
    return NodeFingerprint.#hash({ pluginName, nodeId, resolvedOptions, content: { self: NodeFingerprint.#structural(node), referenced } })
  }

  static #transitiveSignatures(seed: Set<string>, schemasByName: Map<string, SchemaNode>): Array<[string, string]> {
    const seen = new Set<string>()
    const queue = [...seed]
    while (queue.length) {
      const name = queue.pop()!
      if (seen.has(name)) continue
      seen.add(name)
      const referenced = schemasByName.get(name)
      if (referenced) {
        for (const next of collectReferencedSchemaNames(referenced)) {
          if (!seen.has(next)) queue.push(next)
        }
      }
    }
    return [...seen].sort().map((name) => {
      const referenced = schemasByName.get(name)
      return [name, referenced ? schemaSignature(referenced) : 'missing'] as [string, string]
    })
  }

  // Operation nodes are acyclic (refs are by name), so a stable stringify captures the wiring and
  // inline schemas. A doc-only edit over-invalidates, which is safe. A thrown cycle falls back to a
  // unique value so the node is simply regenerated.
  static #structural(node: OperationNode): string {
    try {
      return Fingerprint.stringify(node)
    } catch {
      return `uncacheable:${createHash('sha256').update(`${Math.random()}`).digest('hex')}`
    }
  }

  static #hash({ pluginName, nodeId, resolvedOptions, content }: { pluginName: string; nodeId: string; resolvedOptions: unknown; content: unknown }): string {
    const input = { nodeVersion: NodeFingerprint.version, coreVersion, pluginName, nodeId, resolvedOptions, content }
    return createHash('sha256').update(Fingerprint.stringify(input)).digest('hex')
  }
}
