import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * The declared name, which importing files replace with `expression`.
   */
  name: string
  /**
   * The right-hand side of the declaration, written in place of `name` in files that import it.
   */
  expression: string
  /**
   * Marks the declaration as exported, which also lists it in barrels.
   */
  export?: boolean
  /**
   * Marks a type-only declaration.
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
 * A printed declaration that importing files absorb: Kubb writes `expression` where they use `name`, and skips a file whose
 * sources are all inline. Only a parser with `inline`, such as `parserTs`, absorbs it. For a declaration written in JSX, pass
 * `inline` to `Const`, `Type` or `Function` instead.
 *
 * @example Inline type alias
 * ```tsx
 * <Inline name="AddPetStatus200" expression="Pet" export type>
 *   {`export type AddPetStatus200 = Pet`}
 * </Inline>
 * ```
 */
export function Inline({ children, name, expression, export: canExport, type, pointer }: Props): KubbReactElement {
  return (
    <kubb-source name={name} pointer={pointer} isExportable={!!canExport} isIndexable={!!canExport} isTypeOnly={!!type} inline={{ expression }}>
      {children}
    </kubb-source>
  )
}
