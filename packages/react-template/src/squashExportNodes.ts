import type { Export as ExportComponent } from './components/Export.tsx'
import type { DOMElement } from './dom.js'
import type React from 'react'
import type { Export } from '@kubb/core'

export function squashExportNodes(node: DOMElement): Export[] {
  const exports: Export[] = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-export' && !childNode.attributes.print) {
      const attributes = childNode.attributes as React.ComponentProps<typeof ExportComponent>
      exports.push({ name: attributes['name'], path: attributes['path'], isTypeOnly: attributes.isTypeOnly, asAlias: attributes['asAlias'] })
    }
  }

  return exports
}
