import React from 'react'

import { useIndent } from '../hooks/useIndent'

type Props = {
  children?: React.ReactNode
  indentSize?: number
}

export function Text({ indentSize = 0, children }: Props): React.ReactNode {
  const indentBefore = useIndent({ size: indentSize })
  const indentChildren = useIndent({ size: 4, children })

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}
