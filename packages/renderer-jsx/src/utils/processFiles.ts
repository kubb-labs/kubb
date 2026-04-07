import type { FileNode } from '@kubb/ast/types'
import { nodeNames } from '../dom.ts'
import type { DOMElement } from '../types.ts'
import { squashExportNodes } from './squashExportNodes.ts'
import { squashImportNodes } from './squashImportNodes.ts'
import { squashSourceNodes } from './squashSourceNodes.ts'

export async function processFiles(node: DOMElement): Promise<Array<FileNode>> {
  const collected: Array<FileNode> = []

  async function walk(current: DOMElement) {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== '#text' && child.nodeName !== 'kubb-file' && nodeNames.has(child.nodeName)) {
        await walk(child)
      }

      if (child.nodeName === 'kubb-file') {
        if (child.attributes.has('baseName') && child.attributes.has('path')) {
          const sources = squashSourceNodes(child, ['kubb-export', 'kubb-import'])

          collected.push({
            baseName: child.attributes.get('baseName'),
            path: child.attributes.get('path'),
            meta: child.attributes.get('meta') || {},
            footer: child.attributes.get('footer'),
            banner: child.attributes.get('banner'),
            sources: [...sources],
            exports: [...squashExportNodes(child)],
            imports: [...squashImportNodes(child)],
          } as FileNode)
        }
      }
    }
  }

  await walk(node)

  return collected
}
