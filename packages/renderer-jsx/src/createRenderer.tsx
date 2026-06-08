import type { FileNode } from '@kubb/ast'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * Renderer that walks the JSX tree in a single recursive pass, with no React
 * reconciler or scheduler. Pass as the `renderer` property on
 * `defineGenerator`. Kubb core stays generic, with no hard dependency on
 * `@kubb/renderer-jsx`.
 *
 * Every component must be a pure function. Hooks, suspense, and class
 * components are not supported. It also exposes `stream()` for incremental
 * file emission.
 *
 * @example Wire up a JSX generator
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

/**
 * Renderer factory for JSX generators.
 *
 * @deprecated The async fiber runtime (react-reconciler) was removed. This is
 * now an alias of {@link jsxRendererSync}, which renders synchronously and does
 * not support hooks or suspense. Point your generators at `jsxRendererSync`.
 */
export const jsxRenderer = jsxRendererSync
