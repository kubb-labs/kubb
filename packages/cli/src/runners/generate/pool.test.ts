import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type Config, Hookable, type KubbHooks, logLevel, type Reporter } from '@kubb/core'
import { afterEach, describe, expect, it } from 'vitest'
import { createPlainWriter } from '../../loggers/plainWriter.ts'
import { generateInWorkers, type ParentMessage, schedule, type WorkerHandle, type WorkerLaunch, type WorkerMessage } from './pool.ts'

const config = (name: string, input?: string): Config => ({ name, root: tmpdir(), input, output: { path: './gen' }, plugins: [] }) as unknown as Config

/** A worker that answers each job after `delays[index]` ms with the script `play` returns for it. */
function fakeWorker(delays: Array<number>, play: (index: number) => Array<WorkerMessage | 'exit'>): WorkerHandle & { disconnected: boolean } {
  const events = new EventEmitter()
  return {
    disconnected: false,
    on: (event, listener) => events.on(event, listener),
    disconnect() {
      this.disconnected = true
    },
    send(message: ParentMessage) {
      if (message.kind !== 'job') return
      setTimeout(() => {
        for (const step of play(message.index)) {
          if (step === 'exit') events.emit('exit', 1)
          else events.emit('message', step)
        }
      }, delays[message.index])
    },
  }
}

const launch: WorkerLaunch = { configPath: 'kubb.config.ts', logLevel: 'info', audience: 'agent', reporters: [] }

describe('schedule', () => {
  let dir: string

  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('puts the largest local input first and remote inputs last', () => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-pool-'))
    writeFileSync(join(dir, 'small.yaml'), 'openapi: 3.1.0')
    writeFileSync(join(dir, 'large.yaml'), 'openapi: 3.1.0\n'.repeat(20))
    const configs = [config('url', 'https://example.com/openapi.json'), config('small', 'small.yaml'), config('large', 'large.yaml')].map((item) => ({
      ...item,
      root: dir,
    }))

    expect(schedule(configs)).toStrictEqual([2, 1, 0])
  })
})

describe('generateInWorkers', () => {
  it('prints every entry in config order however the workers finish, and hands each result its own config', async () => {
    const configs = [config('a'), config('b'), config('c')]
    const lines: Array<string> = []
    const reported: Array<string> = []
    const reporter: Reporter = { name: 'json', report: (result) => void reported.push(result.config.name!) }
    const spawned: Array<ReturnType<typeof fakeWorker>> = []
    // `a` takes the longest, so `b` and `c` finish first and have to wait for it.
    const spawn = () => {
      const worker = fakeWorker([30, 0, 10], (index) => [
        { kind: 'write', method: 'group', args: [`start ${index}`] },
        { kind: 'report', name: 'json', result: { diagnostics: [], filesCreated: 1, status: 'success', hrStart: [0, 0] } },
        { kind: 'write', method: 'groupEnd', args: [`end ${index}`] },
        { kind: 'done', success: true },
      ])
      spawned.push(worker)
      return worker
    }

    const failed = await generateInWorkers({
      configs,
      launch,
      workers: 2,
      writer: createPlainWriter((line) => lines.push(line)),
      reporters: [reporter],
      logLevel: logLevel.info,
      errorHooks: new Hookable<KubbHooks>(),
      spawn,
    })

    expect(failed).toBe(false)
    expect(lines).toStrictEqual(['start 0', 'end 0', 'start 1', 'end 1', 'start 2', 'end 2'])
    expect(reported).toStrictEqual(['a', 'b', 'c'])
    expect(spawned).toHaveLength(2)
    expect(spawned.every((worker) => worker.disconnected)).toBe(true)
  })

  it('fails the entry of a worker that dies and finishes the rest on a fresh one', async () => {
    const configs = [config('a'), config('b'), config('c')]
    const errors: Array<string> = []
    const errorHooks = new Hookable<KubbHooks>()
    errorHooks.hook('kubb:error', ({ error }) => void errors.push(error.message))
    let spawned = 0
    const spawn = () => {
      spawned++
      return fakeWorker([0, 0, 0], (index) => (index === 1 ? ['exit'] : [{ kind: 'done', success: true }]))
    }

    const failed = await generateInWorkers({
      configs,
      launch,
      workers: 1,
      writer: createPlainWriter(() => {}),
      reporters: [],
      logLevel: logLevel.info,
      errorHooks,
      spawn,
    })

    expect(failed).toBe(true)
    expect(errors).toStrictEqual(['Worker exited with code 1 while generating b'])
    expect(spawned).toBe(2)
  })
})
