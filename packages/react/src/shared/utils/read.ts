import { readSync } from '@kubb/fs'

import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function read(text: string, node: DOMElement): string {
  const attributes = node.attributes as React.ComponentProps<typeof File.Source>
  try {
    let source = text

    if (attributes.path) {
      source = readSync(attributes.path)
    }

    return source
  } catch (e) {
    console.log(e)
  }

  return text
}
