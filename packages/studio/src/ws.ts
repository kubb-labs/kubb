import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { isAbsolute, relative, resolve } from 'node:path'
import { getElapsedMs } from '@internals/utils'
import { Diagnostics, type Hookable, type KubbHooks } from '@kubb/core'
import WebSocket from 'ws'
import type { GenerationEvent, GenerationEventPayloads, GenerationEventType } from './protocol/index.ts'
import { describeFiles, type FileSet } from './generations.ts'
import { toPackageName } from './resolveConfig.ts'

type WebSocketOptions = WebSocket.ClientOptions

/**
 * How long the initial handshake may take before the socket is closed and the reconnect loop
 * takes over.
 */
const CONNECT_TIMEOUT_MS = 5_000

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
 * Opens a Studio WebSocket connection and closes it when the initial handshake exceeds the configured timeout.
 */
export function createWebsocket(url: string, options: WebSocketOptions): WebSocket {
  const ws = new WebSocket(url, options)

  const timer = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close(3008, 'Connection timeout')
    }
  }, CONNECT_TIMEOUT_MS)

  // Once the handshake settles the timer has nothing left to check, and leaving it pending holds
  // the socket for the rest of the window.
  ws.once('open', () => clearTimeout(timer))
  ws.once('close', () => clearTimeout(timer))

  return ws
}

export type GenerationState = {
  /**
   * What the run produced.
   */
  output: FileSet
  /**
   * What the output directory held on disk before the run, when the agent has a project on disk.
   */
  disk?: FileSet
  peerDependencies: Record<string, string>
  missingDependencies: Array<string>
}

/**
 * What `kubb:generation:end` reports. The session decides whether `output` lives in memory, since
 * only it knows whether the run wrote to disk.
 */
export type GenerationEnd = Omit<GenerationState, 'output' | 'disk'> & { output: Omit<FileSet, 'inMemory'> }

export type GenerationStreamOptions = {
  onGenerationEnd?: (result: GenerationEnd) => void
}

/** Forwards selected Kubb lifecycle events to a native Cap'n Web stream. */
export function createGenerationStream(
  hooks: Hookable<KubbHooks>,
  jobId: string,
  options: GenerationStreamOptions = {},
): { stream: ReadableStream<GenerationEvent>; close: () => Promise<void>; dispose: () => void; fail: (error: unknown) => void } {
  const unhooks: Array<() => void> = []
  let root = ''
  // Infinite HWM so unread events don't stall result()
  const transform = new TransformStream<GenerationEvent>(undefined, undefined, { highWaterMark: Infinity })
  const writer = transform.writable.getWriter()
  let writes = Promise.resolve()
  let closed = false
  let streamError: unknown

  /**
   * Registers a listener and keeps its remover, so one generation's listeners come off the session
   * emitter again when that generation ends.
   */
  function on<TName extends keyof KubbHooks & string>(name: TName, handler: (...args: KubbHooks[TName]) => unknown): void {
    unhooks.push(hooks.hook(name, handler))
  }

  function emitEvent<Type extends GenerationEventType>(type: Type, data: GenerationEventPayloads[Type]): void {
    const event = { jobId, type, data, version: 1 as const, timestamp: Date.now() } as unknown as GenerationEvent
    // A prior failure skips the write; either way the chain settles so the next event still runs.
    writes = writes
      .then(() => writer.write(event))
      .catch((error) => {
        streamError = error
      })
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
    const { hashes, bytes } = await describeFiles(storage, config.root, paths)
    options.onGenerationEnd?.({ output: { storage, root: config.root, paths, hashes, bytes }, peerDependencies, missingDependencies })

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
    await writes
    // Consumer cancel sets streamError; don't fail a successful generation over that.
    if (streamError) {
      return
    }
    await writer.close().catch(() => undefined)
  }

  function fail(error?: unknown): void {
    detach()
    if (closed) {
      return
    }
    closed = true
    void writer.abort(error).catch(() => undefined)
  }

  return { stream: transform.readable, close, dispose: () => fail(), fail }
}
