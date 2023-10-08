import type { Import } from '@kubb/core'

import type { Import as ImportComponent } from './components/Import.ts'
import type { DOMElement } from './dom.js'
import type React from 'react'

export function squashImportNodes(node: DOMElement): Import[] {
  const imports: Import[] = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-import' && !childNode.attributes.print) {
      const attributes = childNode.attributes as React.ComponentProps<typeof ImportComponent>
      imports.push({ name: attributes['name'], path: attributes['path'], isTypeOnly: attributes.isTypeOnly })
    }
  }

  return imports
}
