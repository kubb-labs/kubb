import type { ArrowFunctionNode, CodeNode, ExportNode, FileNode, ImportNode, JSDocNode, SourceNode } from '@kubb/ast'
import {
  createArrowFunction,
  createBreak,
  createConst,
  createExport,
  createFunction,
  createImport,
  createJsx,
  createSource,
  createText,
  createType,
} from '@kubb/ast'
import { nodeNames, TEXT_NODE_NAME } from './constants.ts'
import type { DOMElement, DOMNode, ElementNames } from './types.ts'

/**
 * Collect the text and nested AST-node children of a single kubb-* element.
 *
 * `#text` children become raw {@link TextNode}s; nested `kubb-function`, `kubb-const`,
 * `kubb-type`, and similar elements are converted into their respective {@link CodeNode}s.
 * Any unrecognized DOM elements are silently skipped.
 */
function collectChildNodes(element: DOMElement): Array<CodeNode> {
  const result: Array<CodeNode> = []

  for (const child of element.childNodes) {
    if (!child) {
      continue
    }

    if (child.nodeName === TEXT_NODE_NAME) {
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
    } else if (child.nodeName === 'kubb-jsx') {
      const textChild = child.childNodes[0]
      const value = textChild?.nodeName === TEXT_NODE_NAME ? (textChild as DOMNode<{ nodeName: '#text' }>).nodeValue : ''
      if (value) {
        result.push(createJsx(value))
      }
    }
  }

  return result
}

/**
 * Traverse `node` and collect all `<kubb-source>` elements into a `Set<SourceNode>`.
 *
 * Elements whose `nodeName` is in `ignores` are skipped entirely (including their subtrees).
 * This is used to collect source blocks from a file node while excluding import/export subtrees.
 *
 * @example Collect sources while ignoring export and import elements
 * ```ts
 * const sources = squashSourceNodes(fileElement, ['kubb-export', 'kubb-import'])
 * ```
 */
function squashSourceNodes(node: DOMElement, ignores: Array<ElementNames>): Set<SourceNode> {
  const ignoreSet = new Set(ignores)
  const sources = new Set<SourceNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && ignoreSet.has(child.nodeName)) {
        continue
      }

      if (child.nodeName === 'kubb-source') {
        const source = createSource({
          name: child.attributes.get('name')?.toString(),
          isTypeOnly: (child.attributes.get('isTypeOnly') ?? false) as boolean,
          isExportable: (child.attributes.get('isExportable') ?? false) as boolean,
          isIndexable: (child.attributes.get('isIndexable') ?? false) as boolean,
          nodes: collectChildNodes(child),
        })

        sources.add(source)
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && nodeNames.has(child.nodeName)) {
        walk(child)
      }
    }
  }

  walk(node)
  return sources
}

/**
 * Traverse `node` and collect all `<kubb-export>` elements into a `Set<ExportNode>`.
 */
function squashExportNodes(node: DOMElement): Set<ExportNode> {
  const exports = new Set<ExportNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-export') {
        exports.add(
          createExport({
            name: child.attributes.get('name') as ExportNode['name'],
            path: child.attributes.get('path') as string,
            isTypeOnly: (child.attributes.get('isTypeOnly') ?? false) as boolean,
            asAlias: (child.attributes.get('asAlias') ?? false) as boolean,
          }),
        )
      }
    }
  }

  walk(node)
  return exports
}

/**
 * Traverse `node` and collect all `<kubb-import>` elements into a `Set<ImportNode>`.
 */
function squashImportNodes(node: DOMElement): Set<ImportNode> {
  const imports = new Set<ImportNode>()

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-import') {
        imports.add(
          createImport({
            name: child.attributes.get('name') as ImportNode['name'],
            path: child.attributes.get('path') as string,
            root: child.attributes.get('root') as string | undefined,
            isTypeOnly: (child.attributes.get('isTypeOnly') ?? false) as boolean,
            isNameSpace: (child.attributes.get('isNameSpace') ?? false) as boolean,
          }),
        )
      }
    }
  }

  walk(node)
  return imports
}

/**
 * Walk the virtual DOM tree rooted at `node` and convert every `<kubb-file>` element
 * into a {@link FileNode}, collecting its source blocks, imports, and exports.
 *
 * Returns the list of file nodes in document order. Nested files are supported —
 * the walker descends into non-file elements and recurses through them.
 */
export function processFiles(node: DOMElement): Array<FileNode> {
  const collected: Array<FileNode> = []

  function walk(current: DOMElement) {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && child.nodeName !== 'kubb-file' && nodeNames.has(child.nodeName)) {
        walk(child)
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

  walk(node)

  return collected
}
