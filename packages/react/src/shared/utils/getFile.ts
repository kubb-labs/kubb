import type { File } from '@kubb/core'
import type React from 'react'
import type { File as FileComponent } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function getFile(node: DOMElement): File | undefined {
  let file: File | undefined

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof FileComponent>

      if (attributes.fileName && attributes.path) {
        file = {
          fileName: attributes.fileName,
          path: attributes.path,
          source: '',
          env: attributes.env,
        }
      }
    }
  }

  return file
}
