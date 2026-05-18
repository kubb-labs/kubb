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
          name: attrs['name'] as string,
          params: attrs['params'] as string | undefined,
          export: attrs['export'] as boolean | undefined,
          default: attrs['default'] as boolean | undefined,
          async: attrs['async'] as boolean | undefined,
          generics: attrs['generics'] as string | undefined,
          returnType: attrs['returnType'] as string | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        }),
      )
    } else if (child.nodeName === 'kubb-arrow-function') {
      const attrs = child.attributes
      result.push(
        createArrowFunction({
          name: attrs['name'] as string,
          params: attrs['params'] as string | undefined,
          export: attrs['export'] as boolean | undefined,
          default: attrs['default'] as boolean | undefined,
          async: attrs['async'] as boolean | undefined,
          generics: attrs['generics'] as string | undefined,
          returnType: attrs['returnType'] as string | undefined,
          singleLine: attrs['singleLine'] as boolean | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        } as Omit<ArrowFunctionNode, 'kind'>),
      )
    } else if (child.nodeName === 'kubb-const') {
      const attrs = child.attributes
      result.push(
        createConst({
          name: attrs['name'] as string,
          type: attrs['type'] as string | undefined,
          export: attrs['export'] as boolean | undefined,
          asConst: attrs['asConst'] as boolean | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | undefined,
          nodes: collectChildNodes(child),
        }),
      )
    } else if (child.nodeName === 'kubb-type') {
      const attrs = child.attributes
      result.push(
        createType({
          name: attrs['name'] as string,
          export: attrs['export'] as boolean | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | undefined,
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

const SOURCE_IGNORES = new Set<ElementNames>(['kubb-export', 'kubb-import'])

/**
 * Traverse `node` and collect all `<kubb-source>` elements, excluding subtrees
 * rooted at `<kubb-export>` or `<kubb-import>` elements.
 */
function squashSourceNodes(node: DOMElement): SourceNode[] {
  const sources: SourceNode[] = []

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && SOURCE_IGNORES.has(child.nodeName)) {
        continue
      }

      if (child.nodeName === 'kubb-source') {
        sources.push(
          createSource({
            name: child.attributes['name']?.toString(),
            isTypeOnly: (child.attributes['isTypeOnly'] ?? false) as boolean,
            isExportable: (child.attributes['isExportable'] ?? false) as boolean,
            isIndexable: (child.attributes['isIndexable'] ?? false) as boolean,
            nodes: collectChildNodes(child),
          }),
        )
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
 * Traverse `node` and collect all `<kubb-export>` elements.
 */
function squashExportNodes(node: DOMElement): ExportNode[] {
  const exports: ExportNode[] = []

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-export') {
        exports.push(
          createExport({
            name: child.attributes['name'] as ExportNode['name'],
            path: child.attributes['path'] as string,
            isTypeOnly: (child.attributes['isTypeOnly'] ?? false) as boolean,
            asAlias: (child.attributes['asAlias'] ?? false) as boolean,
          }),
        )
      }
    }
  }

  walk(node)
  return exports
}

/**
 * Traverse `node` and collect all `<kubb-import>` elements.
 */
function squashImportNodes(node: DOMElement): ImportNode[] {
  const imports: ImportNode[] = []

  const walk = (current: DOMElement): void => {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && nodeNames.has(child.nodeName)) {
        walk(child)
      }

      if (child.nodeName === 'kubb-import') {
        imports.push(
          createImport({
            name: child.attributes['name'] as ImportNode['name'],
            path: child.attributes['path'] as string,
            root: child.attributes['root'] as string | undefined,
            isTypeOnly: (child.attributes['isTypeOnly'] ?? false) as boolean,
            isNameSpace: (child.attributes['isNameSpace'] ?? false) as boolean,
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
        if (child.attributes['baseName'] !== undefined && child.attributes['path'] !== undefined) {
          collected.push({
            baseName: child.attributes['baseName'],
            path: child.attributes['path'],
            meta: child.attributes['meta'] || {},
            footer: child.attributes['footer'],
            banner: child.attributes['banner'],
            sources: squashSourceNodes(child),
            exports: squashExportNodes(child),
            imports: squashImportNodes(child),
          } as FileNode)
        }
      }
    }
  }

  walk(node)

  return collected
}

/**
 * Generator version of {@link processFiles}: yields each {@link FileNode} as it
 * is encountered during the tree walk, without collecting into an intermediate array.
 * Callers can begin processing each file before the rest of the tree is traversed.
 */
export function* streamFiles(node: DOMElement): Generator<FileNode> {
  function* walk(current: DOMElement): Generator<FileNode> {
    for (const child of current.childNodes) {
      if (!child) {
        continue
      }

      if (child.nodeName !== TEXT_NODE_NAME && child.nodeName !== 'kubb-file' && nodeNames.has(child.nodeName)) {
        yield* walk(child)
      }

      if (child.nodeName === 'kubb-file') {
        if (child.attributes['baseName'] !== undefined && child.attributes['path'] !== undefined) {
          yield {
            baseName: child.attributes['baseName'],
            path: child.attributes['path'],
            meta: child.attributes['meta'] || {},
            footer: child.attributes['footer'],
            banner: child.attributes['banner'],
            sources: squashSourceNodes(child),
            exports: squashExportNodes(child),
            imports: squashImportNodes(child),
          } as FileNode
        }
      }
    }
  }

  yield* walk(node)
}
