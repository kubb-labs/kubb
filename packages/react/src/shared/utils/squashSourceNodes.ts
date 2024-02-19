import { nodeNames } from '../dom.ts'
import { read } from './read.ts'

import type { DOMElement } from '../../types.ts'

export function squashSourceNodes(node: DOMElement): string {
  let text = ''

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    let nodeText = ''

    if (childNode.nodeName === '#text') {
      nodeText = childNode.nodeValue
    } else {
      if (nodeNames.includes(childNode.nodeName)) {
        nodeText = squashSourceNodes(childNode)
      }

      if (childNode.nodeName === 'kubb-source') {
        nodeText = read(nodeText, childNode)
      }

      if (childNode.nodeName === 'br') {
        nodeText = '\n'
      }
    }

    text += nodeText
  }

  return text
}
