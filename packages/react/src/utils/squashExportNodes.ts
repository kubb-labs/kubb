import { nodeNames } from '../dom.ts'

import type { KubbFile } from '@kubb/core/fs'
import type React from 'react'
import type { File } from '../components/File.tsx'
import type { DOMElement } from '../types.ts'

export function squashExportNodes(node: DOMElement): Set<KubbFile.ResolvedExport> {
  let exports = new Set<KubbFile.Export>()

  node.childNodes.filter(Boolean).forEach((childNode) => {
    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      exports = new Set([...exports, ...squashExportNodes(childNode)])
    }

    if (childNode.nodeName === 'kubb-export') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Export>
      exports.add(attributes)
    }
  })

  return exports
}
