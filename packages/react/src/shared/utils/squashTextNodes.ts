import { readSync } from '@kubb/core'
import { createExportDeclaration, createImportDeclaration, print } from '@kubb/parser'

import type { Export as ExportComponent } from '../../components/Export.tsx'
import type { File as FileComponent } from '../../components/File.tsx'
import type { Import as ImportComponent } from '../../components/Import.tsx'
import type { DOMElement } from '../../types.ts'

// Squashing text nodes allows to combine multiple text nodes into one and write
// to `Output` instance only once. For example, <Text>hello{' '}world</Text>
// is actually 3 text nodes, which would result 3 writes to `Output`.
//
// Also, this is necessary for libraries like ink-link (https://github.com/sindresorhus/ink-link),
// which need to wrap all children at once, instead of wrapping 3 text nodes separately.
export function squashTextNodes(node: DOMElement): string {
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
      if (['kubb-text', 'kubb-file', 'kubb-source'].includes(childNode.nodeName)) {
        nodeText = squashTextNodes(childNode)
      }

      if (childNode.nodeName === 'kubb-import' && childNode.attributes.print) {
        const attributes = childNode.attributes as React.ComponentProps<typeof ImportComponent>
        nodeText = print(createImportDeclaration({ name: attributes.name, path: attributes.path, isTypeOnly: attributes.isTypeOnly }))
      }

      if (childNode.nodeName === 'kubb-export' && childNode.attributes.print) {
        const attributes = childNode.attributes as React.ComponentProps<typeof ExportComponent>
        nodeText = print(
          createExportDeclaration({ name: attributes.name, path: attributes.path, isTypeOnly: attributes.isTypeOnly, asAlias: attributes.asAlias }),
        )
      }
      if (childNode.nodeName === 'kubb-source' && childNode.attributes.print) {
        const attributes = childNode.attributes as React.ComponentProps<(typeof FileComponent)['Source']>

        if (attributes.path) {
          nodeText = readSync(attributes.path)
        }
      }

      if (childNode.nodeName === 'br') {
        nodeText = '\n'
      }

      // Since these text nodes are being concatenated, `Output` instance won't be able to
      // apply children transform, so we have to do it manually here for each text node
      if (nodeText.length > 0 && typeof childNode.internal_transform === 'function') {
        nodeText = childNode.internal_transform(nodeText, index)
      }
    }

    text += nodeText
  }

  return text
}
