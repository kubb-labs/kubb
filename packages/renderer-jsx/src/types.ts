import type { ast } from '@kubb/ast'

/**
 * Unique key for a Kubb JSX element in lists or conditional renders.
 */
export type Key = string | number | bigint

/**
 * Element produced by a Kubb JSX component. The renderer walks these at runtime,
 * so the fields stay opaque to type-checking.
 */
export type KubbReactElement = {
  /**
   * Brand set by the JSX runtime, so the renderer only walks elements it created.
   */
  $$typeof: symbol
  type: unknown
  props: unknown
  key: Key | null
}

/**
 * Anything a Kubb JSX component accepts as children: an element, a primitive
 * rendered as text, a nullish value that is skipped, or an array of nodes.
 */
export type KubbReactNode = KubbReactElement | string | number | bigint | boolean | null | undefined | ReadonlyArray<KubbReactNode>

/**
 * The renderer `jsxRenderer` returns: it collects the `File` elements of a render into `files`.
 */
export type JsxRenderer = {
  render(element: KubbReactElement): Promise<void>
  readonly files: Array<ast.FileNode>
  [Symbol.dispose](): void
}

/**
 * @deprecated Use `JSDocNode` from `@kubb/ast` instead.
 */
export type JSDoc = ast.JSDocNode
