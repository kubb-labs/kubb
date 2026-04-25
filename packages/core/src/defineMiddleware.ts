import type { KubbHooks } from './Kubb.ts'

/**
 * A middleware observes and post-processes the build output produced by plugins.
 * It declares event handlers under a `hooks` object which are registered on the
 * shared emitter after all plugin hooks, so middleware handlers for any event
 * always fire last.
 *
 * @example
 * ```ts
 * import { defineMiddleware } from '@kubb/core'
 *
 * export const myMiddleware = defineMiddleware({
 *   name: 'my-middleware',
 *   hooks: {
 *     'kubb:build:end'({ files }) {
 *       console.log(`Build complete with ${files.length} files`)
 *     },
 *   },
 * })
 * ```
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
 * Identity factory for middleware.
 * Returns the middleware object unchanged but provides a typed entry-point
 * to define middleware with proper inference.
 *
 * @example
 * ```ts
 * export const myMiddleware = defineMiddleware({
 *   name: 'my-middleware',
 *   hooks: {
 *     'kubb:build:end'({ files }) {
 *       console.log(`Build complete with ${files.length} files`)
 *     },
 *   },
 * })
 * ```
 */
export function defineMiddleware(middleware: Middleware): Middleware {
  return middleware
}
