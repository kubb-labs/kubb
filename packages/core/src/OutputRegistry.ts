import type { ExportNode, FileNode } from '@kubb/ast'

export type OutputKind = string

export type OutputEntry = {
  nodeId: string
  nodeKind: 'schema' | 'operation'
  plugin: string
  kind: OutputKind
  file: string
  exports: Array<string>
}

function extractExportNames(file: FileNode): Array<string> {
  return file.exports.flatMap((e: ExportNode) => {
    if (!e.name) return []
    return Array.isArray(e.name) ? (e.name as string[]) : [e.name as string]
  })
}

/**
 * Tracks what each plugin produced for each schema/operation node.
 * Populated automatically by PluginDriver when addFile/upsertFile is called
 * inside a generator context that has a currentNode in AsyncLocalStorage.
 *
 * Plugins opt-in by tagging their files with `meta: { kind: 'type' | 'zod' | ... }`.
 */
export class OutputRegistry {
  readonly #entries: Array<OutputEntry> = []

  register(entry: OutputEntry): void {
    this.#entries.push(entry)
  }

  /**
   * Returns all entries matching the given filter (all fields optional).
   */
  query(filter: Partial<Pick<OutputEntry, 'nodeId' | 'nodeKind' | 'plugin' | 'kind'>>): Array<OutputEntry> {
    return this.#entries.filter(
      (e) =>
        (filter.nodeId === undefined || e.nodeId === filter.nodeId) &&
        (filter.nodeKind === undefined || e.nodeKind === filter.nodeKind) &&
        (filter.plugin === undefined || e.plugin === filter.plugin) &&
        (filter.kind === undefined || e.kind === filter.kind),
    )
  }

  /**
   * Returns the first entry matching the given node + plugin + optional kind.
   */
  resolve(query: { nodeId: string; nodeKind: 'schema' | 'operation'; plugin: string; kind?: string }): OutputEntry | undefined {
    return this.#entries.find(
      (e) => e.nodeId === query.nodeId && e.nodeKind === query.nodeKind && e.plugin === query.plugin && (query.kind === undefined || e.kind === query.kind),
    )
  }

  static extractExportNames = extractExportNames
}
