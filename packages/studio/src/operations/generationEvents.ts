import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve } from 'node:path'
import { getElapsedMs } from '@internals/utils'
import { Diagnostics, type Hookable, type KubbHooks } from '@kubb/core'
import type { GenerationEvent, GenerationEventPayloads, GenerationEventType } from '../protocol/index.ts'
import type { SourceFiles } from './generations.ts'
import { toPackageName } from './resolveConfig.ts'

const require = createRequire(import.meta.url)

function relativeStoragePath(root: string, filePath: string): string {
  return (isAbsolute(filePath) ? relative(resolve(root), filePath) : filePath).replaceAll('\\', '/')
}

type PackageJSON = {
  version?: string
}

async function resolvePeerDependencies(names: Array<string>): Promise<{
  peerDependencies: Record<string, string>
  missingDependencies: Array<string>
}> {
  const uniqueNames = [...new Set(names.map(toPackageName))]
  const peerDependencies: Record<string, string> = {}
  const missingDependencies: Array<string> = []

  const versions = await Promise.all(
    uniqueNames.map(async (name) => {
      try {
        const path = require.resolve(`${name}/package.json`)
        const packageJSON = JSON.parse(await readFile(path, 'utf8')) as PackageJSON
        return packageJSON.version
      } catch {
        return undefined
      }
    }),
  )

  for (const [index, name] of uniqueNames.entries()) {
    const version = versions[index]
    if (version) {
      peerDependencies[name] = version
      continue
    }
    missingDependencies.push(name)
  }

  return { peerDependencies, missingDependencies }
}

/**
 * What `kubb:generation:end` reports: the files the run produced, still in its own storage.
 */
export type GenerationEnd = {
  output: SourceFiles
  peerDependencies: Record<string, string>
  missingDependencies: Array<string>
}

export type GenerationStreamOptions = {
  onGenerationEnd?: (result: GenerationEnd) => void
}

const MAX_QUEUED_EVENTS = 1_024
const RESERVED_EVENTS = 64
const isDiscardable = (event: GenerationEvent) =>
  event.type === 'kubb:files:processing:update' || event.type === 'kubb:info' || event.type === 'kubb:success'

