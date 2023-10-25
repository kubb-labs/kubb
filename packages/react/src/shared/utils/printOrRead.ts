import { readSync } from '@kubb/core'
import { print } from '@kubb/parser'

import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function printOrRead(text: string, node: DOMElement): string {
  const attributes = node.attributes as React.ComponentProps<(typeof File.Source)>
  try {
    let source = text

    if (attributes.path) {
      source = readSync(attributes.path)
    }

    return print([], { source, removeComments: attributes.removeComments })
  } catch (e) {
    console.log(e)
  }

  return text
}
