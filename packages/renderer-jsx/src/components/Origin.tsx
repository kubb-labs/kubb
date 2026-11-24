import type { KubbReactElement, KubbReactNode } from '../types.ts'

export type OriginProps = {
  /**
   * The input location, in the form the adapter reads, such as `#/components/schemas/Pet`.
   */
  pointer?: string
  children?: KubbReactNode
}

/**
 * Sets the input location of every source inside it. An inner `Origin` wins.
 */
export function Origin({ pointer, children }: OriginProps): KubbReactElement {
  return <kubb-origin pointer={pointer}>{children}</kubb-origin>
}
