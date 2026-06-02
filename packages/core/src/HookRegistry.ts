import { type AsyncEventEmitter, toError } from '@internals/utils'

/**
 * Dispatch kind of a hook.
 *
 * - `'sequential'` awaits every listener in registration order. The same shape `AsyncEventEmitter.emit` already has.
 * - `'firstResult'` walks listeners in registration order and returns the first non-nullish result.
 *   Modelled after Rollup's `first` hook kind and pluggy's `firstresult`.
 */
export type HookKind = 'sequential' | 'firstResult'

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
 * Typed listener registry that wraps an `AsyncEventEmitter` and routes dispatch through a declared
 * per-event `HookKind` table. Listeners stay on the emitter (so external `emitter.on(...)` observers
 * keep working), but the registry tracks every entry it added so a single `dispose()` call removes
 * exactly those without touching listeners attached directly to the emitter.
 *
 * `invoke('event', ...args)` delegates to `emitter.emit` for sequential hooks and walks the tracked
 * entries for `firstResult` hooks, returning the first non-nullish handler return value.
 */
export class HookRegistry<TEvents extends { [K in keyof TEvents]: Array<unknown> }, TKinds extends { [K in keyof TEvents]: HookKind }> {
  readonly #emitter: AsyncEventEmitter<TEvents>
  readonly #kinds: TKinds
  readonly #entries = new Set<AnyEntry>()

  constructor(options: { emitter: AsyncEventEmitter<TEvents>; kinds: TKinds }) {
    this.#emitter = options.emitter
    this.#kinds = options.kinds
  }

  /**
   * The underlying emitter. Exposed so the driver can keep calling `emitter.emit(...)` for
   * sequential hooks during the migration. External code subscribes via this emitter as well.
   */
  get emitter(): AsyncEventEmitter<TEvents> {
    return this.#emitter
  }

  /**
   * Number of listeners the registry currently tracks across all events. Used in tests to
   * compare against the driver's legacy trackers during the dual-write parity step.
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
   * Dispatches `event` according to its declared kind.
   *
   * - `'sequential'`: delegates to `emitter.emit` (awaits listeners in order; returns `void` /
   *   `Promise<void>`). Errors are wrapped by `AsyncEventEmitter.#emitAll`.
   * - `'firstResult'`: walks tracked entries for `event` in registration order, awaits each, and
   *   returns the first non-`null`/non-`undefined` return value. Wraps thrown causes with the
   *   event name to mirror the sequential path.
   */
  invoke<K extends keyof TEvents & string>(event: K, ...args: TEvents[K]): Promise<unknown> | void {
    const kind = this.#kinds[event]
    if (kind === 'firstResult') {
      return this.#invokeFirstResult(event, args)
    }
    return this.#emitter.emit(event, ...args)
  }

  async #invokeFirstResult<K extends keyof TEvents & string>(event: K, args: TEvents[K]): Promise<unknown> {
    for (const entry of this.#entries) {
      if (entry.event !== event) continue
      try {
        const result = await entry.handler(...args)
        if (result !== null && result !== undefined) return result
      } catch (err) {
        throw new Error(`Error in firstResult listener for "${event}"`, { cause: toError(err) })
      }
    }
    return undefined
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
