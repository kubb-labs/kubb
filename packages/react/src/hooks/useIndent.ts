import transformers from '@kubb/core/transformers'

import type { KubbNode } from '../types.ts'

type Props = {
  /**
   * Size to use for the indenting
   */
  size: number
  children?: KubbNode
}

export function useIndent({ size, children }: Props): KubbNode {
  let indentWithChildren: KubbNode

  if (!children) {
    return transformers.createIndent(size)
  }

  if (typeof children === 'string') {
    indentWithChildren = children.replaceAll('\n', `\n${transformers.createIndent(size)}`)
  }

  if (Array.isArray(children)) {
    indentWithChildren = children.map((child) => {
      let text: string = child as string

      if (typeof text === 'string') {
        if (text.startsWith('\n')) {
          text = text.replace('\n', '')
        }
        if (text.substring(text.length - 1, text.length) === '\n') {
          text = text.substring(0, text.length - 2)
        }
        text = text.replaceAll('\n', `\n${transformers.createIndent(size)}`)
      }
      return text
    })
  }

  return indentWithChildren
}
