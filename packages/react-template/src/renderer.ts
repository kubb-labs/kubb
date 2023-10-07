import type { Import } from '@kubb/core'
import type { DOMElement } from './dom.js'
import { squashTextNodes } from './squashTextNodes.js'
import { squashImportNodes } from './squashImportNodes.js'

type Result = {
  output: string
  imports: Import[]
}

export function renderer(node: DOMElement): Result {
  const output = squashTextNodes(node)
  const imports = squashImportNodes(node)

  return {
    output,
    imports,
  }
}
