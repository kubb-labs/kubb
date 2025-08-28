import indentString from 'indent-string'
import { cloneElement, isValidElement, type ReactNode } from 'react'

type IndentProps = {
  size: number
  children?: ReactNode
}

/**
 * Recursively indent React children.
 * Strings are indented, elements are cloned with indented children.
 */
export function indentReactChildren({ size, children }: IndentProps): ReactNode {
  if (children == null) return null

  const indent = (node: ReactNode): ReactNode => {
    if (typeof node === 'string') {
      return indentString(node, size)
    }

    if (Array.isArray(node)) {
      return node.map((child) => indent(child))
    }

    if (isValidElement(node)) {
      const props = node.props as { children?: ReactNode }
      return cloneElement(node, undefined, indent(props.children))
    }

    return node
  }

  return indent(children)
}
