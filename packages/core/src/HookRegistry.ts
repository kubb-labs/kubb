import type { AsyncEventEmitter } from '@internals/utils'

export type HookSource = 'plugin' | 'driver'

export type HookListener<TArgs extends Array<unknown>, TResult = void> = (...args: TArgs) => TResult | Promise<TResult>

type AnyEntry = {
  event: string
  handler: HookListener<Array<unknown>, unknown>
  source: HookSource
}

/**
 * Listener bookkeeping around an `AsyncEventEmitter`. Listeners attached through `register`
 * stay on the emitter but are tracked so `dispose()` removes only them, listeners attached
 * directly via `emitter.on(...)` survive.
 */
export class HookRegistry<TEvents extends { [K in keyof TEvents]: Array<unknown> }> {
  readonly #emitter: AsyncEventEmitter<TEvents>
  readonly #entries = new Set<AnyEntry>()

  constructor(options: { emitter: AsyncEventEmitter<TEvents> }) {
    this.#emitter = options.emitter
  }

  get emitter(): AsyncEventEmitter<TEvents> {
    return this.#emitter
  }

  get size(): number {
    return this.#entries.size
  }

  register<K extends keyof TEvents & string>(options: { event: K; handler: HookListener<TEvents[K], unknown>; source: HookSource }): void {
    this.#emitter.on(options.event, options.handler as HookListener<TEvents[K]>)
    this.#entries.add(options as unknown as AnyEntry)
  }

  dispose(): void {
    for (const entry of this.#entries) {
      this.#emitter.off(entry.event as keyof TEvents & string, entry.handler as HookListener<Array<unknown>>)
    }
    this.#entries.clear()
  }
}
