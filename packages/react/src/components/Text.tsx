import { useIndent } from '../hooks/useIndent.ts'

import type { KubbNode } from '../types.ts'

type Props = {
  children?: KubbNode
  indentSize?: number
}

export function Text({ indentSize = 0, children }: Props): KubbNode {
  const indentBefore = useIndent({ size: indentSize })
  const indentChildren = useIndent({ size: 4, children })

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}

function Space({ indentSize = 1 }: Omit<Props, 'children'>): KubbNode {
  const indentBefore = useIndent({ size: indentSize })

  return <kubb-text>{indentBefore}</kubb-text>
}

Text.Space = Space
