import { appendFileSync, statSync, writeFileSync } from 'node:fs'
import { format } from 'node:util'
import { getWorkerLogPath, serveWorker, type WorkerLaunch } from './background.ts'
import { type Credentials, redactSecrets } from './credentials.ts'
import { connect } from './run.ts'

process.title = 'Kubb'

const logPath = getWorkerLogPath()
let credentials: Partial<Credentials> = {}
function log(...args: Array<unknown>) {
  // Read on every line: a refresh or a new pairing replaces the token and key.
  const line = redactSecrets(`${new Date().toISOString()} ${format(...args)}\n`, [process.env.KUBB_TOKEN, credentials.token, credentials.privateKey])
  try {
    // Keep the log under 1 MiB; discard older output when it fills.
    const size = (() => {
      try {
        return statSync(logPath).size
      } catch {
        return 0
      }
    })()
    if (size + Buffer.byteLength(line) > 1024 * 1024) writeFileSync(logPath, '', { mode: 0o600 })
    appendFileSync(logPath, Buffer.from(line).subarray(-1024 * 1024), { mode: 0o600 })
  } catch {
    /* Logging must not stop generation. */
  }
}
console.log = console.info = console.warn = console.error = log
const shutdown = new AbortController()
const events = process as unknown as NodeJS.EventEmitter
const stop = () => shutdown.abort()
events.once('SIGINT', stop)
events.once('SIGTERM', stop)

const launch = await new Promise<WorkerLaunch>((resolve) => process.once('message', (message) => resolve(message as WorkerLaunch)))
credentials = launch.prepared.credentials
const control = await serveWorker(shutdown).catch((error: unknown) => {
  log(error)
  process.exit(1)
})
process.send?.({ started: true })
process.disconnect?.()
if (!('existing' in control)) {
  try {
    log('Background connection starting')
    await connect(launch.options, {
      prepared: launch.prepared,
      signal: shutdown.signal,
      onCredentials: (next) => {
        credentials = next
      },
      onState: async (state) => {
        log(state)
        await control.state(state)
      },
    }).catch((error: unknown) => {
      log(error instanceof Error ? error.message : 'Connection failed')
      process.exitCode = 1
    })
  } finally {
    await control.close()
  }
}
