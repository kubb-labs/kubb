import { nodeNames } from '../dom.ts'

import type { KubbFile } from '@kubb/core'
import type React from 'react'
import type { Import as ImportComponent } from '../../components/Import.tsx'
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
      const attributes = childNode.attributes as React.ComponentProps<typeof ImportComponent>
      imports.push({
        name: attributes.name,
        path: attributes.path,
        isTypeOnly: attributes.isTypeOnly,
        root: attributes.root,
      })
    }
  }

  return imports
}
