import type { Import, Export } from '@kubb/core'
import type { DOMElement } from './dom.ts'
import { squashTextNodes } from './squashTextNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashExportNodes } from './squashExportNodes.ts'

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
