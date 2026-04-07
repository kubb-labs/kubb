import { createArrowFunction, createBreak, createConst, createFunction, createSource, createText, createType } from '@kubb/ast'
import type { ArrowFunctionNode, CodeNode, ExportNode, FileNode, ImportNode, JSDocNode, SourceNode } from '@kubb/ast/types'
import { nodeNames } from './dom.ts'
import type { DOMElement, DOMNode, ElementNames } from './types.ts'

/**
 * Collect the text and nested AST-node children of a single kubb-* element.
 * `#text` children become raw strings; nested kubb-function/const/type children
 * become their respective {@link CodeNode}s. Other DOM elements are skipped.
 */
function collectChildNodes(element: DOMElement): Array<CodeNode> {
  const result: Array<CodeNode> = []

  for (const child of element.childNodes) {
    if (!child) {
      continue
    }

    if (child.nodeName === '#text') {
      const text = (child as DOMNode<{ nodeName: '#text' }>).nodeValue
      if (text && text.trim().length > 0) {
        result.push(createText(text))
      }
      continue
    }

    if (child.nodeName === 'br') {
      result.push(createBreak())
      continue
    }

    if (child.nodeName === 'kubb-function') {
      const attrs = child.attributes
      result.push(
        createFunction({
          name: attrs.get('name') as string,
          params: attrs.get('params') as string | undefined,
          export: attrs.get('export') as boolean | undefined,
          default: attrs.get('default') as boolean | undefined,
          async: attrs.get('async') as boolean | undefined,
          generics: attrs.get('generics') as string | undefined,
          returnType: attrs.get('returnType') as string | undefined,
          JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        }),
      )
    } else if (child.nodeName === 'kubb-arrow-function') {
      const attrs = child.attributes
      result.push(
        createArrowFunction({
          name: attrs.get('name') as string,
          params: attrs.get('params') as string | undefined,
          export: attrs.get('export') as boolean | undefined,
          default: attrs.get('default') as boolean | undefined,
          async: attrs.get('async') as boolean | undefined,
          generics: attrs.get('generics') as string | undefined,
          returnType: attrs.get('returnType') as string | undefined,
          singleLine: attrs.get('singleLine') as boolean | undefined,
          JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        } as Omit<ArrowFunctionNode, 'kind'>),
      )
    } else if (child.nodeName === 'kubb-const') {
      const attrs = child.attributes
      result.push(
        createConst({
          name: attrs.get('name') as string,
          type: attrs.get('type') as string | undefined,
          export: attrs.get('export') as boolean | undefined,
          asConst: attrs.get('asConst') as boolean | undefined,
          JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        }),
      )
    } else if (child.nodeName === 'kubb-type') {
      const attrs = child.attributes
      result.push(
        createType({
          name: attrs.get('name') as string,
          export: attrs.get('export') as boolean | undefined,
          JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        }),
      )
    }
  }

  return result
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
        // Collect children in DOM order: text strings and kubb-* elements interleaved
        const orderedNodes: Array<CodeNode> = []
        for (const c of child.childNodes) {
          if (!c) continue

          if (c.nodeName === '#text') {
            const text = (c as DOMNode<{ nodeName: '#text' }>).nodeValue
            if (text && text.trim().length > 0) {
              orderedNodes.push(createText(text))
            }
          } else if (c.nodeName === 'br') {
            orderedNodes.push(createBreak())
          } else if (c.nodeName === 'kubb-function') {
            const attrs = c.attributes
            orderedNodes.push(
              createFunction({
                name: attrs.get('name') as string,
                params: attrs.get('params') as string | undefined,
                export: attrs.get('export') as boolean | undefined,
                default: attrs.get('default') as boolean | undefined,
                async: attrs.get('async') as boolean | undefined,
                generics: attrs.get('generics') as string | undefined,
                returnType: attrs.get('returnType') as string | undefined,
                JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
                nodes: collectChildNodes(c),
              }),
            )
          } else if (c.nodeName === 'kubb-arrow-function') {
            const attrs = c.attributes
            orderedNodes.push(
              createArrowFunction({
                name: attrs.get('name') as string,
                params: attrs.get('params') as string | undefined,
                export: attrs.get('export') as boolean | undefined,
                default: attrs.get('default') as boolean | undefined,
                async: attrs.get('async') as boolean | undefined,
                generics: attrs.get('generics') as string | undefined,
                returnType: attrs.get('returnType') as string | undefined,
                singleLine: attrs.get('singleLine') as boolean | undefined,
                JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
                nodes: collectChildNodes(c),
              } as Omit<ArrowFunctionNode, 'kind'>),
            )
          } else if (c.nodeName === 'kubb-const') {
            const attrs = c.attributes
            orderedNodes.push(
              createConst({
                name: attrs.get('name') as string,
                type: attrs.get('type') as string | undefined,
                export: attrs.get('export') as boolean | undefined,
                asConst: attrs.get('asConst') as boolean | undefined,
                JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
                nodes: collectChildNodes(c),
              }),
            )
          } else if (c.nodeName === 'kubb-type') {
            const attrs = c.attributes
            orderedNodes.push(
              createType({
                name: attrs.get('name') as string,
                export: attrs.get('export') as boolean | undefined,
                JSDoc: attrs.get('JSDoc') as JSDocNode | undefined,
                nodes: collectChildNodes(c),
              }),
            )
          }
        }

        const source = createSource({
          name: child.attributes.get('name')?.toString(),
          isTypeOnly: (child.attributes.get('isTypeOnly') ?? false) as boolean,
          isExportable: (child.attributes.get('isExportable') ?? false) as boolean,
          isIndexable: (child.attributes.get('isIndexable') ?? false) as boolean,
          nodes: orderedNodes,
          // value is no longer set separately — all content is in nodes
        })

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
