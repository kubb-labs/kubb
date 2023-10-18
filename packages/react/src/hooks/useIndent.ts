type Props = {
  size: number
  children?: React.ReactNode
}
// TODO move to @kubb/core
export function createIndent(size: number): string {
  return Array.from({ length: size }).join(' ')
}

export function useIndent({ size, children }: Props): React.ReactNode {
  let indentWithChildren: React.ReactNode

  if (!children) {
    return createIndent(size)
  }

  if (typeof children === 'string') {
    indentWithChildren = children.replaceAll('\n', `\n${createIndent(size)}`)
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
        text = text.replaceAll('\n', `\n${createIndent(size)}`)
      }
      return text
    })
  }

  return indentWithChildren
}
