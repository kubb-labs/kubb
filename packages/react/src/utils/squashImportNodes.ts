import { nodeNames } from '../dom.ts'

import { combineImports } from '@kubb/core'
import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../components/File.tsx'
import type { DOMElement } from '../types.ts'

export function squashImportNodes(node: DOMElement): Set<KubbFile.Import> {
  let imports = new Set<KubbFile.Import>()

  node.childNodes.filter(Boolean).forEach((childNode) => {
    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      imports = new Set(combineImports([...imports, ...squashImportNodes(childNode)]))
    }

    if (childNode.nodeName === 'kubb-import') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File.Import>
      imports.add(attributes)
    }
  })

  return imports
}
