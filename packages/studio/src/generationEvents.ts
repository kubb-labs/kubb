import { stripVTControlCharacters } from 'node:util'
import type { Hookable, KubbHooks } from '@kubb/core'
import { type GenerationEvent, type GenerationEventPayloads, type GenerationEventType, generationEventTypes } from './protocol.ts'
import { relativeStoragePath } from './generations.ts'

/** How each published hook's context becomes its wire payload; a hook without a projection fails to compile. */
type Projections = { [Type in GenerationEventType]: (...args: KubbHooks[Type]) => GenerationEventPayloads[Type] }

const MAX_QUEUED_EVENTS = 1_024
const RESERVED_EVENTS = 64
export type GenerationStreamOptions = {
  hooks: Hookable<KubbHooks>
  jobId: string
  debug?: boolean
}

const isDiscardable = (type: GenerationEventType) => type === 'kubb:files:processing:update' || type === 'kubb:info' || type === 'kubb:success'

function createProjections({ debug, root }: { debug: boolean; root: () => string }): Projections {
  // Stacks hold local paths and source lines, which a shared agent must not hand to Studio.
  const stackOf = (error: Error | undefined) => (debug ? error?.stack : undefined)
  return {
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
          file: relativeStoragePath({ root: root(), filePath: file.path }),
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
    'kubb:error': ({ error }) => [{ message: error.message, stack: stackOf(error) }],
    'kubb:diagnostic': ({ diagnostic }) => [
      {
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
        location: 'location' in diagnostic ? diagnostic.location : undefined,
        help: 'help' in diagnostic ? diagnostic.help : undefined,
        plugin: 'plugin' in diagnostic ? diagnostic.plugin : undefined,
        stack: 'cause' in diagnostic ? stackOf(diagnostic.cause) : undefined,
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
      { id, command, args: args ? [...args] : undefined, success, error: error ? { message: error.message, stack: stackOf(error) } : undefined },
    ],
  }
}

/**
 * Forwards selected Kubb lifecycle events to a native Cap'n Web stream.
 *
 * @example
 * ```ts
 * const generation = createGenerationStream({ hooks, jobId })
 * await generation.close()
 * ```
 */
export class GenerationStream {
  readonly stream: ReadableStream<GenerationEvent>
  readonly #hooks: Hookable<KubbHooks>
  readonly #jobId: string
  readonly #projections: Projections
  readonly #unhooks: Array<() => void> = []
  #controller!: ReadableStreamDefaultController<GenerationEvent>
  #root = ''
  #closed = false

  constructor({ hooks, jobId, debug = false }: GenerationStreamOptions) {
    this.#hooks = hooks
    this.#jobId = jobId
    this.#projections = createProjections({ debug, root: () => this.#root })
    this.stream = new ReadableStream<GenerationEvent>(
      {
        start: (value) => {
          this.#controller = value
        },
        cancel: () => {
          this.#closed = true
          this.#detach()
        },
      },
      { highWaterMark: MAX_QUEUED_EVENTS },
    )

    // Paths in `kubb:files:processing:update` are made relative to the root the build announced.
    this.#on({
      name: 'kubb:build:start',
      handler: ({ config }) => {
        this.#root = config.root
      },
    })
    for (const type of generationEventTypes) this.#forward(type)
  }

  // Keeps the remover of each listener, so one generation's listeners come off the session emitter when it ends.
  #on<TName extends keyof KubbHooks & string>({ name, handler }: { name: TName; handler: (...args: KubbHooks[TName]) => unknown }): void {
    this.#unhooks.push(this.#hooks.hook(name, handler))
  }

  #emit<Type extends GenerationEventType>({ type, data }: { type: Type; data: GenerationEventPayloads[Type] }): void {
    if (this.#closed) return
    const controller = this.#controller
    const event = { jobId: this.#jobId, type, data, version: 1 as const, timestamp: Date.now() } as unknown as GenerationEvent
    if (controller.desiredSize! <= RESERVED_EVENTS && isDiscardable(type)) return
    if (controller.desiredSize! <= 0) {
      this.fail(new Error(`Generation event stream exceeded ${MAX_QUEUED_EVENTS} queued events`))
      return
    }
    controller.enqueue(event)
  }

  #forward<Type extends GenerationEventType>(type: Type): void {
    this.#on({
      name: type,
      handler: (...args: KubbHooks[Type]) => {
        this.#emit({ type, data: this.#projections[type](...args) })
        // Generators render in memory without awaiting I/O, so the socket only sends once the event loop gets a turn.
        if (!isDiscardable(type)) return new Promise<void>((resolve) => setImmediate(resolve))
      },
    })
  }

  // Safe to call twice.
  #detach(): void {
    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
  }

  async close(): Promise<void> {
    if (this.#closed) return
    this.#closed = true
    this.#detach()
    this.#controller.close()
  }

  fail(error?: unknown): void {
    this.#detach()
    if (this.#closed) return
    this.#closed = true
    this.#controller.error(error)
  }
}

export function createGenerationStream(options: GenerationStreamOptions): GenerationStream {
  return new GenerationStream(options)
}
