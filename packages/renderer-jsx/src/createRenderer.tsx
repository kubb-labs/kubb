import { Runtime } from './Runtime.tsx'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * A renderer factory for generators that produce JSX output.
 *
 * Pass this as the `renderer` property of a `defineGenerator` call so that
 * core can render the JSX element tree returned by your generator methods
 * without a hard dependency on `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 * import { defineGenerator } from '@kubb/core'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'my-generator',
 *   renderer: jsxRenderer,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 */
export const jsxRenderer = () => {
  const runtime = new Runtime()
  return {
    async render(element: KubbReactElement) {
      await runtime.render(element)
    },
    get files() {
      return runtime.nodes
    },
    unmount(error?: Error | number | null) {
      runtime.unmount(error)
    },
  }
}

/**
 * A synchronous renderer factory for generators that produce JSX output.
 *
 * Walks the JSX element tree recursively in a single pass without React's
 * fiber scheduler. All Kubb plugin components must be pure functions (no hooks,
 * no class components). Produces byte-for-byte identical output to `jsxRenderer`
 * while being approximately 2× faster.
 *
 * @example
 * ```ts
 * import { jsxRendererSync } from '@kubb/renderer-jsx'
 * import { defineGenerator } from '@kubb/core'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'my-generator',
 *   renderer: jsxRendererSync,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 */
export const jsxRendererSync = () => {
  const runtime = new SyncRuntime()
  return {
    render(element: KubbReactElement): Promise<void> {
      try {
        runtime.render(element)
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    },
    get files() {
      return runtime.nodes
    },
    unmount(_error?: Error | number | null) {},
  }
}
