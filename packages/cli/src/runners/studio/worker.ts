import { appendFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { format } from 'node:util'
import { createFileStorage, setStorage } from '@kubb/studio'
import { getProjectKubbHome } from './credentials.ts'
import { getWorkerLogPath, serveWorker, type WorkerLaunch } from './background.ts'
import { connect } from './run.ts'

mkdirSync(getProjectKubbHome(), { recursive: true, mode: 0o700 })
const logPath = getWorkerLogPath()
const tokens = [process.env.KUBB_AGENT_TOKEN, process.env.KUBB_TOKEN]
function log(...args: Array<unknown>) {
  let line = `${new Date().toISOString()} ${format(...args)}\n`
  for (const token of tokens) {
    if (token) line = line.replaceAll(token, '[redacted]')
  }
  try {
    // ponytail: keep one 1 MiB log; add rotation only if older diagnostics are needed.
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
tokens.push(launch.prepared.credentials.token)
const control = await serveWorker(shutdown).catch((error: unknown) => {
  log(error)
  process.exit(1)
})
process.send?.({ started: true })
process.disconnect?.()
if (!('existing' in control)) {
  try {
    setStorage(createFileStorage(getProjectKubbHome()))
    log('Background connection starting')
    const token = launch.prepared.credentials.token
    await connect(launch.options, {
      prepared: launch.prepared,
      signal: shutdown.signal,
      onState: async (state) => {
        log(state)
        await control.state(state)
      },
    }).catch((error: unknown) => {
      log(error instanceof Error ? error.message.replaceAll(token, '[redacted]') : 'Connection failed')
      process.exitCode = 1
    })
  } finally {
    await control.close()
  }
}
