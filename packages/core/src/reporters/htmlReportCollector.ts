import { getElapsedMs } from '@internals/utils'
import type { FileNode, InputMeta, InputNode, OperationNode, SchemaNode } from '@kubb/ast'
import { type Diagnostic, type DiagnosticSeverity, Diagnostics, type ProblemDiagnostic, type UpdateDiagnostic } from '../Diagnostics.ts'
import type { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'

/**
 * Outcome of one plugin execution in the collected report state.
 */
export type HtmlReportPluginStatus = 'running' | 'success' | 'failed'

/**
 * One plugin's lifecycle summary and generated node counts.
 */
export type HtmlReportPluginRun = {
  name: string
  status: HtmlReportPluginStatus
  duration: number | null
  error: string | null
  schemaCount: number
  operationCount: number
}

/**
 * A diagnostic reduced to the fields the future report UI displays.
 */
export type HtmlReportDiagnostic = {
  code: string
  severity: DiagnosticSeverity
  message: string
  plugin: string | null
  location?: ProblemDiagnostic['location']
}

/**
 * The run summary shown by the future static report UI.
 */
export type HtmlReportRunSummary = {
  id: number
  config: string | null
  status: 'running' | 'success' | 'failed'
  duration: number | null
  fileCount: number
  schemaCount: number
  operationCount: number
  plugins: Array<HtmlReportPluginRun>
  diagnostics: Array<HtmlReportDiagnostic>
}

/**
 * Canonical AST captured from the driver before disposal.
 */
export type HtmlReportAstSnapshot = {
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
  meta: InputMeta | undefined
}

/**
 * Nodes a plugin received after its own filtering and transforms.
 */
export type HtmlReportPluginView = {
  schemas: Array<SchemaNode>
  operations: Array<OperationNode>
}

/**
 * A generated file entry safe for the future file browser.
 */
export type HtmlReportFileEntry = {
  id: string
  name: string
  baseName: string
  path: string
}

/**
 * Complete in-memory report data for the future static HTML reporter.
 */
export type HtmlReportSnapshot = {
  run: HtmlReportRunSummary | null
  ast: HtmlReportAstSnapshot | null
  pluginViews: Record<string, HtmlReportPluginView>
  files: Array<HtmlReportFileEntry>
  generatedFiles: Record<string, string>
}

/**
 * Active collector attached to one hook bus.
 */
export type HtmlReportCollector = {
  getSnapshot(): HtmlReportSnapshot
  dispose(): void
  [Symbol.dispose](): void
}

type CreateHtmlReportCollectorOptions = {
  hooks: Hookable<KubbHooks>
  getInputNode?: () => InputNode | null | undefined
}

function clone<T>(value: T): T {
  // Hook payloads can reference nodes that the driver continues to transform. Keep the report
  // independent from those objects, especially because the canonical AST must not become a view
  // of a later plugin execution.
  return structuredClone(value)
}

function createRun(id: number, config: string | null): HtmlReportRunSummary {
  return {
    id,
    config,
    status: 'running',
    duration: null,
    fileCount: 0,
    schemaCount: 0,
    operationCount: 0,
    plugins: [],
    diagnostics: [],
  }
}

function fileEntry(file: FileNode): HtmlReportFileEntry {
  return {
    id: file.id,
    name: file.name,
    baseName: file.baseName,
    path: file.path,
  }
}

function createAstSnapshot(inputNode: InputNode): HtmlReportAstSnapshot {
  // Generate hooks expose the node/plugin view, not the original input graph. The canonical AST is
  // therefore captured only from the driver's input node at build start.
  return clone({
    schemas: inputNode.schemas,
    operations: inputNode.operations,
    meta: inputNode.meta,
  })
}

function getPluginRun(run: HtmlReportRunSummary | null, name: string): HtmlReportPluginRun | undefined {
  return run?.plugins.find((plugin) => plugin.name === name)
}

function toDiagnostic(diagnostic: ProblemDiagnostic | UpdateDiagnostic): HtmlReportDiagnostic {
  const serialized = Diagnostics.serialize(diagnostic)

  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
    plugin: 'plugin' in diagnostic ? (diagnostic.plugin ?? null) : null,
    ...(serialized.location ? { location: serialized.location } : {}),
  }
}

function collectDiagnostics(diagnostics: ReadonlyArray<Diagnostic>): Array<HtmlReportDiagnostic> {
  return diagnostics.filter((diagnostic) => !Diagnostics.isPerformance(diagnostic)).map(toDiagnostic)
}

