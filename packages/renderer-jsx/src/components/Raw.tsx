import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  key?: Key
  /** Dedupes the block when several generators add it to one file. */
  name?: string
  children?: KubbReactNode
}

/** Text in a `File` that declares nothing, such as a statement, JSON or markdown. Barrels leave it out. */
export function Raw({ children, name }: Props): KubbReactElement {
  return <kubb-source name={name}>{children}</kubb-source>
}
