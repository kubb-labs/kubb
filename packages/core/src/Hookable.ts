import { toError } from '@internals/utils'

/**
 * A function that can be registered as a hook listener, synchronous or async. Any return value is
 * allowed and ignored, so handlers that return a result for their own callers still register.
 */
type AsyncListener<TArgs extends Array<unknown>> = (...args: TArgs) => unknown

/**
 * Typed hook emitter that awaits all async listeners before resolving.
 *
 * @example
 * ```ts
 * const hooks = new Hookable<{ build: [name: string] }>()
 * hooks.hook('build', async (name) => { console.log(name) })
 * await hooks.callHook('build', 'petstore') // all listeners awaited
 * ```
 */
export class Hookable<THooks extends { [K in keyof THooks]: Array<unknown> }> {
  readonly #listeners = new Map<string, Set<AsyncListener<Array<unknown>>>>()

  /**
   * Calls `hookName` and awaits all registered listeners sequentially.
   * Throws if any listener rejects, wrapping the cause in an error that names the hook.
   *
   * @example
   * ```ts
   * await hooks.callHook('build', 'petstore')
   * ```
   */
  callHook<THookName extends keyof THooks & string>(hookName: THookName, ...hookArgs: THooks[THookName]): Promise<void> | void {
    const listeners = this.#listeners.get(hookName)
    if (!listeners?.size) return

    return this.#emitAll(hookName, [...listeners], hookArgs)
  }

  async #emitAll(hookName: string, listeners: Array<AsyncListener<Array<unknown>>>, hookArgs: Array<unknown>): Promise<void> {
    for (const listener of listeners) {
      try {
        await listener(...hookArgs)
      } catch (err) {
        // Only the hook name goes in the message: the args can be a whole `Config` or AST subtree.
        throw new Error(`Error in async listener for "${hookName}"`, { cause: toError(err) })
      }
    }
  }

  /**
   * Registers a persistent listener for `hookName` and returns a function that removes it.
   *
   * @example
   * ```ts
   * const unhook = hooks.hook('build', async (name) => { console.log(name) })
   * unhook() // removes it
   * ```
   */
  hook<THookName extends keyof THooks & string>(hookName: THookName, handler: AsyncListener<THooks[THookName]>): () => void {
    let listeners = this.#listeners.get(hookName)
    if (!listeners) this.#listeners.set(hookName, (listeners = new Set()))
    listeners.add(handler as AsyncListener<Array<unknown>>)
    return () => this.removeHook(hookName, handler)
  }

  /**
   * Registers every handler in `configHooks` at once and returns a function that removes them
   * all. Undefined entries are skipped, so a partial hook object registers only its present keys.
   *
   * @example
   * ```ts
   * const unhook = hooks.addHooks({ build: onBuild, done: onDone })
   * unhook() // removes both
   * ```
   */
  addHooks(configHooks: Partial<{ [K in keyof THooks & string]: AsyncListener<THooks[K]> }>): () => void {
    const unhooks = (Object.keys(configHooks) as Array<keyof THooks & string>)
      .filter((name) => configHooks[name])
      .map((name) => this.hook(name, configHooks[name]!))

    return () => {
      for (const unhook of unhooks) unhook()
    }
  }

  /**
   * Removes a previously registered listener.
   *
   * @example
   * ```ts
   * hooks.removeHook('build', handler)
   * ```
   */
  removeHook<THookName extends keyof THooks & string>(hookName: THookName, handler: AsyncListener<THooks[THookName]>): void {
    this.#listeners.get(hookName)?.delete(handler as AsyncListener<Array<unknown>>)
  }

  /**
   * Returns the number of listeners registered for `hookName`.
   *
   * @example
   * ```ts
   * hooks.hook('build', handler)
   * hooks.listenerCount('build') // 1
   * ```
   */
  listenerCount<THookName extends keyof THooks & string>(hookName: THookName): number {
    return this.#listeners.get(hookName)?.size ?? 0
  }

  /**
   * Removes all listeners from every hook channel.
   *
   * @example
   * ```ts
   * hooks.removeAllHooks()
   * ```
   */
  removeAllHooks(): void {
    this.#listeners.clear()
  }
}
