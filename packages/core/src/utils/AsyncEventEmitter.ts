import { EventEmitter as NodeEventEmitter } from 'node:events'

export class AsyncEventEmitter<TEvents extends Record<string, any>> {
  constructor(maxListener = 100) {
    this.#emitter.setMaxListeners(maxListener)
  }
  #emitter = new NodeEventEmitter()

  async emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArgs: TEvents[TEventName]): Promise<void> {
    const listeners = this.#emitter.listeners(eventName) as Array<(...args: TEvents[TEventName]) => any>

    if (listeners.length === 0) {
      return undefined
    }

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          return await listener(...eventArgs)
        } catch (err) {
          const causedError = err as Error
          const error = new Error(`Error in async listener for "${eventName}" with eventArgs "${eventArgs}"`, { cause: causedError })

          throw error
        }
      }),
    )
  }

  on<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.on(eventName, handler as any)
  }

  onOnce<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArgs: TEvents[TEventName]) => void): void {
    const wrapper = (...args: TEvents[TEventName]) => {
      this.off(eventName, wrapper)
      handler(...args)
    }
    this.on(eventName, wrapper)
  }

  off<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.off(eventName, handler as any)
  }
  removeAll(): void {
    this.#emitter.removeAllListeners()
  }
}
