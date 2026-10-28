import { fork } from 'node:child_process'
import { statSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  type CLIOptions,
  type Config,
  Diagnostics,
  type GenerationResult,
  getInputKind,
  type Hookable,
  type KubbHooks,
  type ProblemDiagnostic,
  type Reporter,
} from '@kubb/core'
import { getInputPath } from '../../loggers/features/context.ts'
import type { LoggerWriter } from '../../loggers/types.ts'

/** The writer calls a worker relays as-is. Its spinner and progress collapse into `step` and `error` lines. */
export type WriterMethod = Exclude<keyof LoggerWriter, 'audience' | 'spinner' | 'progress'>

/** What a worker needs to load the config file and report like the main process would. */
export type WorkerLaunch = {
  configPath: string
  input?: string
  logLevel: CLIOptions['logLevel']
  dryRun?: boolean
  audience: LoggerWriter['audience']
  /** The reporters the main process selected. The worker relays their results; `cli` renders through the relayed writer. */
  reporters: Array<{ name: string; needsPluginFiles?: boolean }>
}

export type ParentMessage = ({ kind: 'start' } & WorkerLaunch) | { kind: 'job'; index: number }

export type WorkerMessage =
  | { kind: 'write'; method: WriterMethod; args: Array<unknown> }
  /** A reporter's result for the current entry, without the config: the main process has its own copy. */
  | { kind: 'report'; name: string; result: Omit<GenerationResult, 'config'> }
  | { kind: 'error'; diagnostic: ProblemDiagnostic }
  | { kind: 'done'; success: boolean }

/** The part of a `ChildProcess` the pool uses, so a test can stand in a fake. */
export type WorkerHandle = {
  send(message: ParentMessage): unknown
  on(event: 'message', listener: (message: WorkerMessage) => void): unknown
  on(event: 'exit', listener: (code: number | null) => void): unknown
  disconnect(): void
}

/** The built worker entry, next to the CLI's own bundle. */
export function spawnWorker(): WorkerHandle {
  const entry = path.join(path.dirname(createRequire(import.meta.url).resolve('@kubb/cli/package.json')), 'dist', 'generateWorker.js')
  // `advanced` keeps the `Error` behind a diagnostic's `cause` intact; JSON would flatten it to `{}`.
  return fork(entry, [], { serialization: 'advanced' })
}

/** Config indexes, largest local input first, so one worker does not end the run with the biggest specs. */
export function schedule(configs: ReadonlyArray<Config>, input?: string): Array<number> {
  const size = (config: Config): number => {
    const file = input ?? getInputPath(config)
    if (!file || getInputKind(file) !== 'file') return 0
    try {
      return statSync(path.resolve(config.root, file)).size
    } catch {
      return 0
    }
  }
  return configs
    .map((config, index) => ({ index, size: size(config) }))
    .sort((a, b) => b.size - a.size)
    .map(({ index }) => index)
}

type PoolOptions = {
  configs: ReadonlyArray<Config>
  launch: WorkerLaunch
  workers: number
  writer: LoggerWriter
  reporters: ReadonlyArray<Reporter>
  logLevel: number
  /** Receives the diagnostics a worker raises outside a build, like `run` does for a config that throws. */
  errorHooks: Hookable<KubbHooks>
  spawn?: () => WorkerHandle
}

/**
 * Generates `configs` on `workers` child processes. Each worker loads the config file itself and
 * picks its entry by index, since plugin options hold callbacks that cannot cross a process
 * boundary. The output keeps config order: the entry at the front streams live, later ones buffer
 * until every entry before them is done. Resolves to whether any entry failed.
 */
export async function generateInWorkers({
  configs,
  launch,
  workers,
  writer,
  reporters,
  logLevel,
  errorHooks,
  spawn = spawnWorker,
}: PoolOptions): Promise<boolean> {
  const queue = schedule(configs, launch.input)
  let anyFailed = false

  const { promise: finished, resolve: allDone } = Promise.withResolvers<void>()
  // Writes and reports run one after another, in config order.
  let output: Promise<unknown> = Promise.resolve()
  const buffered = new Map<number, Array<() => unknown>>()
  const done = new Set<number>()
  let cursor = 0
  const emit = (index: number, action: () => unknown) => {
    if (index !== cursor) {
      buffered.set(index, [...(buffered.get(index) ?? []), action])
      return
    }
    output = output.then(action).catch((error) => Diagnostics.emit(errorHooks, error))
  }
  const finish = (index: number) => {
    done.add(index)
    while (done.has(cursor)) {
      cursor++
      for (const action of buffered.get(cursor) ?? []) emit(cursor, action)
      buffered.delete(cursor)
    }
    if (done.size === configs.length) allDone()
  }

  const context = { logLevel }

  function launchWorker(): void {
    const worker = spawn()
    let current: number | undefined
    worker.send({ kind: 'start', ...launch })

    const next = () => {
      current = queue.shift()
      if (current === undefined) {
        worker.disconnect()
        return
      }
      worker.send({ kind: 'job', index: current })
    }

    worker.on('message', (message) => {
      if (current === undefined) return
      const index = current
      if (message.kind === 'write') {
        emit(index, () => (writer[message.method] as (...args: Array<unknown>) => void)(...message.args))
      } else if (message.kind === 'report') {
        const reporter = reporters.find((reporter) => reporter.name === message.name)
        emit(index, () => reporter?.report({ ...message.result, config: configs[index]! }, context))
      } else if (message.kind === 'error') {
        anyFailed = true
        emit(index, () => Diagnostics.emit(errorHooks, message.diagnostic))
      } else {
        if (!message.success) anyFailed = true
        current = undefined
        finish(index)
        next()
      }
    })
    worker.on('exit', (code) => {
      if (current === undefined) return
      // The worker died mid-entry: fail that entry and let a fresh worker take what is left.
      const index = current
      current = undefined
      anyFailed = true
      emit(index, () =>
        Diagnostics.emit(errorHooks, new Error(`Worker exited with code ${code} while generating ${configs[index]?.name ?? `config ${index + 1}`}`)),
      )
      finish(index)
      if (queue.length) launchWorker()
    })

    next()
  }

  for (let i = 0; i < Math.min(workers, queue.length); i++) launchWorker()

  await finished
  await output
  return anyFailed
}
