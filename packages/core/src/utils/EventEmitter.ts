import { EventEmitter as NodeEventEmitter } from 'node:events'

export class EventEmitter<TEvents extends Record<string, any>> {
  constructor() {
    this.#emitter.setMaxListeners(100)
  }
  #emitter = new NodeEventEmitter()

  emit<TEventName extends keyof TEvents & string>(eventName: TEventName, ...eventArg: TEvents[TEventName]): void {
    this.#emitter.emit(eventName, ...(eventArg as []))
  }

  on<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.on(eventName, handler as any)
  }

  off<TEventName extends keyof TEvents & string>(eventName: TEventName, handler: (...eventArg: TEvents[TEventName]) => void): void {
    this.#emitter.off(eventName, handler as any)
  }
  removeAll(): void {
    this.#emitter.removeAllListeners()
  }
}
