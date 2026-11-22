import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Keys deduplication, so a block that several generators add to one file is written once.
   */
  name?: string
  /**
   * The text, written as is.
   */
  children?: KubbReactNode
}

/**
 * Text in the enclosing `File` that declares nothing, such as a statement like `faker.seed(1)`, JSON, or markdown. Barrels
 * leave it out. For a declaration, use `Code`, or `Const`, `Type` or `Function`.
 *
 * @example Statement
 * ```tsx
 * <Raw name="faker-seed">{'faker.seed(1)'}</Raw>
 * ```
 */
export function Raw({ children, name }: Props): KubbReactElement {
  return <kubb-source name={name}>{children}</kubb-source>
}
