import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  name: string
  /** Lists the declaration in barrels. The text still needs its own `export`. */
  export?: boolean
  type?: boolean
  pointer?: string
  children?: KubbReactNode
}

/** A printed declaration in a `File`. For a declaration written in JSX, use `Const`, `Type` or `Function`. */
export function Code({ children, name, export: canExport, type, pointer }: Props): KubbReactElement {
  return (
    <kubb-source name={name} pointer={pointer} isExport={!!canExport} isTypeOnly={!!type}>
      {children}
    </kubb-source>
  )
}
