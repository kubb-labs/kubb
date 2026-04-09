import type { FileNode } from '@kubb/ast/types'

/**
 * Minimal interface any Kubb renderer must satisfy.
 *
 * The generic `TElement` is the type of the element the renderer accepts —
 * e.g. `KubbReactElement` for `@kubb/renderer-jsx`, or a custom type for
 * your own renderer.  Defaults to `unknown` so that generators which do not
 * care about the element type continue to work without specifying it.
 *
 * This allows core to drive rendering without a hard dependency on
 * `@kubb/renderer-jsx` or any specific renderer implementation.
 */
export type Renderer<TElement = unknown> = {
  render(element: TElement): Promise<void>
  unmount(error?: Error | number | null): void
  readonly files: Array<FileNode>
}

/**
 * A factory function that produces a fresh {@link Renderer} per render.
 *
 * Generators use this to declare which renderer handles their output.
 */
export type RendererFactory<TElement = unknown> = () => Renderer<TElement>

/**
 * Creates a renderer factory for use in generator definitions.
 *
 * Wrap your renderer factory function with this helper to register it as the
 * renderer for a generator. Core will call this factory once per render cycle
 * to obtain a fresh renderer instance.
 *
 * @example
 * ```ts
 * // packages/renderer-jsx/src/index.ts
 * export const jsxRenderer = createRenderer(() => {
 *   const runtime = new Runtime()
 *   return {
 *     async render(element) { await runtime.render(element) },
 *     get files() { return runtime.nodes },
 *     unmount(error) { runtime.unmount(error) },
 *   }
 * })
 *
 * // packages/plugin-zod/src/generators/zodGenerator.tsx
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 * export const zodGenerator = defineGenerator<PluginZod>({
 *   name: 'zod',
 *   renderer: jsxRenderer,
 *   schema(node, options) { return <File ...>...</File> },
 * })
 * ```
 */
export function createRenderer<TElement = unknown>(factory: RendererFactory<TElement>): RendererFactory<TElement> {
  return factory
}