/** Forwards selected Kubb lifecycle events to a native Cap'n Web stream. */
export function createGenerationStream(
  hooks: Hookable<KubbHooks>,
  jobId: string,
  options: GenerationStreamOptions = {},
): { stream: ReadableStream<GenerationEvent>; close: () => Promise<void>; dispose: () => void; fail: (error: unknown) => void } {
  const unhooks: Array<() => void> = []
  let root = ''
  let controller!: ReadableStreamDefaultController<GenerationEvent>
  let closed = false
  const stream = new ReadableStream<GenerationEvent>(
    {
      start: (value) => {
        controller = value
      },
      cancel: () => {
        closed = true
        detach()
      },
    },
    { highWaterMark: MAX_QUEUED_EVENTS },
  )

  /**
   * Registers a listener and keeps its remover, so one generation's listeners come off the session
   * emitter again when that generation ends.
   */
  function on<TName extends keyof KubbHooks & string>(name: TName, handler: (...args: KubbHooks[TName]) => unknown): void {
    unhooks.push(hooks.hook(name, handler))
  }

  function emitEvent<Type extends GenerationEventType>(type: Type, data: GenerationEventPayloads[Type]): void {
    if (closed) return
    const event = { jobId, type, data, version: 1 as const, timestamp: Date.now() } as unknown as GenerationEvent
    if (controller.desiredSize! <= RESERVED_EVENTS && isDiscardable(event)) return
    if (controller.desiredSize! <= 0) {
      fail(new Error(`Generation event stream exceeded ${MAX_QUEUED_EVENTS} queued events`))
      return
    }
    controller.enqueue(event)
  }

  on('kubb:plugin:start', (ctx) => {
    emitEvent('kubb:plugin:start', [{ plugin: { name: ctx.plugin.name } }])
  })

  on('kubb:plugin:end', (ctx) => {
    emitEvent('kubb:plugin:end', [{ plugin: { name: ctx.plugin.name }, duration: ctx.duration, success: ctx.success }])
  })

  on('kubb:build:start', ({ config, adapter }) => {
    root = config.root
    emitEvent('kubb:build:start', [{ config: { name: config.name }, adapter: { name: adapter.name } }])
  })

  on('kubb:build:end', ({ files, config, outputDir }) => {
    emitEvent('kubb:build:end', [{ files: files.map((file) => ({ path: relativeStoragePath(config.root, file.path), name: file.name })), outputDir }])
  })

  on('kubb:files:processing:start', ({ files }) => {
    emitEvent('kubb:files:processing:start', [{ total: files.length }])
  })

  on('kubb:files:processing:update', ({ files }) => {
    emitEvent('kubb:files:processing:update', [
      {
        files: files.map(({ file, processed, total, percentage }) => ({
          file: relativeStoragePath(root, file.path),
          processed,
          total,
          percentage,
        })),
      },
    ])
  })

  on('kubb:files:processing:end', ({ files }) => {
    emitEvent('kubb:files:processing:end', [{ total: files.length }])
  })

  // The three log levels differ only in their event name.
  for (const type of ['kubb:info', 'kubb:success', 'kubb:warn'] as const) {
    on(type, ({ message, info }) => {
      emitEvent(type, [{ message, info }])
    })
  }

  on('kubb:generation:start', ({ config }) => {
    emitEvent('kubb:generation:start', [
      {
        name: config.name,
        plugins: config.plugins.length,
      },
    ])
  })

  on('kubb:generation:end', async ({ config, storage, diagnostics = [], status, hrStart, filesCreated }) => {
    const { peerDependencies, missingDependencies } = await resolvePeerDependencies(config.plugins.map(({ name }) => name))
    const keys = await storage.readKeys()
    const paths = new Set(keys.map((key) => relativeStoragePath(config.root, key)))
    options.onGenerationEnd?.({ output: { storage, root: config.root, paths }, peerDependencies, missingDependencies })

    emitEvent('kubb:generation:end', [])

    if (!hrStart) {
      return
    }

    const duration = Math.round(getElapsedMs(hrStart))

    emitEvent('kubb:generation:summary', [
      { duration, fileCount: filesCreated ?? 0, failedPlugins: Diagnostics.failedPlugins(diagnostics).length, status: status ?? 'success' },
    ])
  })

  on('kubb:error', ({ error }) => {
    emitEvent('kubb:error', [
      {
        message: error.message,
        stack: error.stack,
      },
    ])
  })

  on('kubb:diagnostic', ({ diagnostic }) => {
    const cause = 'cause' in diagnostic ? diagnostic.cause : undefined
    emitEvent('kubb:diagnostic', [
      {
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        location: 'location' in diagnostic ? diagnostic.location : undefined,
        help: 'help' in diagnostic ? diagnostic.help : undefined,
        plugin: 'plugin' in diagnostic ? diagnostic.plugin : undefined,
        stack: cause?.stack,
      },
    ])
  })

  // Bracketing events carry no context, so they forward identically.
  for (const type of [
    'kubb:lifecycle:start',
    'kubb:lifecycle:end',
    'kubb:format:start',
    'kubb:format:end',
    'kubb:lint:start',
    'kubb:lint:end',
    'kubb:hooks:start',
    'kubb:hooks:end',
  ] as const) {
    on(type, () => {
      emitEvent(type, [])
    })
  }

  on('kubb:hook:start', ({ id, command, args }) => {
    emitEvent('kubb:hook:start', [{ id, command, args: args ? [...args] : undefined }])
  })

  on('kubb:hook:line', ({ id, line }) => {
    emitEvent('kubb:hook:line', [{ id, line }])
  })

  on('kubb:hook:end', ({ id, command, args, success, error }) => {
    emitEvent('kubb:hook:end', [
      {
        id,
        command,
        args: args ? [...args] : undefined,
        success,
        error: error ? { message: error.message, stack: error.stack } : undefined,
      },
    ])
  })

  /**
   * Takes this generation's listeners off the session emitter. Safe to call twice.
   */
  function detach(): void {
    for (const unhook of unhooks) unhook()
    unhooks.length = 0
  }

  async function close(): Promise<void> {
    if (closed) {
      return
    }
    closed = true
    detach()
    controller.close()
  }

  function fail(error?: unknown): void {
    detach()
    if (closed) {
      return
    }
    closed = true
    controller.error(error)
  }

  return { stream, close, dispose: () => fail(), fail }
}
