import type { Import } from '@kubb/core'
import type { DOMElement } from './dom.js'

export function squashImportNodes(node: DOMElement): Import[] {
  const imports: Import[] = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-import' && childNode.attributes) {
      imports.push(childNode.attributes as Import)
    }
  }

  return imports
}
