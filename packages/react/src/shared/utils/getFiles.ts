import { nodeNames } from '../dom.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'
import { createFile } from '@kubb/core/utils'

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
        const file = createFile({
          id: attributes.id,
          baseName: attributes.baseName,
          path: attributes.path,
          source: squashSourceNodes(childNode),
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
