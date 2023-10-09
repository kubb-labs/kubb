import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashTextNodes } from './squashTextNodes.ts'

import type { Export, Import } from '@kubb/core'
import type { DOMElement } from './dom.ts'

type Result = {
  output: string
  imports: Import[]
  exports: Export[]
}

export function renderer(node: DOMElement): Result {
  const output = squashTextNodes(node)
  const imports = squashImportNodes(node)
  const exports = squashExportNodes(node)

  return {
    output,
    imports,
    exports,
  }
}
