import { ref } from 'vue'

export type PluginRun = {
  name: string
  status: 'running' | 'success' | 'failed'
  duration: number | null
  error: string | null
  schemaCount: number
  operationCount: number
}

export type RunSummary = {
  id: number
  config: string | null
  status: 'running' | 'success' | 'failed'
  duration: number | null
  fileCount: number
  schemaCount: number
  operationCount: number
  plugins: Array<PluginRun>
  diagnostics: Array<{ code: string; severity: string; message: string; plugin: string | null }>
}

export type FileEntry = {
  id: string
  name: string
  baseName: string
  path: string
}

export type AstSnapshot = {
  schemas: Array<Record<string, unknown>>
  operations: Array<Record<string, unknown>>
  meta?: Record<string, unknown>
}

type PluginView = Pick<AstSnapshot, 'schemas' | 'operations'>

export type StaticReportSnapshot = {
  run: RunSummary | null
  ast: AstSnapshot | null
  pluginViews: Record<string, PluginView>
  files: Array<FileEntry>
  generatedFiles: Record<string, string>
}

export type StaticDataSource = {
  readonly run: RunSummary | null
  connect(): Promise<void>
  fetchAst(): Promise<AstSnapshot | null>
  fetchPluginNames(): Promise<Array<string>>
  fetchPluginView(name: string): Promise<AstSnapshot | null>
  fetchFiles(): Promise<Array<FileEntry>>
  readGeneratedFile(id: string): Promise<string | null>
}

const emptySnapshot: StaticReportSnapshot = {
  run: null,
  ast: null,
  pluginViews: {},
  files: [],
  generatedFiles: {},
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

/**
 * Adapts one completed core snapshot to the API used by the presentation components. The source
 * owns a clone so a component cannot mutate the payload supplied by the HTML host.
 */
export function createStaticDataSource(snapshot: StaticReportSnapshot): StaticDataSource {
  const data = clone(snapshot)

  return {
    get run() {
      return data.run ? clone(data.run) : null
    },
    async connect() {},
    async fetchAst() {
      return data.ast ? clone(data.ast) : null
    },
    async fetchPluginNames() {
      return Object.keys(data.pluginViews)
    },
    async fetchPluginView(name) {
      const view = data.pluginViews[name]
      return view ? { ...clone(view), meta: undefined } : null
    },
    async fetchFiles() {
      return clone(data.files)
    },
    async readGeneratedFile(id) {
      return data.generatedFiles[id] ?? null
    },
  }
}

const activeSource = { current: createStaticDataSource(emptySnapshot) }

export const run = ref<RunSummary | null>(null)
export const connected = ref(false)
export const connectionError = ref<string | null>(null)

/**
 * Replaces the payload consumed by the shared UI API. The future HTML entry point can call this
 * before mounting Vue, without exposing the snapshot through a browser global or a network layer.
 */
export function setStaticReportData(snapshot: StaticReportSnapshot): void {
  activeSource.current = createStaticDataSource(snapshot)
  run.value = activeSource.current.run
  connected.value = false
  connectionError.value = null
}

/**
 * Keeps the historical UI lifecycle intact. A static report has no handshake or transport; the
 * promise resolves after the in-memory source is marked ready.
 */
export async function connect(): Promise<void> {
  try {
    await activeSource.current.connect()
    connected.value = true
  } catch (error) {
    connectionError.value = error instanceof Error ? error.message : String(error)
  }
}

export function fetchAst(): Promise<AstSnapshot | null> {
  return activeSource.current.fetchAst()
}

export function fetchPluginNames(): Promise<Array<string>> {
  return activeSource.current.fetchPluginNames()
}

export function fetchPluginView(name: string): Promise<AstSnapshot | null> {
  return activeSource.current.fetchPluginView(name)
}

export function fetchFiles(): Promise<Array<FileEntry>> {
  return activeSource.current.fetchFiles()
}

export function readGeneratedFile(id: string): Promise<string | null> {
  return activeSource.current.readGeneratedFile(id)
}
