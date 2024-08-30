import { getFiles } from './utils/getFiles.ts'
import { squashExportNodes } from './utils/squashExportNodes.ts'
import { squashImportNodes } from './utils/squashImportNodes.ts'
import { squashTextNodes } from './utils/squashTextNodes.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { DOMElement } from '../types.ts'

export type RendererResult = {
  output: string
  imports: Array<KubbFile.Import>
  exports: Array<KubbFile.Export>
  files: KubbFile.File[]
}

export function renderer(node: DOMElement): RendererResult {
  const imports = squashImportNodes(node)
  const exports = squashExportNodes(node)
  const files = getFiles(node)
  const text = squashTextNodes(node)
  const output = files.length
    ? files
        .flatMap((file) => file.sources.map((item) => item.value))
        .filter(Boolean)
        .join('\n\n')
    : text

  return {
    output,
    files,
    imports,
    exports,
  }
}
