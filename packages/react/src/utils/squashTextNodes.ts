import { getRelativePath } from '@kubb/fs'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'

import type { File } from '../components/File.tsx'
import type { DOMElement } from '../types.ts'

export function squashTextNodes(node: DOMElement): string {
  let text = ''

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    let nodeText = ''

    const getPrintText = (text: string): string => {
      if (childNode.nodeName === 'kubb-import') {
        const attributes = childNode.attributes as React.ComponentProps<typeof File.Import>
        return print(
          factory.createImportDeclaration({
            name: attributes.name,
            path: attributes.root ? getRelativePath(attributes.root, attributes.path) : attributes.path,
            isTypeOnly: attributes.isTypeOnly,
          }),
        )
      }

      if (childNode.nodeName === 'kubb-export') {
        const attributes = childNode.attributes as React.ComponentProps<typeof File.Export>
        if (attributes.path) {
          return print(
            factory.createExportDeclaration({
              name: attributes.name,
              path: attributes.path,
              isTypeOnly: attributes.isTypeOnly,
              asAlias: attributes.asAlias,
            }),
          )
        }
      }

      if (childNode.nodeName === 'kubb-source') {
        return text
      }

      return text
    }

    if (childNode.nodeName === '#text') {
      nodeText = childNode.nodeValue
    } else {
      if (['kubb-text', 'kubb-file', 'kubb-source'].includes(childNode.nodeName)) {
        nodeText = squashTextNodes(childNode)
      }

      nodeText = getPrintText(nodeText)

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
