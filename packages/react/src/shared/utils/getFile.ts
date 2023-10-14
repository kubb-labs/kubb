import type { KubbFile } from '@kubb/core'
import type React from 'react'
import type { File as FileComponent } from '../../components/File.tsx'
import type { DOMElement } from '../../types.ts'

export function getFile(node: DOMElement): KubbFile.File | undefined {
  let file: KubbFile.File | undefined

  for (let index = 0; index < node.childNodes.length; index++) {
    const childNode = node.childNodes[index]

    if (!childNode) {
      continue
    }

    if (childNode.nodeName === 'kubb-file') {
      const attributes = childNode.attributes as React.ComponentProps<typeof FileComponent>

      if (attributes.baseName && attributes.path) {
        file = {
          baseName: attributes.baseName,
          path: attributes.path,
          source: '',
          env: attributes.env,
        }
      }
    }
  }

  return file
}
