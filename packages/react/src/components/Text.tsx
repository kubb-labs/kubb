import { useIndent } from '../hooks/useIndent.ts'

import type { KubbNode } from '../types.ts'

type Props = {
  /**
   * Change the indent.
   * @default 0
   */
  indentSize?: number
  children?: KubbNode
}

export function Text({ indentSize = 0, children }: Props): KubbNode {
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

export function Space({ size = 1 }: SpaceProps): KubbNode {
  const indentBefore = useIndent({ size })

  return <kubb-text>{indentBefore}</kubb-text>
}

Space.displayName = 'KubbSpace'

Text.Space = Space
