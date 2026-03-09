import { EventEmitter as NodeEventEmitter } from 'node:events'
import { toError } from './errors.ts'

/** A function that can be registered as an event listener, synchronous or async. */
type AsyncListener<TArgs extends unknown[]> = (...args: TArgs) => void | Promise<void>

/**
 * A typed EventEmitter that awaits all async listeners before resolving.
 * Wraps Node's `EventEmitter` with full TypeScript event-map inference.
 */
export class AsyncEventEmitter<TEvents extends { [K in keyof TEvents]: unknown[] }> {
  /**
   * `maxListener` controls the maximum number of listeners per event before Node emits a memory-leak warning.
   * @default 10
   */
  constructor(maxListener = 10) {
    this.#emitter.setMaxListeners(maxListener)
  }

  #emitter = new NodeEventEmitter()

  /**
   * Emits an event and awaits all registered listeners in parallel.
   * Throws if any listener rejects, wrapping the cause with the event name and serialized arguments.
   */
  async emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArgs: TEvents[TEventName]): Promise<void> {
    const listeners = this.#emitter.listeners(eventName) as Array<AsyncListener<TEvents[TEventName]>>

    if (listeners.length === 0) {
      return undefined
    }

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          return await listener(...eventArgs)
        } catch (err) {
          const cause = toError(err)
          const serializedArgs = (() => {
            try {
              return JSON.stringify(eventArgs)
            } catch {
              return String(eventArgs)
            }
          })()
          throw new Error(`Error in async listener for "${eventName}" with eventArgs ${serializedArgs}`, { cause })
        }
      }),
    )
  }

  /** Registers a persistent listener for the given event. */
  on<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: AsyncListener<TEvents[TEventName]>): void {
    this.#emitter.on(eventName, handler as AsyncListener<unknown[]>)
  }

  /** Registers a one-shot listener that removes itself after the first invocation. */
  onOnce<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: AsyncListener<TEvents[TEventName]>): void {
    const wrapper: AsyncListener<TEvents[TEventName]> = (...args) => {
      this.off(eventName, wrapper)
      return handler(...args)
    }
    this.on(eventName, wrapper)
  }

  /** Removes a previously registered listener. */
  off<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: AsyncListener<TEvents[TEventName]>): void {
    this.#emitter.off(eventName, handler as AsyncListener<unknown[]>)
  }

  /** Removes all listeners from every event channel. */
  removeAll(): void {
    this.#emitter.removeAllListeners()
  }
}
