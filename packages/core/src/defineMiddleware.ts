import type { AsyncEventEmitter } from '@internals/utils'
import type { KubbHooks } from './Kubb.ts'

/**
 * A middleware observes and post-processes the build output produced by plugins.
 * It attaches listeners to the shared `hooks` emitter before the plugin execution loop
 * begins and reacts to lifecycle events (e.g. `kubb:plugin:end`, `kubb:build:end`) to
 * inject barrel files or perform other cross-cutting concerns.
 *
 * Middleware listeners are always registered **after** all plugin listeners, because
 * `createKubb` installs middleware only after the `PluginDriver` has registered every
 * plugin's hooks.  This means middleware hooks for any event always fire last.
 *
 * @example
 * ```ts
 * import { defineMiddleware } from '@kubb/core'
 *
 * export const myMiddleware = defineMiddleware({
 *   name: 'my-middleware',
 *   install(hooks) {
 *     hooks.on('kubb:build:end', ({ files }) => {
 *       console.log(`Build complete with ${files.length} files`)
 *     })
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
   * Called during `createKubb` after `setup()` but before the plugin
   * execution loop starts. Attach listeners to `hooks` here.
   */
  install(hooks: AsyncEventEmitter<KubbHooks>): void
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
 *   install(hooks) {
 *     hooks.on('kubb:build:end', ({ files }) => {
 *       console.log(`Build complete with ${files.length} files`)
 *     })
 *   },
 * })
 * ```
 */
export function defineMiddleware(middleware: Middleware): Middleware {
  return middleware
}
