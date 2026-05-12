import { Runtime } from './Runtime.tsx'
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
