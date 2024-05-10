import { getFiles } from './utils/getFiles.ts'
import { squashExportNodes } from './utils/squashExportNodes.ts'
import { squashImportNodes } from './utils/squashImportNodes.ts'
import { squashTextNodes } from './utils/squashTextNodes.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { DOMElement } from '../types.ts'

type Result = {
  output: string
  imports: Array<KubbFile.Import>
  exports: Array<KubbFile.Export>
  files: KubbFile.File[]
}

export function renderer(node: DOMElement): Result {
  const output = squashTextNodes(node)
  const imports = squashImportNodes(node)
  const exports = squashExportNodes(node)
  const files = getFiles(node)

  return {
    output,
    files,
    imports,
    exports,
  }
}
