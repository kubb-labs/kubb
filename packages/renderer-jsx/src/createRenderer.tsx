import type { FileNode } from '@kubb/ast'
import { Runtime } from './Runtime.tsx'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * Renderer factory for generators that produce JSX output.
 *
 * Pass as the `renderer` property of `defineGenerator`. Core drives rendering
 * without a hard dependency on `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
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
 * Lightweight renderer factory with no React fiber, scheduler, or work loop.
 *
 * Walks the JSX element tree in a single recursive pass. All components must be
 * pure functions; hooks and class components are not supported. Drop-in
 * replacement for {@link jsxRenderer} at approximately 2–4× the speed.
 *
 * @example Drop-in replacement
 * ```ts
 * import { jsxRendererSync } from '@kubb/renderer-jsx'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   renderer: jsxRendererSync,
 *   schema(node, options) {
 *     return <File baseName="output.ts" path="src/output.ts">...</File>
 *   },
 * })
 * ```
 *
 * @example Stream files as they are produced
 * ```ts
 * for await (const file of jsxRendererSync().stream(element)) {
 *   await writeFile(file)
 * }
 * ```
 */
export const jsxRendererSync = () => {
  const runtime = new SyncRuntime()
  return {
    async render(element: KubbReactElement): Promise<void> {
      runtime.render(element)
    },
    get files() {
      return runtime.nodes
    },
    // Returning a synchronous iterable lets the core renderer consumer skip
    // the per-file `for await` microtask.
    stream(element: KubbReactElement): Generator<FileNode> {
      return runtime.stream(element)
    },
    unmount(_error?: Error | number | null) {},
  }
}
