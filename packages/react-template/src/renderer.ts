import type { DOMElement } from './dom.js'
import { squashTextNodes } from './squashTextNodes.js'

type Result = {
  output: string
}

export function renderer(node: DOMElement): Result {
  // if (node.yogaNode) {
  // }

  const output = squashTextNodes(node)

  return {
    output: output,
  }
}
