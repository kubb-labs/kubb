import { transformers } from '@kubb/core'

type Props = {
  size: number
  children?: React.ReactNode
}

export function useIndent({ size, children }: Props): React.ReactNode {
  let indentWithChildren: React.ReactNode

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
