import { print } from '@kubb/parser'

import type { Editor } from '../../components/Editor.tsx'
import type { DOMElement } from '../../types.ts'

export function format(text: string, node: DOMElement): string {
  const attributes = node.attributes as React.ComponentProps<(typeof Editor)>
  try {
    if (attributes.language === 'typescript') {
      return print([], { source: text, noEmitHelpers: false })
    }

    return text
  } catch (e) {
    console.log(e)
  }

  return text
}
