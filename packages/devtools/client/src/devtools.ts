import { connectDevframe } from 'devframe/client'
import { ref, shallowRef } from 'vue'

/**
 * Mirrors `RunSummary` from the node side. Duplicated rather than imported so the
 * client bundle stays free of the node package.
 */
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
  startedAt: number
  endedAt: number | null
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
  meta: Record<string, unknown> | undefined
}

const connection = shallowRef<Awaited<ReturnType<typeof connectDevframe>> | null>(null)

export const run = ref<RunSummary | null>(null)
export const connected = ref(false)
export const connectionError = ref<string | null>(null)

let ready: Promise<void> | null = null

// Panels mount and fetch before the handshake finishes, so every call funnels through
// the same connect promise rather than racing it.
async function scope() {
  await connect()
  return connection.value ? connection.value.scope('kubb') : null
}

/**
 * Connects to the devframe backend and keeps {@link run} in sync with the server's
 * shared state, so a reconnect picks the current build back up rather than waiting
 * for the next one.
 */
export function connect(): Promise<void> {
  ready ??= establish()
  return ready
}

async function establish(): Promise<void> {
  try {
    const client = await connectDevframe()

    // The websocket backend gates every call behind the OTP handshake, so block until the
    // server trusts this client rather than firing RPCs it will reject.
    await client.ensureTrusted()
    connection.value = client

    const kubb = client.scope('kubb')
    const state = await kubb.rpc.sharedState<RunSummary>('run')

    run.value = state.value() as RunSummary
    state.on('updated', (next) => {
      run.value = { ...next }
    })

    connected.value = true
  } catch (error) {
    connectionError.value = error instanceof Error ? error.message : String(error)
  }
}

export async function fetchAst(): Promise<AstSnapshot | null> {
  const kubb = await scope()
  return kubb ? kubb.rpc.call('get-ast') : null
}

export async function fetchPluginNames(): Promise<Array<string>> {
  const kubb = await scope()
  return kubb ? kubb.rpc.call('get-plugin-names') : []
}

export async function fetchPluginView(name: string): Promise<AstSnapshot | null> {
  const kubb = await scope()
  return kubb ? kubb.rpc.call('get-plugin-view', name) : null
}

export async function fetchFiles(): Promise<Array<FileEntry>> {
  const kubb = await scope()
  return kubb ? kubb.rpc.call('get-files') : []
}

export async function readGeneratedFile(id: string): Promise<string | null> {
  const kubb = await scope()
  return kubb ? kubb.rpc.call('read-file', id) : null
}
