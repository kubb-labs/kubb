import { EventEmitter as NodeEventEmitter } from 'node:events'
import { toError } from '../../../internals/utils/src/errors.ts'

/**
 * A function that can be registered as a hook listener, synchronous or async.
 */
type AsyncListener<TArgs extends Array<unknown>> = (...args: TArgs) => void | Promise<void>

/**
 * Typed hook emitter that awaits all async listeners before resolving.
 * Wraps Node's `EventEmitter` with full TypeScript hook-map inference.
 *
 * @example
 * ```ts
 * const hooks = new Hookable<{ build: [name: string] }>()
 * hooks.on('build', async (name) => { console.log(name) })
 * await hooks.emit('build', 'petstore') // all listeners awaited
 * ```
 */
export class Hookable<THooks extends { [K in keyof THooks]: Array<unknown> }> {
  /**
   * Maximum number of listeners per hook before Node emits a memory-leak warning.
   * @default 10
   */
  constructor(maxListener = 10) {
    this.#emitter.setMaxListeners(maxListener)
  }

  #emitter = new NodeEventEmitter()

  /**
   * Emits `hookName` and awaits all registered listeners sequentially.
   * Throws if any listener rejects, wrapping the cause with the hook name and serialized arguments.
   *
   * @example
   * ```ts
   * await hooks.emit('build', 'petstore')
   * ```
   */
  emit<THookName extends keyof THooks & string>(hookName: THookName, ...hookArgs: THooks[THookName]): Promise<void> | void {
    const listeners = this.#emitter.listeners(hookName) as Array<AsyncListener<THooks[THookName]>>

    if (listeners.length === 0) {
      return
    }

    return this.#emitAll(hookName, listeners, hookArgs)
  }

  async #emitAll<THookName extends keyof THooks & string>(
    hookName: THookName,
    listeners: Array<AsyncListener<THooks[THookName]>>,
    hookArgs: THooks[THookName],
  ): Promise<void> {
    for (const listener of listeners) {
      try {
        await listener(...hookArgs)
      } catch (err) {
        let serializedArgs: string
        try {
          serializedArgs = JSON.stringify(hookArgs)
        } catch {
          serializedArgs = String(hookArgs)
        }
        throw new Error(`Error in async listener for "${hookName}" with hookArgs ${serializedArgs}`, { cause: toError(err) })
      }
    }
  }

  /**
   * Registers a persistent listener for `hookName`.
   *
   * @example
   * ```ts
   * hooks.on('build', async (name) => { console.log(name) })
   * ```
   */
  on<THookName extends keyof THooks & string>(hookName: THookName, handler: AsyncListener<THooks[THookName]>): void {
    this.#emitter.on(hookName, handler as AsyncListener<Array<unknown>>)
  }

  /**
   * Removes a previously registered listener.
   *
   * @example
   * ```ts
   * hooks.off('build', handler)
   * ```
   */
  off<THookName extends keyof THooks & string>(hookName: THookName, handler: AsyncListener<THooks[THookName]>): void {
    this.#emitter.off(hookName, handler as AsyncListener<Array<unknown>>)
  }

  /**
   * Returns the number of listeners registered for `hookName`.
   *
   * @example
   * ```ts
   * hooks.on('build', handler)
   * hooks.listenerCount('build') // 1
   * ```
   */
  listenerCount<THookName extends keyof THooks & string>(hookName: THookName): number {
    return this.#emitter.listenerCount(hookName)
  }

  /**
   * Raises or lowers the per-hook listener ceiling before Node warns about a memory leak.
   * Set this above the expected listener count when many listeners attach by design.
   *
   * @example
   * ```ts
   * hooks.setMaxListeners(40)
   * ```
   */
  setMaxListeners(max: number): void {
    this.#emitter.setMaxListeners(max)
  }

  /**
   * Removes all listeners from every hook channel.
   *
   * @example
   * ```ts
   * hooks.removeAll()
   * ```
   */
  removeAll(): void {
    this.#emitter.removeAllListeners()
  }
}
