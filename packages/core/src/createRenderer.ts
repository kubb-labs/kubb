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
  /**
   * Renders `element` and populates {@link files} with the resulting {@link FileNode} objects.
   * Called once per render cycle; must resolve before {@link files} is read.
   */
  render(element: TElement): Promise<void>
  /**
   * Tears down the renderer and releases any held resources.
   * Pass an `Error` to signal a failure, a number for an exit code, or omit for a clean shutdown.
   */
  unmount(error?: Error | number | null): void
  /**
   * Accumulated {@link FileNode} results produced by the last {@link render} call.
   * Not populated when {@link stream} is implemented.
   */
  readonly files: Array<FileNode>
  /**
   * When present, core calls this instead of {@link render} and {@link files},
   * forwarding each file to `FileManager` as soon as it is ready.
   */
  stream?(element: TElement): Iterable<FileNode>
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
