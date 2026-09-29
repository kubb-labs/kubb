import { fork } from 'node:child_process'
import { hash, randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { connect as connectSocket, createServer } from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { getProjectKubbHome } from './credentials.ts'
import { prepareConnection, type PreparedConnection, type StudioOptions, type WorkerState } from './run.ts'

export type WorkerRecord = { id: string; pid: number; port: number; state: WorkerState }
const states: Array<WorkerState> = ['starting', 'connected', 'reconnecting', 'authentication required', 'stopped']
export const getWorkerLogPath = () => path.join(getProjectKubbHome(), 'worker.log')
const statePath = () => path.join(getProjectKubbHome(), 'worker.json')

async function readWorker(): Promise<WorkerRecord | null> {
  try {
    const value: unknown = JSON.parse(await readFile(statePath(), 'utf8'))
    if (!value || typeof value !== 'object') return null
    const record = value as Partial<WorkerRecord>
    return typeof record.id === 'string' &&
      /^[a-f0-9]{32}$/.test(record.id) &&
      Number.isInteger(record.pid) &&
      (record.pid ?? 0) > 1 &&
      Number.isInteger(record.port) &&
      (record.port ?? 0) > 0 &&
      (record.port ?? 0) <= 65535 &&
      states.includes(record.state as WorkerState)
      ? (record as WorkerRecord)
      : null
  } catch {
    return null
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM'
  }
}

/** Authenticated loopback IPC; a stored PID never authorizes sending a process signal. */
function requestWorker(record: WorkerRecord, command: 'status' | 'stop'): Promise<WorkerRecord> {
  return new Promise((resolve, reject) => {
    const socket = connectSocket({ host: '127.0.0.1', port: record.port })
    let received = ''
    socket.setTimeout(2_000, () => socket.destroy(new Error('Worker control timed out')))
    socket.once('error', reject)
    socket.once('connect', () => socket.write(JSON.stringify({ id: record.id, command }) + '\n'))
    socket.on('data', (chunk: Buffer) => {
      received += chunk.toString()
      if (received.length > 4096) socket.destroy(new Error('Invalid worker response'))
    })
    socket.once('end', () => {
      try {
        const response = JSON.parse(received) as WorkerRecord
        if (response.id !== record.id || response.pid !== record.pid || !states.includes(response.state)) throw new Error('Worker identity changed')
        resolve(response)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export async function getWorkerStatus(): Promise<{ running: boolean; state: WorkerState; pid?: number }> {
  const record = await readWorker()
  if (!record) return { running: false, state: 'stopped' }
  try {
    const response = await requestWorker(record, 'status')
    return { running: true, state: response.state, pid: response.pid }
  } catch {
    return { running: false, state: record.state === 'authentication required' ? record.state : 'stopped' }
  }
}

export async function stopWorker(): Promise<void> {
  const record = await readWorker()
  if (!record) return
  try {
    await requestWorker(record, 'stop')
  } catch {
    if (isAlive(record.pid) && record.state !== 'stopped' && record.state !== 'authentication required') {
      throw new Error('Cannot verify the background worker. No process was signaled.')
    }
    return
  }
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    try {
      await requestWorker(record, 'status')
    } catch {
      return
    }
    await delay(100)
  }
  throw new Error('The worker has not finished shutting down. Check worker.log and try again.')
}

/** The listening port is the project lock, so stale state never needs a PID-based takeover. */
export async function serveWorker(shutdown: AbortController) {
  const record: WorkerRecord = { id: randomBytes(16).toString('hex'), pid: process.pid, port: 0, state: 'starting' }
  const server = createServer((socket) => {
    let input = ''
    socket.setTimeout(2_000, () => socket.destroy())
    socket.on('error', () => {})
    socket.on('data', (chunk: Buffer) => {
      input += chunk.toString()
      if (input.length > 4096) {
        socket.destroy()
        return
      }
      if (!input.includes('\n')) return
      try {
        const request = JSON.parse(input) as { id?: unknown; command?: unknown }
        if (request.id !== record.id || !['status', 'stop'].includes(String(request.command))) {
          socket.destroy()
          return
        }
        socket.end(JSON.stringify(record))
        if (request.command === 'stop') shutdown.abort()
      } catch {
        socket.destroy()
      }
    })
  })
  // ponytail: one hashed port per project; refuse a collision instead of adding a lock manager.
  const port = 20_000 + (Number.parseInt(hash('sha256', getProjectKubbHome()).slice(0, 8), 16) % 30_000)
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(port, '127.0.0.1', resolve)
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw error
    // Let a simultaneous starter finish writing its record before checking ownership.
    await delay(100)
    const existing = await readWorker()
    if (existing?.port === port) {
      try {
        return { existing: await requestWorker(existing, 'status') }
      } catch {
        /* Refuse an unverified listener. */
      }
    }
    throw new Error('The project control port is occupied or another worker is starting. Try again after stopping that listener.')
  }
  record.port = port
  let saving = Promise.resolve()
  const save = () => {
    const value = JSON.stringify(record)
    saving = saving.then(async () => {
      const temporary = `${statePath()}.${record.id}`
      await writeFile(temporary, value, { mode: 0o600 })
      await rename(temporary, statePath())
    })
    return saving
  }
  try {
    await mkdir(getProjectKubbHome(), { recursive: true, mode: 0o700 })
    await save()
  } catch (error) {
    server.close()
    throw error
  }
  return {
    async state(state: WorkerState) {
      record.state = state
      await save()
    },
    async close() {
      try {
        if (record.state !== 'authentication required') {
          record.state = 'stopped'
          await save()
        }
      } finally {
        await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
      }
    },
  }
}

export type WorkerLaunch = { options: StudioOptions; prepared: PreparedConnection }

export async function startWorker(options: StudioOptions): Promise<void> {
  const current = await getWorkerStatus()
  if (current.running) {
    console.log(`Already running (${current.state}, PID ${current.pid}).`)
    return
  }
  const prepared = await prepareConnection(options)
  const entry = path.join(path.dirname(createRequire(import.meta.url).resolve('@kubb/cli/package.json')), 'dist', 'studioWorker.js')
  const child = fork(entry, [], { cwd: process.cwd(), detached: true, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] })
  try {
    const started = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => done(new Error('Background worker startup timed out')), 20_000)
      const done = (error?: Error) => {
        clearTimeout(timer)
        child.removeListener('error', failed)
        child.removeListener('exit', exited)
        child.removeListener('message', ready)
        if (error) reject(error)
        else resolve()
      }
      const failed = (error: Error) => done(error)
      const exited = () => done(new Error(`Background worker exited during startup. Check ${getWorkerLogPath()}`))
      child.once('error', failed)
      child.once('exit', exited)
      const ready = (message: unknown) => {
        if (!message || typeof message !== 'object' || !('started' in message) || message.started !== true)
          return done(new Error('Invalid worker startup response'))
        done()
      }
      child.once('message', ready)
      child.send({ options: { ...options, autoOpen: false }, prepared } satisfies WorkerLaunch, (error) => {
        if (error) done(error)
      })
    })
    await started
    if (child.connected) child.disconnect()
    child.unref()
    const status = await getWorkerStatus()
    console.log(`Background worker ${status.state} (PID ${status.pid ?? child.pid}). Logs: ${getWorkerLogPath()}`)
  } catch (error) {
    // This is the child we just spawned, not a PID recovered from disk.
    child.kill('SIGTERM')
    throw error
  }
}
