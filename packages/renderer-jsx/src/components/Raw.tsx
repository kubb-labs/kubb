import type { Key, KubbReactElement, KubbReactNode } from '../types.ts'

export type RawProps = {
  key?: Key
  /**
   * Dedupes the block when several generators add it to one file.
   */
  name?: string
  children?: KubbReactNode
}

/**
 * Text in a `File` that declares nothing, such as a statement, JSON or markdown. Barrels leave it out.
 */
export function Raw({ children, name }: RawProps): KubbReactElement {
  return <kubb-raw name={name}>{children}</kubb-raw>
}
