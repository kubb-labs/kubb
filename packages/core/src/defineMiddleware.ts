import type { KubbHooks } from './Kubb.ts'

/**
 * A middleware instance produced by calling a factory created with `defineMiddleware`.
 * It declares event handlers under a `hooks` object which are registered on the
 * shared emitter after all plugin hooks, so middleware handlers for any event
 * always fire last.
 */
export type Middleware = {
  /**
   * Unique identifier for this middleware.
   */
  name: string
  /**
   * Lifecycle event handlers for this middleware.
   * Any event from the global `KubbHooks` map can be subscribed to here.
   * Handlers are registered after all plugin handlers, so they always fire last.
   */
  hooks: {
    [K in keyof KubbHooks]?: (...args: KubbHooks[K]) => void | Promise<void>
  }
}

/**
 * Creates a middleware factory using the hook-style `hooks` API.
 *
 * Middleware handlers fire after all plugin handlers for any given event, making them ideal for post-processing, logging, and auditing.
 * Per-build state (such as accumulators) belongs inside the factory closure so each `createKubb` invocation gets its own isolated instance.
 *
 * @note The factory can accept typed options. See examples for using options and per-build state patterns.
 *
 * @example
 * ```ts
 * import { defineMiddleware } from '@kubb/core'
 *
 * // Stateless middleware
 * export const logMiddleware = defineMiddleware(() => ({
 *   name: 'log-middleware',
 *   hooks: {
 *     'kubb:build:end'({ files }) {
 *       console.log(`Build complete with ${files.length} files`)
 *     },
 *   },
 * }))
 *
 * // Middleware with options and per-build state
 * export const prefixMiddleware = defineMiddleware((options: { prefix: string } = { prefix: '' }) => {
 *   const seen = new Set<string>()
 *   return {
 *     name: 'prefix-middleware',
 *     hooks: {
 *       'kubb:plugin:end'({ plugin }) {
 *         seen.add(`${options.prefix}${plugin.name}`)
 *       },
 *     },
 *   }
 * })
 * ```
 */
export function defineMiddleware<TOptions extends object = object>(factory: (options: TOptions) => Middleware): (options?: TOptions) => Middleware {
  return (options) => factory(options ?? ({} as TOptions))
}
