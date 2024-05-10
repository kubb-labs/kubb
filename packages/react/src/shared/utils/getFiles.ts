import { nodeNames } from '../dom.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

import type * as KubbFile from '@kubb/fs/types'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { Parser } from '../../components/Parser.tsx'
import type { DOMElement } from '../../types.ts'

export function getFiles(node: DOMElement, language?: string): KubbFile.File[] {
  let files: KubbFile.File[] = []

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName !== '#text' && nodeNames.includes(childNode.nodeName)) {
      if (childNode.nodeName === 'kubb-parser') {
        const attributes = childNode.attributes as React.ComponentProps<typeof Parser>
        files = [...files, ...getFiles(childNode, attributes.language)]
      } else {
        files = [...files, ...getFiles(childNode)]
      }
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File>

      if (attributes.baseName && attributes.path) {
        const file: KubbFile.File = {
          id: attributes.id,
          baseName: attributes.baseName,
          path: attributes.path,
          source: squashSourceNodes(childNode),
          env: attributes.env,
          exports: squashExportNodes(childNode),
          imports: squashImportNodes(childNode),
          override: attributes.override,
          meta: attributes.meta,
          exportable: attributes.exportable,
          language,
        }

        files.push(file)
      }
    }
  }

  return files
}
