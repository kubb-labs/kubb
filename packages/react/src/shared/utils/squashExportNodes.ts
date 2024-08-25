import { nodeNames } from '../dom.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function squashExportNodes(node: DOMElement): Array<KubbFile.Export> {
  let exports: Array<KubbFile.Export> = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      exports = [...exports, ...squashExportNodes(childNode)]
    }

    if (childNode.nodeName === 'kubb-export' && !childNode.attributes.print) {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Export>
      exports.push(attributes)
    }
  }

  return exports
}
