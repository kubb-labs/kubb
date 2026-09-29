import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { connect as connectSocket, createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getWorkerStatus, serveWorker, stopWorker } from './background.ts'
import { getProjectKubbHome } from './credentials.ts'

let home: string
const owners: Array<Awaited<ReturnType<typeof serveWorker>>> = []

beforeEach(async () => {
  home = await mkdtemp(path.join(tmpdir(), 'kubb-worker-'))
  vi.stubEnv('KUBB_HOME', home)
})

afterEach(async () => {
  for (const owner of owners.splice(0)) if (!('existing' in owner)) await owner.close()
  vi.unstubAllEnvs()
  await rm(home, { recursive: true, force: true })
})

it('allows one simultaneous owner and stops only through authenticated control', async () => {
  const signals = [new AbortController(), new AbortController()]
  owners.push(...(await Promise.all(signals.map((signal) => serveWorker(signal)))))
  expect(owners.filter((owner) => !('existing' in owner))).toHaveLength(1)
  const ownerIndex = owners.findIndex((owner) => !('existing' in owner))
  const owner = owners[ownerIndex]!
  if ('existing' in owner) throw new Error('Missing owner')
  await owner.state('connected')
  expect(await getWorkerStatus()).toMatchObject({ running: true, state: 'connected', pid: process.pid })
  const file = path.join(getProjectKubbHome(), 'worker.json')
  const record = JSON.parse(await readFile(file, 'utf8'))
  expect((await stat(file)).mode & 0o777).toBe(0o600)

  // An unrelated local client must not be able to stop this project.
  await new Promise<void>((resolve, reject) => {
    const socket = connectSocket({ host: '127.0.0.1', port: record.port })
    socket.on('error', reject)
    socket.once('connect', () => socket.write(JSON.stringify({ id: 'wrong', command: 'stop' }) + '\n'))
    socket.once('close', () => resolve())
  })
  expect(signals[ownerIndex]!.signal.aborted).toBe(false)
  signals[ownerIndex]!.signal.addEventListener(
    'abort',
    () => {
      void owner.close()
      owners.splice(0)
    },
    { once: true },
  )
  await stopWorker()
  expect(signals[ownerIndex]!.signal.aborted).toBe(true)
  expect(await getWorkerStatus()).toEqual({ running: false, state: 'stopped' })
})

it('reclaims stale state without signaling its PID and retains login-required status', async () => {
  const first = await serveWorker(new AbortController())
  if ('existing' in first) throw new Error('Unexpected owner')
  await first.close()
  const file = path.join(getProjectKubbHome(), 'worker.json')
  const record = JSON.parse(await readFile(file, 'utf8'))
  // PID reuse is harmless: ownership comes from the listener and nonce.
  await writeFile(file, JSON.stringify({ ...record, pid: process.pid, state: 'connected' }))
  await expect(stopWorker()).resolves.toBeUndefined()
  const listener = createServer((socket) => socket.once('data', () => socket.end('{}')))
  await new Promise<void>((resolve) => listener.listen(record.port, '127.0.0.1', resolve))
  try {
    await expect(stopWorker()).rejects.toThrow('Cannot verify')
  } finally {
    await new Promise<void>((resolve) => listener.close(() => resolve()))
  }
  const next = await serveWorker(new AbortController())
  if ('existing' in next) throw new Error('Unexpected owner')
  await next.state('authentication required')
  await next.close()
  expect(await getWorkerStatus()).toEqual({ running: false, state: 'authentication required' })
  await expect(stopWorker()).resolves.toBeUndefined()
})
