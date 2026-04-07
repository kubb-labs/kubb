import { createConst, createFunction, createSource, createType } from '@kubb/ast'
import type { CodeNode, SourceNode } from '@kubb/ast/types'
import { nodeNames } from '../dom.ts'
import type { DOMElement, ElementNames } from '../types.ts'

/**
 * Walk a source DOM subtree and collect AST nodes from kubb-function, kubb-const,
 * and kubb-type elements. This is the same pattern as squashImportNodes/squashExportNodes
 * but for top-level declarations inside a source block.
 */
function collectAstNodes(node: DOMElement): NonNullable<Array<CodeNode>> {
  const nodes: NonNullable<Array<CodeNode>> = []

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child || child.nodeName === '#text') {
        continue
      }

      if (child.nodeName === 'kubb-function') {
        const attrs = child.attributes
        nodes.push(
          createFunction({
            name: attrs.get('name') as string,
            params: attrs.get('params') as string | undefined,
            export: attrs.get('export') as boolean | undefined,
            default: attrs.get('default') as boolean | undefined,
            async: attrs.get('async') as boolean | undefined,
            generics: attrs.get('generics') as string | undefined,
            returnType: attrs.get('returnType') as string | undefined,
          }),
        )
      } else if (child.nodeName === 'kubb-const') {
        const attrs = child.attributes
        nodes.push(
          createConst({
            name: attrs.get('name') as string,
            type: attrs.get('type') as string | undefined,
            export: attrs.get('export') as boolean | undefined,
            asConst: attrs.get('asConst') as boolean | undefined,
          }),
        )
      } else if (child.nodeName === 'kubb-type') {
        const attrs = child.attributes
        nodes.push(
          createType({
            name: attrs.get('name') as string,
            export: attrs.get('export') as boolean | undefined,
          }),
        )
      } else {
        walk(child)
      }
    }
  }

  walk(node)
  return nodes
}

export function squashSourceNodes(node: DOMElement, ignores: Array<ElementNames>): Set<SourceNode> {
  const ignoreSet = new Set(ignores)
  const sources = new Set<SourceNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== '#text' && ignoreSet.has(child.nodeName)) {
        continue
      }

      if (child.nodeName === 'kubb-source') {
        const astNodes = collectAstNodes(child)

        const source = createSource({
          name: child.attributes.get('name')?.toString(),
          isTypeOnly: (child.attributes.get('isTypeOnly') ?? false) as boolean,
          isExportable: (child.attributes.get('isExportable') ?? false) as boolean,
          isIndexable: (child.attributes.get('isIndexable') ?? false) as boolean,
        })

        if (astNodes.length > 0) {
          source.nodes = astNodes
        }

        sources.add(source)
        continue
      }

      if (child.nodeName !== '#text' && nodeNames.has(child.nodeName)) {
        walk(child)
      }
    }
  }

  walk(node)
  return sources
}
