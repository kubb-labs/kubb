import { nodeNames } from '../dom.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { DOMElement, ElementNames } from '../../types.ts'
import { squashTextNodes } from './squashTextNodes.ts'

export function squashSourceNodes(node: DOMElement, ignores: Array<ElementNames>): Array<KubbFile.Source> {
  let sources: Array<KubbFile.Source> = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && ignores.includes(childNode.nodeName)) {
      continue
    }

    if (childNode.nodeName === 'kubb-source') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Source>
      const value = squashTextNodes(childNode)

      sources.push({
        ...attributes,
        // remove end enter
        value: value.replace(/^\s+|\s+$/g, ''),
      })

      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      sources = [...sources, ...squashSourceNodes(childNode, ignores)]
    }
  }

  return sources
}
