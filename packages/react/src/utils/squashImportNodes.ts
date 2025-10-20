import type { KubbFile } from '@kubb/core/fs'
import type { File } from '@kubb/react-fabric'
import type React from 'react'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'

export function squashImportNodes(node: DOMElement): Set<KubbFile.Import> {
  let imports = new Set<KubbFile.Import>()

  node.childNodes.filter(Boolean).forEach((childNode) => {
    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      imports = new Set([...imports, ...squashImportNodes(childNode)])
    }

    if (childNode.nodeName === 'kubb-import') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Import>
      imports.add(attributes)
    }
  })

  return imports
}
