import { getRelativePath } from '@kubb/fs'
import { print } from '@kubb/parser-ts'
import * as factory from '@kubb/parser-ts/factory'

import type { File } from '../components/File.tsx'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'

export function squashTextNodes(node: DOMElement): string {
  let text = ''

  for (const childNode of node.childNodes) {
    if (!childNode) {
      continue
    }

    let nodeText = ''

    const getPrintText = (text: string): string => {
      if (childNode.nodeName === 'kubb-import') {
        const attributes = childNode.attributes as React.ComponentProps<typeof File.Import>
        return print([
          factory.createImportDeclaration({
            name: attributes.name,
            path: attributes.root ? getRelativePath(attributes.root, attributes.path) : attributes.path,
            isTypeOnly: attributes.isTypeOnly,
          }),
        ])
      }

      if (childNode.nodeName === 'kubb-export') {
        const attributes = childNode.attributes as React.ComponentProps<typeof File.Export>
        if (attributes.path) {
          return print([
            factory.createExportDeclaration({
              name: attributes.name,
              path: attributes.path,
              isTypeOnly: attributes.isTypeOnly,
              asAlias: attributes.asAlias,
            }),
          ])
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

      // no kubb element or br
      if (![...nodeNames, 'br'].includes(childNode.nodeName)) {
        const attributes = Object.entries(childNode.attributes).reduce((acc, [key, value]) => {
          if (typeof value === 'string') {
            return `${acc} ${key}="${value}"`
          }

          return `${acc} ${key}={${value}}`
        }, '')
        nodeText = `<${childNode.nodeName}${attributes}>${squashTextNodes(childNode)}</${childNode.nodeName}>`
      }
    }

    text += nodeText
  }

  return text
}
