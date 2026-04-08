import type { FileNode } from '@kubb/ast/types'

/**
 * Minimal interface any Kubb renderer must satisfy.
 *
 * This allows core to drive rendering without a hard dependency on
 * `@kubb/renderer-jsx` or any specific renderer implementation.
 */
export type RendererInstance = {
  render(element: unknown): Promise<void>
  unmount(error?: Error | number | null): void
  readonly files: Array<FileNode>
}

/**
 * A factory function that produces a fresh {@link RendererInstance} per render.
 *
 * Generators use this to declare which renderer handles their output.
 */
export type RendererFactory = () => RendererInstance

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
export function createRenderer(factory: RendererFactory): RendererFactory {
  return factory
}
