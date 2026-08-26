import type { FileNode, InputMeta, OperationNode, SchemaNode } from '@kubb/ast'

/**
 * Outcome of a single plugin within a run. `running` flips to `success` or `failed`
 * when `kubb:plugin:end` reports it.
 */
export type PluginStatus = 'running' | 'success' | 'failed'

/**
 * One plugin's slice of a run, as the timeline panel renders it. Counts come from the
 * nodes the plugin actually received, so they differ from the canonical AST whenever
 * `include` / `exclude` filtered something out.
 */
export type PluginRun = {
  name: string
  status: PluginStatus
  /**
   * Elapsed milliseconds, `null` while the plugin is still running.
   */
  duration: number | null
  error: string | null
  schemaCount: number
  operationCount: number
}

/**
 * A diagnostic flattened to what the UI shows. The original carries an `Error` cause,
 * which does not belong on the wire.
 */
export type RunDiagnostic = {
  code: string
  severity: string
  message: string
  plugin: string | null
}

/**
 * Everything the pipeline panel needs, and the value pushed into devframe shared state.
 * Deliberately free of AST nodes so it stays small enough to broadcast on every change.
 */
export type RunSummary = {
  id: number
  config: string | null
  status: 'running' | 'success' | 'failed'
  startedAt: number
  endedAt: number | null
  fileCount: number
  schemaCount: number
  operationCount: number
  plugins: Array<PluginRun>
  diagnostics: Array<RunDiagnostic>
}

/**
 * The canonical AST, snapshotted from `KubbDriver.inputNode` before the driver disposes it.
 */
export type AstSnapshot = {
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
  meta: InputMeta | undefined
}

/**
 * What one plugin received during the walk, after its own `override` transform.
 * Diffing this against {@link AstSnapshot} is what shows why a schema was skipped.
 */
export type PluginView = {
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
}

export type DevtoolsStore = ReturnType<typeof createStore>

function emptySummary(id: number): RunSummary {
  return {
    id,
    config: null,
    status: 'running',
    startedAt: Date.now(),
    endedAt: null,
    fileCount: 0,
    schemaCount: 0,
    operationCount: 0,
    plugins: [],
    diagnostics: [],
  }
}

/**
 * In-memory state for the devtools session. One store spans every build, so a watch
 * rebuild replaces the run rather than starting a second server.
 *
 * @example
 * ```ts
 * const store = createStore()
 * store.onChange(() => push(store.getSummary()))
 * ```
 */
export function createStore() {
  let runId = 0
  let summary = emptySummary(runId)
  let ast: AstSnapshot | null = null
  let files: Array<FileNode> = []
  const pluginViews = new Map<string, PluginView>()
  const listeners = new Set<() => void>()

  function notify(): void {
    for (const listener of listeners) listener()
  }

  function getPlugin(name: string): PluginRun | undefined {
    return summary.plugins.find((plugin) => plugin.name === name)
  }

  function viewFor(name: string): PluginView {
    let view = pluginViews.get(name)
    if (!view) {
      view = { schemas: [], operations: [] }
      pluginViews.set(name, view)
    }
    return view
  }

  return {
    /**
     * Resets everything for a new build. A watch rebuild lands here.
     */
    startRun(config: string | null): void {
      runId += 1
      summary = { ...emptySummary(runId), config }
      ast = null
      files = []
      pluginViews.clear()
      notify()
    },

    /**
     * Stores the canonical AST. Must be called while `driver.inputNode` is still set.
     */
    setAst(snapshot: AstSnapshot): void {
      ast = snapshot
      summary.schemaCount = snapshot.schemas.length
      summary.operationCount = snapshot.operations.length
      notify()
    },

    startPlugin(name: string): void {
      if (getPlugin(name)) return
      summary.plugins.push({ name, status: 'running', duration: null, error: null, schemaCount: 0, operationCount: 0 })
      notify()
    },

    endPlugin({ name, duration, success, error }: { name: string; duration: number; success: boolean; error?: Error }): void {
      const plugin = getPlugin(name)
      if (!plugin) return
      plugin.status = success ? 'success' : 'failed'
      plugin.duration = duration
      plugin.error = error?.message ?? null
      notify()
    },

    recordSchema({ plugin, node }: { plugin: string; node: SchemaNode }): void {
      const view = viewFor(plugin)
      view.schemas.push(node)
      const entry = getPlugin(plugin)
      if (entry) entry.schemaCount = view.schemas.length
      notify()
    },

    recordOperation({ plugin, node }: { plugin: string; node: OperationNode }): void {
      const view = viewFor(plugin)
      view.operations.push(node)
      const entry = getPlugin(plugin)
      if (entry) entry.operationCount = view.operations.length
      notify()
    },

    addDiagnostic(diagnostic: RunDiagnostic): void {
      summary.diagnostics.push(diagnostic)
      notify()
    },

    setFiles(next: ReadonlyArray<FileNode>): void {
      files = [...next]
      summary.fileCount = files.length
      notify()
    },

    endRun(status: 'success' | 'failed'): void {
      summary.status = status
      summary.endedAt = Date.now()
      notify()
    },

    getSummary(): RunSummary {
      return summary
    },

    getAst(): AstSnapshot | null {
      return ast
    },

    getPluginView(name: string): PluginView | null {
      return pluginViews.get(name) ?? null
    },

    getPluginNames(): Array<string> {
      return [...pluginViews.keys()]
    },

    getFiles(): Array<FileNode> {
      return files
    },

    /**
     * Subscribes to every mutation and returns a function that unsubscribes.
     */
    onChange(listener: () => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
