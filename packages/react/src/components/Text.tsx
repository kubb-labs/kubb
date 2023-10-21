import { useIndent } from '../hooks/useIndent.ts'

import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  indentSize?: number
}

export function Text({ indentSize = 0, children }: Props): ReactNode {
  const indentBefore = useIndent({ size: indentSize })
  const indentChildren = useIndent({ size: 4, children })

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}

function Space({ indentSize = 1 }: Omit<Props, 'children'>): ReactNode {
  const indentBefore = useIndent({ size: indentSize })

  return <kubb-text>{indentBefore}</kubb-text>
}

Text.Space = Space
