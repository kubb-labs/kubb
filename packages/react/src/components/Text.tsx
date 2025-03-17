import { useIndent } from '../hooks/useIndent.ts'

import type { Key, KubbNode } from '../types.ts'

type Props = {
  key?: Key
  /**
   * Change the indent.
   * @default 0
   */
  indentSize?: number
  children?: KubbNode
}

export function Text({ indentSize = 0, children }: Props) {
  const indentBefore = useIndent({ size: indentSize })
  const indentChildren = useIndent({ size: 2, children })

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}

type SpaceProps = {
  /**
   * Change the indent
   * @default 1
   */
  size?: number
}

Text.displayName = 'KubbText'

export function Space({ size = 1 }: SpaceProps) {
  const indentBefore = useIndent({ size })

  return <kubb-text>{indentBefore}</kubb-text>
}

Space.displayName = 'KubbSpace'

Text.Space = Space
