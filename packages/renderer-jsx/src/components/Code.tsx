import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * The declared name. Barrels re-export it and Kubb dedupes sources by it.
   */
  name: string
  /**
   * Marks the declaration as exported, which also lists it in barrels. The text still needs its own `export`.
   */
  export?: boolean
  /**
   * Lists the declaration in barrels, or leaves it out. Defaults to `export`.
   */
  index?: boolean
  /**
   * Marks a type-only declaration, which barrels re-export with `export type`.
   */
  type?: boolean
  /**
   * The input location, such as `#/components/schemas/Pet`.
   */
  pointer?: string
  /**
   * The printed declaration.
   */
  children?: KubbReactNode
}

/**
 * A printed declaration in the enclosing `File`, such as a type from a printer or a class built as text. For a declaration
 * written in JSX, put `Const`, `Type` or `Function` in `File` directly.
 *
 * @example Printed type
 * ```tsx
 * <Code name="Pet" export type pointer={node.pointer}>
 *   {printer.print(node)}
 * </Code>
 * ```
 */
export function Code({ children, name, export: canExport, index, type, pointer }: Props): KubbReactElement {
  return (
    <kubb-source name={name} pointer={pointer} isExportable={!!canExport} isIndexable={index ?? !!canExport} isTypeOnly={!!type}>
      {children}
    </kubb-source>
  )
}
