import { nodeNames } from '../dom.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

import type { KubbFile } from '@kubb/core'
import type React from 'react'
import type { File } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function getFile(node: DOMElement): KubbFile.File | undefined {
  let file: KubbFile.File | undefined

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof File>

      if (attributes.baseName && attributes.path) {
        file = {
          baseName: attributes.baseName,
          path: attributes.path,
          source: '',
          env: attributes.env,
          override: attributes.override,
        }
      }
    }
  }

  return file
}

export function getFiles(node: DOMElement): KubbFile.File[] {
  let files: KubbFile.File[] = []

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
        const file: KubbFile.File = {
          baseName: attributes.baseName,
          path: attributes.path,
          source: squashSourceNodes(childNode),
          env: attributes.env,
          exports: squashExportNodes(childNode),
          imports: squashImportNodes(childNode),
          override: attributes.override,
        }

        files.push(file)
      }
    }
  }

  return files
}
