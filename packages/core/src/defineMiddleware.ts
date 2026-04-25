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
 * A middleware factory: a zero-argument function that returns a fresh `Middleware`
 * instance each time it is called. Use this form when the middleware needs
 * per-build state (e.g. a `Set` accumulator) so that each `createKubb` invocation
 * gets its own isolated closure.
 */
export type MiddlewareFactory = () => Middleware

/**
 * Define middleware using either a plain object or a factory function.
 *
 * **Object form** – use when the middleware is stateless:
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
 *
 * **Factory form** – use when the middleware needs per-build state so that each
 * `createKubb` invocation receives a fresh, isolated instance:
 * ```ts
 * export const myMiddleware = defineMiddleware(() => {
 *   const seen = new Set<string>()
 *   return {
 *     name: 'my-middleware',
 *     hooks: {
 *       'kubb:plugin:end'({ plugin }) {
 *         seen.add(plugin.name)
 *       },
 *     },
 *   }
 * })
 * ```
 */
export function defineMiddleware(factory: MiddlewareFactory): MiddlewareFactory
export function defineMiddleware(middleware: Middleware): Middleware
export function defineMiddleware(input: Middleware | MiddlewareFactory): Middleware | MiddlewareFactory {
  return input
}
