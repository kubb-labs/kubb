import React from 'react'
import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  indentSize?: number
}

export function Text({ indentSize = 0, children }: Props): React.ReactNode {
  const indentText = Array.from({ length: indentSize }).join(' ')
  return (
    <kubb-text>
      {indentText}
      {children}
    </kubb-text>
  )
}
