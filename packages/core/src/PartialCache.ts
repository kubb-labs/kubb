import { join, relative } from 'node:path'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { NodeManifest, NodeManifestEntry, NodeManifestExport, NodeManifestFile } from './createCache.ts'
import { NodeFingerprint } from './NodeFingerprint.ts'

/** Producer token for the operations aggregate, whose files are never replayed from a single node. */
const AGGREGATE = '__aggregate__'

/**
 * Bookkeeping for a partial ("only rerun what changed") rebuild. It computes per-node keys, decides
 * which nodes can be replayed from the previous run, attributes generated files to the nodes that
 * produced them, and builds the manifest to persist. It holds no IO: the driver writes replayed
 * files and upserts barrel placeholders, then reports back through `recordReused`/`recordRegenerated`.
 */
export class PartialCache {
  /** The previous run's manifest, or `null` on the first cached run (everything regenerates). */
  readonly prev: NodeManifest | null
  /** Absolute output directory, used to relativize file paths for the manifest. */
  readonly outputRoot: string

  readonly #schemasByName = new Map<string, SchemaNode>()
  readonly #producerByPath = new Map<string, Set<string>>()
  readonly #exportsByPath = new Map<string, Array<NodeManifestExport>>()
  readonly #regenerated = new Map<string, { nodeKey: string; relPaths: Set<string> }>()
  readonly #carried = new Map<string, NodeManifestEntry>()
  readonly #replayedSources = new Map<string, string>()
  readonly #seen = new Set<string>()
  #inlineCounter = 0

  constructor({ prev, outputRoot }: { prev: NodeManifest | null; outputRoot: string }) {
    this.prev = prev
    this.outputRoot = outputRoot
  }

  /** Indexes the named schemas so per-node keys can hash a node's transitive references. */
  indexSchemas(schemas: ReadonlyArray<SchemaNode>): void {
    for (const schema of schemas) {
      if (schema.name) this.#schemasByName.set(schema.name, schema)
    }
  }

