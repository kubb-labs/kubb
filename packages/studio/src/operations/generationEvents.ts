import { stripVTControlCharacters } from 'node:util'
import { getElapsedMs } from '@internals/utils'
import { Diagnostics, type Hookable, type KubbHooks } from '@kubb/core'
import { type GenerationEvent, type GenerationEventPayloads, type GenerationEventType, generationEventTypes } from '../protocol/index.ts'
import { relativeStoragePath } from './generations.ts'

/** How each published hook's context becomes its wire payload; a hook without a projection fails to compile. */
type Projections = { [Type in GenerationEventType]: (...args: KubbHooks[Type]) => GenerationEventPayloads[Type] }

const MAX_QUEUED_EVENTS = 1_024
const RESERVED_EVENTS = 64
const isDiscardable = (event: GenerationEvent) => event.type === 'kubb:files:processing:update' || event.type === 'kubb:info' || event.type === 'kubb:success'

/** Forwards selected Kubb lifecycle events to a native Cap'n Web stream. */
export function createGenerationStream(
  hooks: Hookable<KubbHooks>,
  jobId: string,
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

  const projections: Projections = {
    'kubb:plugin:start': ({ plugin }) => [{ plugin: { name: plugin.name } }],
    'kubb:plugin:end': ({ plugin, duration, success }) => [{ plugin: { name: plugin.name }, duration, success }],
    'kubb:build:start': ({ config, adapter }) => [{ config: { name: config.name }, adapter: { name: adapter.name } }],
    'kubb:build:end': ({ files, config, outputDir }) => [
      { files: files.map((file) => ({ path: relativeStoragePath({ root: config.root, filePath: file.path }), name: file.name })), outputDir },
    ],
    'kubb:files:processing:start': ({ files }) => [{ total: files.length }],
    'kubb:files:processing:update': ({ files }) => [
      {
        files: files.map(({ file, processed, total, percentage }) => ({
          file: relativeStoragePath({ root, filePath: file.path }),
          processed,
          total,
          percentage,
        })),
      },
    ],
    'kubb:files:processing:end': ({ files }) => [{ total: files.length }],
    'kubb:info': ({ message, info }) => [{ message: stripVTControlCharacters(message), info }],
    'kubb:success': ({ message, info }) => [{ message: stripVTControlCharacters(message), info }],
    'kubb:warn': ({ message, info }) => [{ message: stripVTControlCharacters(message), info }],
    'kubb:error': ({ error }) => [{ message: error.message, stack: error.stack }],
    'kubb:diagnostic': ({ diagnostic }) => [
      {
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        location: 'location' in diagnostic ? diagnostic.location : undefined,
        help: 'help' in diagnostic ? diagnostic.help : undefined,
        plugin: 'plugin' in diagnostic ? diagnostic.plugin : undefined,
        stack: 'cause' in diagnostic ? diagnostic.cause?.stack : undefined,
      },
    ],
    'kubb:generation:start': ({ config }) => [{ name: config.name, plugins: config.plugins.length }],
    'kubb:generation:end': () => [],
    'kubb:generation:summary': ({ duration, fileCount, failedPlugins, status }) => [{ duration, fileCount, failedPlugins, status }],
    'kubb:lifecycle:start': () => [],
    'kubb:lifecycle:end': () => [],
    'kubb:format:start': () => [],
    'kubb:format:end': () => [],
    'kubb:lint:start': () => [],
    'kubb:lint:end': () => [],
    'kubb:hooks:start': () => [],
    'kubb:hooks:end': () => [],
    'kubb:hook:start': ({ id, command, args }) => [{ id, command, args: args ? [...args] : undefined }],
    'kubb:hook:line': ({ id, line }) => [{ id, line }],
    'kubb:hook:end': ({ id, command, args, success, error }) => [
      { id, command, args: args ? [...args] : undefined, success, error: error ? { message: error.message, stack: error.stack } : undefined },
    ],
  }

  function forward<Type extends GenerationEventType>(type: Type): void {
    on(type, (...args: KubbHooks[Type]) => emitEvent(type, projections[type](...args)))
  }

  // Paths in `kubb:files:processing:update` are made relative to the root the build announced.
  on('kubb:build:start', ({ config }) => {
    root = config.root
  })

  for (const type of generationEventTypes) forward(type)

  // Registered after the loop so the summary follows its `kubb:generation:end`; core never emits it.
  on('kubb:generation:end', ({ diagnostics = [], status, hrStart, filesCreated }) => {
    if (!hrStart) {
      return
    }

    const duration = Math.round(getElapsedMs(hrStart))

    emitEvent('kubb:generation:summary', [
      { duration, fileCount: filesCreated ?? 0, failedPlugins: Diagnostics.failedPlugins(diagnostics).length, status: status ?? 'success' },
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
