import type { FileNode } from '@kubb/ast'
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
 * Slim renderer factory for generators that produce JSX output.
 *
 * Walks the JSX element tree in a single recursive pass — no React fiber, no
 * scheduler, no work loop. All components must be pure functions; hooks and
 * class components are not supported. Drop-in replacement for {@link jsxRenderer}
 * that produces identical output at approximately 2–4× the speed.
 *
 * Also exposes a `stream()` method for processing files one at a time as they
 * are yielded, which allows downstream I/O to overlap with rendering.
 *
 * @example Drop-in replacement
 * ```ts
 * import { jsxRendererSlim } from '@kubb/renderer-jsx'
 * import { defineGenerator } from '@kubb/core'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'my-generator',
 *   renderer: jsxRendererSlim,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 *
 * @example Streaming files one at a time
 * ```ts
 * const renderer = jsxRendererSlim()
 * for await (const file of renderer.stream(element)) {
 *   await writeFile(file)
 * }
 * ```
 */
export const jsxRendererSlim = () => {
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
    /**
     * Yields each {@link FileNode} as it is encountered during the tree walk,
     * without collecting all files into an array first. Useful when a single
     * render produces many files and downstream work (parsing, writing) should
     * start before the full element tree is traversed.
     *
     * @example Overlap rendering with file writing
     * ```ts
     * for await (const file of renderer.stream(element)) {
     *   await writeFile(file)
     * }
     * ```
     */
    async *stream(element: KubbReactElement): AsyncGenerator<FileNode> {
      yield* runtime.stream(element)
    },
    unmount(_error?: Error | number | null) {},
  }
}