function dedupeDiagnostics(diagnostics: ReadonlyArray<HtmlReportDiagnostic>): Array<HtmlReportDiagnostic> {
  // Keep the first occurrence and use the serialized report shape as the identity. That shape
  // includes location, so equal messages from different source nodes are not merged.
  const seen = new Set<string>()
  const result: Array<HtmlReportDiagnostic> = []

  for (const diagnostic of diagnostics) {
    const key = JSON.stringify(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }

  return result
}

function emptySnapshot(): HtmlReportSnapshot {
  return {
    run: null,
    ast: null,
    pluginViews: {},
    files: [],
    generatedFiles: {},
  }
}

/**
 * Attaches a standalone report collector to a Kubb hook bus. The caller owns the lifecycle and
 * must call `dispose` before discarding the hook bus or reusing the collector's subscriptions.
 */
export function createHtmlReportCollector({ hooks, getInputNode }: CreateHtmlReportCollectorOptions): HtmlReportCollector {
  let runId = 0
  let run: HtmlReportRunSummary | null = null
  let ast: HtmlReportAstSnapshot | null = null
  let files: Array<HtmlReportFileEntry> = []
  let diagnostics: Array<HtmlReportDiagnostic> = []
  const pluginViews = new Map<string, HtmlReportPluginView>()
  const generatedFiles = new Map<string, string>()

  function viewFor(name: string): HtmlReportPluginView {
    // Plugin names are the same identity used by KubbDriver. Creating the view lazily also keeps
    // generation events useful when a fixture or host emits them without plugin:start.
    let view = pluginViews.get(name)
    if (!view) {
      view = { schemas: [], operations: [] }
      pluginViews.set(name, view)
    }
    return view
  }

  function reset(config: string | null): void {
    // A collector may observe more than one build. Replace every run-scoped container so files,
    // diagnostics, and plugin views from an earlier build cannot leak into the next snapshot.
    runId += 1
    run = createRun(runId, config)
    ast = null
    files = []
    diagnostics = []
    pluginViews.clear()
    generatedFiles.clear()
  }

  const unhook = hooks.addHooks({
    'kubb:build:start': ({ config }) => {
      reset(config.name ?? null)

      const inputNode = getInputNode?.()
      if (!inputNode || !run) return

      ast = createAstSnapshot(inputNode)
      run.schemaCount = ast.schemas.length
      run.operationCount = ast.operations.length
    },

    'kubb:plugin:start': ({ plugin }) => {
      if (!run || getPluginRun(run, plugin.name)) return
      run.plugins.push({ name: plugin.name, status: 'running', duration: null, error: null, schemaCount: 0, operationCount: 0 })
    },

    'kubb:plugin:end': ({ plugin, duration, success, error }) => {
      const entry = getPluginRun(run, plugin.name)
      if (!entry) return

      entry.status = success ? 'success' : 'failed'
      entry.duration = duration
      entry.error = error?.message ?? null
    },

    'kubb:generate:schema': (node, ctx) => {
      const view = viewFor(ctx.plugin.name)
      view.schemas.push(clone(node))

      const entry = getPluginRun(run, ctx.plugin.name)
      if (entry) entry.schemaCount = view.schemas.length
    },

    'kubb:generate:operation': (node, ctx) => {
      const view = viewFor(ctx.plugin.name)
      view.operations.push(clone(node))

      const entry = getPluginRun(run, ctx.plugin.name)
      if (entry) entry.operationCount = view.operations.length
    },

    'kubb:diagnostic': ({ diagnostic }) => {
      diagnostics = dedupeDiagnostics([...diagnostics, toDiagnostic(diagnostic)])
      if (run) run.diagnostics = diagnostics
    },

    'kubb:build:end': ({ files: nextFiles }) => {
      files = nextFiles.map(fileEntry)
      if (run) run.fileCount = files.length
    },

    'kubb:generation:end': async ({ diagnostics: finalDiagnostics, status, hrStart, storage }) => {
      // generation:end carries the complete diagnostic list after output processing. It replaces
      // the live list so a diagnostic emitted earlier through kubb:diagnostic is not duplicated.
      if (finalDiagnostics) {
        diagnostics = dedupeDiagnostics(collectDiagnostics(finalDiagnostics))
      }

      // build:end is the authoritative file list. Read only those paths; storage may contain
      // unrelated keys and a missing item is represented by the storage contract as null.
      for (const file of files) {
        const content = await storage.readItem(file.path)
        if (content !== null) generatedFiles.set(file.id, content)
      }

      if (!run) return

      run.diagnostics = diagnostics
      if (status) run.status = status
      if (hrStart) run.duration = Math.round(getElapsedMs(hrStart))
    },
  })

  return {
    getSnapshot() {
      if (!run && !ast && files.length === 0 && pluginViews.size === 0 && generatedFiles.size === 0) return emptySnapshot()

      // Return detached data so consumers of the future static data source cannot mutate the
      // collector while it is still subscribed to lifecycle hooks.
      return {
        run: run ? clone(run) : null,
        ast: ast ? clone(ast) : null,
        pluginViews: Object.fromEntries([...pluginViews.entries()].map(([name, view]) => [name, clone(view)])),
        files: clone(files),
        generatedFiles: Object.fromEntries(generatedFiles),
      }
    },
    dispose() {
      // addHooks returns one unsubscriber for the whole group, including every lifecycle listener
      // registered above.
      unhook()
    },
    [Symbol.dispose]() {
      this.dispose()
    },
  }
}
