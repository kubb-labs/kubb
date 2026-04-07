import type { ImportNode } from '@kubb/ast/types'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'

export function squashImportNodes(node: DOMElement): Set<ImportNode> {
  const imports = new Set<ImportNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== '#text' && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-import') {
        imports.add({
          name: child.attributes.get('name'),
          path: child.attributes.get('path'),
          root: child.attributes.get('root'),
          isTypeOnly: child.attributes.get('isTypeOnly') ?? false,
          isNameSpace: child.attributes.get('isNameSpace') ?? false,
        } as ImportNode)
      }
    }
  }

  walk(node)
  return imports
}
