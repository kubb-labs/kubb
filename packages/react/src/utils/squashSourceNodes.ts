import { nodeNames } from '../dom.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../components/File.tsx'
import type { DOMElement, ElementNames } from '../types.ts'
import { squashTextNodes } from './squashTextNodes.ts'

export function squashSourceNodes(node: DOMElement, ignores: Array<ElementNames>): Set<KubbFile.Source> {
  let sources = new Set<KubbFile.Source>()

  for (const childNode of node.childNodes) {
    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && ignores.includes(childNode.nodeName)) {
      continue
    }

    if (childNode.nodeName === 'kubb-source') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Source>
      const value = squashTextNodes(childNode)

      sources.add({
        ...attributes,
        // remove end enter
        value,
      })

      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      sources = new Set([...sources, ...squashSourceNodes(childNode, ignores)])
    }
  }

  return sources
}
