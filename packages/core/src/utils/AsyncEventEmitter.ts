import { EventEmitter as NodeEventEmitter } from 'node:events'
import { DEFAULT_MAX_LISTENERS } from '../constants.ts'

export class AsyncEventEmitter<TEvents extends { [K in keyof TEvents]: unknown[] }> {
  constructor(maxListener = DEFAULT_MAX_LISTENERS) {
    this.#emitter.setMaxListeners(maxListener)
  }
  #emitter = new NodeEventEmitter()

  async emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArgs: TEvents[TEventName]): Promise<void> {
    const listeners = this.#emitter.listeners(eventName) as Array<(...args: TEvents[TEventName]) => void | Promise<void>>

    if (listeners.length === 0) {
      return undefined
    }

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          return await listener(...eventArgs)
        } catch (err) {
          const causedError = err as Error
          const serializedArgs = (() => {
            try {
              return JSON.stringify(eventArgs)
            } catch {
              return String(eventArgs)
            }
          })()
          const error = new Error(`Error in async listener for "${eventName}" with eventArgs ${serializedArgs}`, { cause: causedError })

          throw error
        }
      }),
    )
  }

  on<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.on(eventName, handler as (...args: unknown[]) => void)
  }

  onOnce<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArgs: TEvents[TEventName]) => void): void {
    const wrapper = (...args: TEvents[TEventName]) => {
      this.off(eventName, wrapper)
      handler(...args)
    }
    this.on(eventName, wrapper)
  }

  off<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.off(eventName, handler as (...args: unknown[]) => void)
  }
  removeAll(): void {
    this.#emitter.removeAllListeners()
  }
}
