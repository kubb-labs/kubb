import type { KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  /** Where the code comes from in the input, in the form the adapter reads, such as `#/components/schemas/Pet`. */
  pointer?: string
  children?: KubbReactNode
}

/**
 * Records where every source inside it comes from in the input. Use it when one generator writes code
 * for several parts of the input. An inner `Origin` wins, and without one a source gets the pointer of
 * the node being generated.
 */
export function Origin({ pointer, children }: Props): KubbReactElement {
  return <kubb-origin pointer={pointer}>{children}</kubb-origin>
}
