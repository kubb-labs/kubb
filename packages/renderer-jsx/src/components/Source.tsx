import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = Omit<ast.SourceNode, 'kind' | 'value' | 'nodes'> & {
  key?: Key
  /**
   * The code of this block: printed text, or JSX such as `Const`, `Type` or `Function`.
   */
  children?: KubbReactNode
}

/**
 * A block of code in the enclosing `File` that no declaration component covers: text from a printer, a statement such as
 * `faker.seed(1)`, or a file that is not TypeScript, such as JSON. For a declaration written in JSX, put `Const`, `Type` or
 * `Function` in `File` directly.
 *
 * `name` keys deduplication, `isExportable` and `isIndexable` let barrels re-export it, and `isTypeOnly` marks a type.
 *
 * @example Printed type with barrel flags
 * ```tsx
 * <File baseName="pet.ts" path="src/models/pet.ts">
 *   <Source name="Pet" isExportable isIndexable isTypeOnly>
 *     {printer.print(node)}
 *   </Source>
 * </File>
 * ```
 *
 * @example Statement
 * ```tsx
 * <Source name="seed">{'faker.seed(1)'}</Source>
 * ```
 */
export function Source({ children, ...props }: Props): KubbReactElement {
  return <kubb-source {...props}>{children}</kubb-source>
}
