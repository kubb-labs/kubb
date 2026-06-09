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
   * Lifecycle event handlers. Subscribe to any event from the global `KubbHooks`
   * map. Handlers run after all plugin handlers for that event.
   *
   * The driver finishes every `kubb:generate:schema` event for a plugin before
   * it fires that plugin's first `kubb:generate:operation` or
   * `kubb:generate:operations` event, so an operation handler can count on the
   * plugin's schemas being done.
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
