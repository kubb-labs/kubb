import type { ast } from '@kubb/ast'
import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  name: string
  /**
   * Lists the declaration in barrels. The text still needs its own `export` keyword.
   */
  export?: boolean
  /**
   * Marks an exported declaration as the default export, which barrels skip.
   */
  default?: boolean
  /**
   * Whether the declaration is a type or a value. Imports and barrels of this name print `type` for a type.
   *
   * @default 'value'
   */
  space?: ast.Space
  children?: KubbReactNode
}

/**
 * A printed declaration in a `File`, in any language. For a declaration written in JSX, or a TypeScript type, use `Const`, `Type` or `Function`.
 */
export function Code({ children, name, export: canExport, default: isDefault, space }: Props): KubbReactElement {
  return (
    <kubb-code name={name} export={!!canExport} default={isDefault} space={space}>
      {children}
    </kubb-code>
  )
}
