import type { FileNode } from '@kubb/ast'

/**
 * Minimal interface any Kubb renderer must satisfy.
 *
 * `TElement` is the type the renderer accepts, for example `KubbReactElement`
 * for `@kubb/renderer-jsx` or a custom type for your own renderer. Defaults to
 * `unknown` so generators that don't care about the element type work without
 * specifying it.
 */
export type Renderer<TElement = unknown> = {
  render(element: TElement): Promise<void>
  unmount(error?: Error | number | null): void
  readonly files: Array<FileNode>
  /**
   * When present, core uses this instead of `render` + `files`, forwarding
   * each file to `FileManager` as soon as it is ready. When this method is
   * implemented, `files` will not be populated after rendering.
   */
  stream?(element: TElement): AsyncIterable<FileNode>
}

/**
 * A factory function that produces a fresh {@link Renderer} per render cycle.
 *
 * Generators use this to declare which renderer handles their output.
 */
export type RendererFactory<TElement = unknown> = () => Renderer<TElement>

/**
 * Wraps a renderer factory for use in generator definitions.
 *
 * @example
 * ```ts
 * export const jsxRenderer = createRenderer(() => {
 *   const runtime = new Runtime()
 *   return {
 *     async render(element) { await runtime.render(element) },
 *     get files() { return runtime.nodes },
 *     unmount(error) { runtime.unmount(error) },
 *   }
 * })
 * ```
 */
export function createRenderer<TElement = unknown>(factory: RendererFactory<TElement>): RendererFactory<TElement> {
  return factory
}
