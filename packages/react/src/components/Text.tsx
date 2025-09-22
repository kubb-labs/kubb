import type { Key, KubbNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Change the indent.
   * @default 0
   * @deprecated
   */
  indentSize?: number
  children?: KubbNode
}

/**
 * @deprecated
 */
export function Text({ children }: Props) {
  return <kubb-text>{children}</kubb-text>
}

type SpaceProps = {}

Text.displayName = 'KubbText'

export function Space({}: SpaceProps) {
  return <kubb-text> </kubb-text>
}

Space.displayName = 'KubbSpace'

Text.Space = Space
