import { getFile, getFiles, squashExportNodes, squashImportNodes, squashTextNodes } from './utils/index.ts'

import type { KubbFile } from '@kubb/core'
import type { DOMElement } from '../types.ts'

type Result = {
  output: string
  imports: Array<KubbFile.Import>
  exports: Array<KubbFile.Export>
  /**
   * @deprecated
   * Use Files instead
   * File will include all sources combined
   */
  file?: KubbFile.File
  files: KubbFile.File[]
}

export function renderer(node: DOMElement): Result {
  const output = squashTextNodes(node)
  const imports = squashImportNodes(node)
  const exports = squashExportNodes(node)
  const file = getFile(node)
  const files = getFiles(node)

  const mergedFile: KubbFile.File | undefined = file ? { ...file, exports, imports, source: output } : undefined

  return {
    output,
    file: mergedFile,
    files,
    imports,
    exports,
  }
}
