import type { KubbHooks } from './types.ts'

/**
 * A middleware instance. Subscribes to lifecycle events via `hooks`. Middleware
 * handlers always fire after every plugin handler for the same event, so they
 * see the full set of generated files.
 */
export type Middleware = {
  /**
   * Unique name. Use a `middleware-<feature>` convention (e.g.
   * `middleware-barrel`).
   */
  name: string
  /**
   * Lifecycle event handlers. Any event from the global `KubbHooks` map can be
   * subscribed to here. Handlers run after all plugin handlers for that event.
   */
  hooks: {
    [K in keyof KubbHooks]?: (...args: KubbHooks[K]) => void | Promise<void>
  }
}

/**
 * Creates a middleware factory. Middleware fires after every plugin handler
 * for the same event, which makes it the natural place for post-processing
 * (barrel files, lint runs, audit logs).
 *
 * Per-build state belongs inside the factory closure so each `createKubb`
 * invocation gets its own isolated instance.
 *
 * @example Stateless middleware
 * ```ts
 * import { defineMiddleware } from '@kubb/core'
 *
 * export const logMiddleware = defineMiddleware(() => ({
 *   name: 'log-middleware',
 *   hooks: {
 *     'kubb:build:end'({ files }) {
 *       console.log(`Build complete with ${files.length} files`)
 *     },
 *   },
 * }))
 * ```
 *
 * @example Middleware with options and per-build state
 * ```ts
 * import { defineMiddleware } from '@kubb/core'
 *
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
