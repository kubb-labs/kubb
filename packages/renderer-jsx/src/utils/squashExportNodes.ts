import type { ExportNode } from '@kubb/ast/types'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'

export function squashExportNodes(node: DOMElement): Set<ExportNode> {
  const exports = new Set<ExportNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== '#text' && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-export') {
        exports.add({
          name: child.attributes.get('name'),
          path: child.attributes.get('path'),
          isTypeOnly: child.attributes.get('isTypeOnly') ?? false,
          asAlias: child.attributes.get('asAlias') ?? false,
        } as ExportNode)
      }
    }
  }

  walk(node)
  return exports
}
