import { nodeNames } from '../dom.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function squashImportNodes(node: DOMElement): Array<KubbFile.Import> {
  let imports: Array<KubbFile.Import> = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      imports = [...imports, ...squashImportNodes(childNode)]
    }

    if (childNode.nodeName === 'kubb-import' && !childNode.attributes.print) {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Import>
      imports.push(attributes)
    }
  }

  return imports
}
