import { getFile, squashExportNodes, squashImportNodes, squashTextNodes } from './utils/index.ts'

import type { Export, File, Import } from '@kubb/core'
import type { DOMElement } from '../types.ts'

type Result = {
  output: string
  imports: Import[]
  exports: Export[]
  file?: File
}

export function renderer(node: DOMElement): Result {
  const output = squashTextNodes(node)
  const imports = squashImportNodes(node)
  const exports = squashExportNodes(node)
  const file = getFile(node)

  const mergedFile: File | undefined = file ? { ...file, exports, imports, source: output } : undefined

  return {
    output,
    file: mergedFile,
    imports,
    exports,
  }
}
