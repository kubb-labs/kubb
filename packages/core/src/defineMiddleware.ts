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
 * Creates a middleware factory using the hook-style (`hooks:`) API.
 *
 * Mirrors `definePlugin`: the factory is called with optional options and returns a
 * fresh `Middleware` instance. Placing per-build state (e.g. accumulators) inside the
 * factory closure ensures each `createKubb` invocation gets its own isolated instance.
 *
 * @example
 * ```ts
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
 * export const myMiddleware = defineMiddleware((options: { prefix: string } = { prefix: '' }) => {
 *   const seen = new Set<string>()
 *   return {
 *     name: 'my-middleware',
 *     hooks: {
 *       'kubb:plugin:end'({ plugin }) {
 *         seen.add(`${options.prefix}${plugin.name}`)
 *       },
 *     },
 *   }
 * })
 *
 * // Usage in kubb.config.ts:
 * export default defineConfig({
 *   middleware: [logMiddleware(), myMiddleware({ prefix: 'pfx:' })],
 * })
 * ```
 */
export function defineMiddleware<TOptions extends object = object>(factory: (options: TOptions) => Middleware): (options?: TOptions) => Middleware {
  return (options) => factory(options ?? ({} as TOptions))
}
