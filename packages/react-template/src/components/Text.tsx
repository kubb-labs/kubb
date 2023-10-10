import { useIndent } from '../hooks/useIndent'

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
