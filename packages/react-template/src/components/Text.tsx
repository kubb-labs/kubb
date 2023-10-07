import React from 'react'
import type { ReactNode } from 'react'

type Props = {
  children?: ReactNode
  indentSize?: number
}

export function createIndent(size: number): string {
  return Array.from({ length: size }).join(' ')
}

export function Text({ indentSize = 0, children }: Props): React.ReactNode {
  const indentBefore = createIndent(indentSize)

  let indentChildren

  if (indentSize && typeof children === 'string') {
    indentChildren = children.replaceAll('\n', `\n${createIndent(4)}`)
  }

  if (indentSize && Array.isArray(children)) {
    indentChildren = children.map((child) => {
      let text: string = child as string

      if (typeof text === 'string') {
        if (text.startsWith('\n')) {
          text = text.replace('\n', '')
        }
        if (text.substring(text.length - 1, text.length) === '\n') {
          text = text.substring(0, text.length - 2)
        }
        text = text.replaceAll('\n', `\n${createIndent(4)}`)
      }
      return text
    })
  }

  return (
    <kubb-text>
      {indentBefore}
      {indentChildren ? indentChildren : children}
    </kubb-text>
  )
}
