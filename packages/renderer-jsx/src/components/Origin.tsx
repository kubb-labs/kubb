import type { KubbReactElement, KubbReactNode } from '../types.ts'

type Props = {
  pointer?: string
  children?: KubbReactNode
}

/** Sets the input location, such as `#/components/schemas/Pet`, of every source inside it. An inner `Origin` wins. */
export function Origin({ pointer, children }: Props): KubbReactElement {
  return <kubb-origin pointer={pointer}>{children}</kubb-origin>
}