  /** Stable id and content key for a node. `nodeId` is `null` for an inline schema (never cached). */
  key({ pluginName, kind, node, options }: { pluginName: string; kind: 'schema' | 'operation'; node: SchemaNode | OperationNode; options: unknown }): {
    nodeId: string | null
    nodeKey: string | null
  } {
    if (kind === 'schema') {
      const schema = node as SchemaNode
      const nodeId = NodeFingerprint.schemaNodeId({ pluginName, name: schema.name })
      if (!nodeId) return { nodeId: null, nodeKey: null }
      return {
        nodeId,
        nodeKey: NodeFingerprint.schemaNodeKey({ pluginName, nodeId, resolvedOptions: options, node: schema, schemasByName: this.#schemasByName }),
      }
    }
    const operation = node as OperationNode
    const nodeId = NodeFingerprint.operationNodeId({ pluginName, operationId: operation.operationId })
    return {
      nodeId,
      nodeKey: NodeFingerprint.operationNodeKey({ pluginName, nodeId, resolvedOptions: options, node: operation, schemasByName: this.#schemasByName }),
    }
  }

  /** The previous-run entry for a node when it can be safely replayed (unchanged and exclusive). */
  reusableEntry({ nodeId, nodeKey }: { nodeId: string | null; nodeKey: string | null }): NodeManifestEntry | null {
    if (!nodeId || !nodeKey || !this.prev) return null
    const entry = this.prev.nodes[nodeId]
    if (!entry || entry.nodeKey !== nodeKey) return null
    if (entry.files.some((file) => this.prev!.shared.includes(file.relPath))) return null
    return entry
  }

  /** True when a regenerated node already wrote one of a reused entry's files (so reuse is unsafe). */
  collides(entry: NodeManifestEntry): boolean {
    return entry.files.some((file) => this.#producerByPath.has(file.relPath))
  }

  /**
   * Attributes a regenerated node's files: tags each path's producer (so shared paths surface) and
   * remembers the node's content key. Inline schemas (no `nodeId`) get a unique producer so they
   * never look exclusive.
   */
  recordRegenerated({
    pluginName,
    nodeId,
    nodeKey,
    files,
  }: {
    pluginName: string
    nodeId: string | null
    nodeKey: string | null
    files: ReadonlyArray<FileNode>
  }): void {
    const producer = nodeId ?? `inline:${pluginName}:${this.#inlineCounter++}`
    for (const file of files) {
      const relativePath = relative(this.outputRoot, file.path)
      this.#addProducer(relativePath, producer)
      this.#exportsByPath.set(relativePath, exportsOf(file))
      if (nodeId && nodeKey) {
        const entry = this.#regenerated.get(nodeId) ?? { nodeKey, relPaths: new Set<string>() }
        entry.relPaths.add(relativePath)
        this.#regenerated.set(nodeId, entry)
      }
    }
    if (nodeId) this.#seen.add(nodeId)
  }

  /** Carries a replayed node forward unchanged and remembers its sources for the whole-build snapshot. */
  recordReused({ nodeId, entry }: { nodeId: string; entry: NodeManifestEntry }): void {
    for (const file of entry.files) {
      this.#addProducer(file.relPath, nodeId)
      this.#replayedSources.set(join(this.outputRoot, file.relPath), file.source)
    }
    this.#carried.set(nodeId, entry)
    this.#seen.add(nodeId)
  }

  /** Marks the operations-aggregate output as shared so it is never replayed from a single node. */
  recordAggregate(files: ReadonlyArray<FileNode>): void {
    for (const file of files) {
      this.#addProducer(relative(this.outputRoot, file.path), AGGREGATE)
    }
  }

  /** Absolute path to source for every replayed file, to fold into the whole-build snapshot. */
  replayedSources(): ReadonlyMap<string, string> {
    return this.#replayedSources
  }

  /** Relative paths of nodes that existed last run but are gone now and were not re-produced. */
  staleFiles(): Array<string> {
    if (!this.prev) return []
    const stale: Array<string> = []
    for (const [nodeId, entry] of Object.entries(this.prev.nodes)) {
      if (this.#seen.has(nodeId)) continue
      for (const file of entry.files) {
        if (!this.#producerByPath.has(file.relPath)) stale.push(file.relPath)
      }
    }
    return stale
  }

  /**
   * Builds the manifest to persist: reused nodes carry forward verbatim, regenerated nodes keep only
   * the files they own exclusively, and every multi-producer path is recorded as `shared`.
   */
  toManifest(sourceOf: (relativePath: string) => string | undefined): NodeManifest {
    const shared: Array<string> = []
    for (const [relativePath, producers] of this.#producerByPath) {
      if (producers.size > 1 || producers.has(AGGREGATE)) shared.push(relativePath)
    }
    const sharedSet = new Set(shared)

    const nodes: Record<string, NodeManifestEntry> = {}
    for (const [nodeId, entry] of this.#carried) {
      nodes[nodeId] = entry
    }
    for (const [nodeId, info] of this.#regenerated) {
      const files: Array<NodeManifestFile> = []
      for (const relativePath of info.relPaths) {
        if (sharedSet.has(relativePath)) continue
        const producers = this.#producerByPath.get(relativePath)
        if (!producers || producers.size !== 1 || !producers.has(nodeId)) continue
        const source = sourceOf(relativePath)
        if (source === undefined) continue
        files.push({ relPath: relativePath, source, exports: this.#exportsByPath.get(relativePath) ?? [] })
      }
      if (files.length) nodes[nodeId] = { nodeKey: info.nodeKey, files }
    }

    return { version: NodeFingerprint.version, nodes, shared }
  }

  #addProducer(relativePath: string, producer: string): void {
    const set = this.#producerByPath.get(relativePath) ?? new Set<string>()
    set.add(producer)
    this.#producerByPath.set(relativePath, set)
  }
}

function exportsOf(file: FileNode): Array<NodeManifestExport> {
  return (file.sources ?? []).map((source) => ({ name: source.name ?? null, isIndexable: source.isIndexable ?? false, isTypeOnly: source.isTypeOnly ?? false }))
}
