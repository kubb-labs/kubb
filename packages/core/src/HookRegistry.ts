import type { AsyncEventEmitter } from '@internals/utils'

/**
 * Origin of a tracked listener. Lets the driver collapse the per-source trackers it used to keep
 * (`#hookListeners` + `#middlewareListeners`) into a single registry without losing the tag.
 */
export type HookSource = 'plugin' | 'middleware' | 'driver'

/**
 * Listener shape that matches `AsyncEventEmitter`'s event-map convention: a function that takes a
 * tuple of arguments and returns `TResult` synchronously or via a promise.
 */
export type HookListener<TArgs extends Array<unknown>, TResult = void> = (...args: TArgs) => TResult | Promise<TResult>

type AnyEntry = {
  event: string
  handler: HookListener<Array<unknown>, unknown>
  source: HookSource
}

/**
 * Typed listener bookkeeping that wraps an `AsyncEventEmitter`. Listeners stay on the emitter (so
 * external `emitter.on(...)` observers keep working), but the registry tracks every entry it added
 * so a single `dispose()` call removes exactly those without touching listeners attached directly
 * to the emitter.
 *
 * Dispatch still happens through `emitter.emit(...)` — the registry's job is the tracker collapse
 * and the typed `register` surface, not routing.
 */
export class HookRegistry<TEvents extends { [K in keyof TEvents]: Array<unknown> }> {
  readonly #emitter: AsyncEventEmitter<TEvents>
  readonly #entries = new Set<AnyEntry>()

  constructor(options: { emitter: AsyncEventEmitter<TEvents> }) {
    this.#emitter = options.emitter
  }

  /**
   * The underlying emitter. Exposed so the driver and external code keep dispatching through
   * `emit(...)` — the registry only owns listener tracking.
   */
  get emitter(): AsyncEventEmitter<TEvents> {
    return this.#emitter
  }

  /**
   * Number of listeners the registry currently tracks across all events.
   */
  get size(): number {
    return this.#entries.size
  }

  /**
   * Registers a listener on the underlying emitter and tracks it for disposal.
   *
   * @example
   * ```ts
   * registry.register({ event: 'kubb:plugin:end', handler, source: 'plugin' })
   * ```
   */
  register<K extends keyof TEvents & string>(options: { event: K; handler: HookListener<TEvents[K], unknown>; source: HookSource }): void {
    this.#emitter.on(options.event, options.handler as HookListener<TEvents[K]>)
    this.#entries.add(options as unknown as AnyEntry)
  }

  /**
   * Removes every listener the registry added from the underlying emitter and clears its
   * internal tracker. Listeners attached directly via `emitter.on(...)` are untouched.
   */
  dispose(): void {
    for (const entry of this.#entries) {
      this.#emitter.off(entry.event as keyof TEvents & string, entry.handler as HookListener<Array<unknown>>)
    }
    this.#entries.clear()
  }
}
