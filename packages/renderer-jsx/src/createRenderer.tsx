import type { FileNode } from '@kubb/ast'
import { SyncRuntime } from './SyncRuntime.tsx'
import type { KubbReactElement } from './types.ts'

/**
 * Factory for a renderer that walks the JSX tree in a single recursive pass,
 * with no React reconciler or scheduler. Pass it as the `renderer` property on
 * `defineGenerator`. Kubb core calls the factory once per render cycle and stays
 * generic, with no hard dependency on `@kubb/renderer-jsx`.
 *
 * Every component must be a pure function. Hooks, suspense, and class
 * components are not supported. The returned renderer also exposes `stream()`
 * for incremental file emission.
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
 *
 * @example Stream files as they are produced
 * ```tsx
 * const renderer = jsxRenderer()
 * for (const file of renderer.stream(element)) {
 *   await writeFile(file.path, file.sources[0])
 * }
 * ```
 */
export const jsxRenderer = () => {
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
    [Symbol.dispose]() {},
  }
}
