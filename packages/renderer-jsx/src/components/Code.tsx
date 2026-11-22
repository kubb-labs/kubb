import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  name: string
  /** Lists the declaration in barrels. The text still needs its own `export`. */
  export?: boolean
  /** Marks an exported declaration as the default export, which barrels skip. */
  default?: boolean
  type?: boolean
  children?: KubbReactNode
}

/** A printed declaration in a `File`. For a declaration written in JSX, use `Const`, `Type` or `Function`. */
export function Code({ children, name, export: canExport, default: isDefault, type }: Props): KubbReactElement {
  return (
    <kubb-code name={name} export={!!canExport} default={isDefault} isTypeOnly={!!type}>
      {children}
    </kubb-code>
  )
}
