import type { FileNode } from '@kubb/ast'
import { Runtime } from './Runtime.tsx'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * Renderer factory that turns the JSX produced by a generator into
 * `FileNode`s using React's reconciler under the hood. Pass as the `renderer`
 * property on `defineGenerator`. Kubb core stays generic, with no hard
 * dependency on `@kubb/renderer-jsx`.
 *
 * Use this when generators rely on React features (hooks, suspense, context).
 * For pure-function components, see {@link jsxRendererSync} for ~2-4× faster
 * rendering.
 *
 * @example Wire up a JSX generator
 * ```tsx
 * import { defineGenerator } from '@kubb/core'
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'types',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     return (
 *       <File baseName="output.ts" path={`${ctx.root}/output.ts`}>
 *         <Type node={node} resolver={ctx.resolver} />
 *       </File>
 *     )
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
    dispose() {
      runtime.unmount()
    },
    unmount(error?: Error | number | null) {
      runtime.unmount(error)
    },
    [Symbol.dispose]() {
      this.dispose()
    },
  }
}

/**
 * Lightweight renderer that walks the JSX tree in a single recursive pass —
 * no React reconciler, no scheduler. Drop-in replacement for
 * {@link jsxRenderer} at roughly 2–4× the throughput.
 *
 * Constraints: every component must be a pure function. Hooks, suspense, and
 * class components are not supported.
 *
 * Use this for generators that produce large amounts of output and do not need
 * React's runtime features. It also exposes `stream()` for incremental file
 * emission.
 *
 * @example Drop-in faster renderer
 * ```tsx
 * import { defineGenerator } from '@kubb/core'
 * import { jsxRendererSync } from '@kubb/renderer-jsx'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'types',
 *   renderer: jsxRendererSync,
 *   schema(node, ctx) {
 *     return (
 *       <File baseName="output.ts" path={`${ctx.root}/output.ts`}>
 *         <Type node={node} resolver={ctx.resolver} />
 *       </File>
 *     )
 *   },
 * })
 * ```
 *
 * @example Stream files as they are produced
 * ```tsx
 * const renderer = jsxRendererSync()
 * for (const file of renderer.stream(element)) {
 *   await writeFile(file.path, file.sources[0])
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
    stream(element: KubbReactElement): Generator<FileNode> {
      return runtime.stream(element)
    },
    dispose() {},
    unmount(_error?: Error | number | null) {},
    [Symbol.dispose]() {
      this.dispose()
    },
  }
}
