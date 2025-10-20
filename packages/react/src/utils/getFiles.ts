import type { KubbFile } from '@kubb/core/fs'
import type { File } from '@kubb/react-fabric'
import type React from 'react'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

export function getFiles(node: DOMElement): Set<KubbFile.File> {
  let files = new Set<KubbFile.File>()

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      files = new Set([...files, ...getFiles(childNode)])
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File>

      if (attributes.baseName && attributes.path) {
        const sources = squashSourceNodes(childNode, ['kubb-export', 'kubb-import'])

        const file: KubbFile.File = {
          baseName: attributes.baseName,
          path: attributes.path,
          sources: [...sources],
          exports: [...squashExportNodes(childNode)],
          imports: [...squashImportNodes(childNode)],
          meta: attributes.meta || {},
          footer: attributes.footer,
          banner: attributes.banner,
        }

        files.add(file)
      }
    }
  }

  return files
}
