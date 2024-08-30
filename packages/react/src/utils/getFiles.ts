import { nodeNames } from '../dom.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

import { createFile } from '@kubb/core/utils'
import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../components/File.tsx'
import type { DOMElement } from '../types.ts'

export function getFiles(node: DOMElement): KubbFile.ResolvedFile[] {
  let files: KubbFile.ResolvedFile[] = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      files = [...files, ...getFiles(childNode)]
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File>

      if (attributes.baseName && attributes.path) {
        const sources = squashSourceNodes(childNode, ['kubb-export', 'kubb-import'])

        const file = createFile({
          baseName: attributes.baseName,
          path: attributes.path,
          sources,
          exports: squashExportNodes(childNode),
          imports: squashImportNodes(childNode),
          override: attributes.override,
          meta: attributes.meta,
        })

        files.push(file)
      }
    }
  }

  return files
}
