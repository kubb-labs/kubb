/**
 * Unique key for a Kubb JSX element in lists or conditional renders.
 */
export type Key = string | number | bigint

/**
 * Element produced by a Kubb JSX component. The renderer walks these at runtime,
 * so the fields stay opaque to type-checking.
 */
export type KubbReactElement = {
  type: unknown
  props: unknown
  key: Key | null
}

/**
 * Anything a Kubb JSX component accepts as children: an element, a primitive
 * rendered as text, a nullish value that is skipped, or an iterable of nodes.
 */
export type KubbReactNode = KubbReactElement | string | number | bigint | boolean | null | undefined | Iterable<KubbReactNode>


/**
 * JSDoc comment block to attach to a generated declaration.
 * Each string in `comments` becomes one line inside the `/** … *\/` block.
 *
 * @example
 * ```ts
 * { comments: ['@description A pet object.', '@deprecated Use PetV2 instead.'] }
 * // Emits:
 * // /**
 * //  * @description A pet object.
 * //  * @deprecated Use PetV2 instead.
 * //  *\/
 * ```
 */
export type JSDoc = {
  /**
   * Lines to emit inside the JSDoc block, in source order.
   * Use standard JSDoc tags such as `@description`, `@deprecated`, `@see`, etc.
   */
  comments: Array<string>
}
