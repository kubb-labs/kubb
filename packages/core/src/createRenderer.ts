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
   * Called once per render cycle. Must resolve before {@link files} is read.
   */
  render(element: TElement): Promise<void>
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
  /**
   * Disposer hook so renderers participate in `using` blocks: `using r = rendererFactory()`
   * runs cleanup on every exit path, including thrown errors.
   */
  [Symbol.dispose](): void
}

/**
 * A factory function that produces a fresh {@link Renderer} per render cycle.
 *
 * Generators use this to declare which renderer handles their output.
 */
export type RendererFactory<TElement = unknown> = () => Renderer<TElement>

/**
 * Defines a renderer factory. Renderers turn the generator's return value
 * (JSX, a template string, a tree of any shape) into `FileNode`s that get
 * written to disk.
 *
 * Use this to support output formats beyond JSX, for instance, a Handlebars
 * renderer, a string-template renderer, or a renderer that writes binary
 * files. Plugins and generators pick the renderer to use via the `renderer`
 * field on `defineGenerator`.
 *
 * @example A minimal renderer that wraps a custom runtime
 * ```ts
 * import { createRenderer } from '@kubb/core'
 *
 * export const myRenderer = createRenderer(() => {
 *   const runtime = new MyRuntime()
 *   return {
 *     async render(element) {
 *       await runtime.render(element)
 *     },
 *     get files() {
 *       return runtime.files
 *     },
 *     [Symbol.dispose]() {
 *       runtime.dispose()
 *     },
 *   }
 * })
 * ```
 */
export function createRenderer<TElement = unknown>(factory: RendererFactory<TElement>): RendererFactory<TElement> {
  return factory
}
