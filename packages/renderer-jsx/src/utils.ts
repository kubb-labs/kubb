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
import {
  KUBB_ARROW_FUNCTION,
  KUBB_CONST,
  KUBB_EXPORT,
  KUBB_FILE,
  KUBB_FUNCTION,
  KUBB_IMPORT,
  KUBB_JSX,
  KUBB_SOURCE,
  KUBB_TYPE,
  TEXT_NODE_NAME,
  nodeNames,
} from './constants.ts'
import type { DOMElement, DOMNode } from './types.ts'

function toBool(val: unknown): boolean {
  return (val ?? false) as boolean
}

/**
 * Collect the text and nested AST-node children of a single kubb-* element.
 *
 * `#text` children become raw text nodes. Nested `kubb-function`, `kubb-const`,
 * `kubb-type`, and similar elements are converted into their respective {@link CodeNode}s.
 * Any unrecognized element names are silently skipped.
 */
function collectCodeNodes(element: DOMElement): Array<CodeNode> {
  const result: Array<CodeNode> = []

  for (const child of element.childNodes) {
    if (!child) continue

    if (child.nodeName === TEXT_NODE_NAME) {
      const text = (child as DOMNode<{ nodeName: '#text' }>).nodeValue
      if (text && text.trim()) result.push(createText(text))
      continue
    }

    if (child.nodeName === 'br') {
      result.push(createBreak())
      continue
    }

    if (child.nodeName === KUBB_FUNCTION) {
      const attrs = child.attributes
      result.push(
        createFunction({
          name: attrs['name'] as string,
          params: attrs['params'] as string | null | undefined,
          export: attrs['export'] as boolean | null | undefined,
          default: attrs['default'] as boolean | null | undefined,
          async: attrs['async'] as boolean | null | undefined,
          generics: attrs['generics'] as string | Array<string> | null | undefined,
          returnType: attrs['returnType'] as string | null | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | null | undefined,
          nodes: collectCodeNodes(child),
        }),
      )
      continue
    }

    if (child.nodeName === KUBB_ARROW_FUNCTION) {
      const attrs = child.attributes
      result.push(
        createArrowFunction({
          name: attrs['name'] as string,
          params: attrs['params'] as string | null | undefined,
          export: attrs['export'] as boolean | null | undefined,
          default: attrs['default'] as boolean | null | undefined,
          async: attrs['async'] as boolean | null | undefined,
          generics: attrs['generics'] as string | Array<string> | null | undefined,
          returnType: attrs['returnType'] as string | null | undefined,
          singleLine: attrs['singleLine'] as boolean | null | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | null | undefined,
          nodes: collectCodeNodes(child),
        } as Omit<ArrowFunctionNode, 'kind'>),
      )
      continue
    }

    if (child.nodeName === KUBB_CONST) {
      const attrs = child.attributes
      result.push(
        createConst({
          name: attrs['name'] as string,
          type: attrs['type'] as string | null | undefined,
          export: attrs['export'] as boolean | null | undefined,
          asConst: attrs['asConst'] as boolean | null | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | null | undefined,
          nodes: collectCodeNodes(child),
        }),
      )
      continue
    }

    if (child.nodeName === KUBB_TYPE) {
      const attrs = child.attributes
      result.push(
        createType({
          name: attrs['name'] as string,
          export: attrs['export'] as boolean | null | undefined,
          JSDoc: attrs['JSDoc'] as JSDocNode | null | undefined,
          nodes: collectCodeNodes(child),
        }),
      )
      continue
    }

    if (child.nodeName === KUBB_JSX) {
      const textChild = child.childNodes[0]
      const value = textChild?.nodeName === TEXT_NODE_NAME ? (textChild as DOMNode<{ nodeName: '#text' }>).nodeValue : ''
      if (value) result.push(createJsx(value))
      continue
    }
  }

  return result
}

/**
 * Yields every {@link SourceNode}, {@link ExportNode}, and {@link ImportNode}
 * within a `<kubb-file>` subtree in a single tree walk.
 *
 * Import and export elements are leaf nodes. Once yielded, the walker does not
 * recurse into them, which also prevents source collection from descending into
 * their subtrees. Dispatch on `.kind` (`'Source'`, `'Export'`, `'Import'`) to
 * separate the results.
 */
function* collectFileEntries(node: DOMElement): Generator<SourceNode | ExportNode | ImportNode> {
  for (const child of node.childNodes) {
    if (!child || child.nodeName === TEXT_NODE_NAME) continue

    if (child.nodeName === KUBB_SOURCE) {
      yield createSource({
        name: child.attributes['name']?.toString(),
        isTypeOnly: toBool(child.attributes['isTypeOnly']),
        isExportable: toBool(child.attributes['isExportable']),
        isIndexable: toBool(child.attributes['isIndexable']),
        nodes: collectCodeNodes(child),
      })
      continue
    }

    if (child.nodeName === KUBB_EXPORT) {
      yield createExport({
        name: child.attributes['name'] as ExportNode['name'],
        path: child.attributes['path'] as string,
        isTypeOnly: toBool(child.attributes['isTypeOnly']),
        asAlias: toBool(child.attributes['asAlias']),
      })
      continue
    }

    if (child.nodeName === KUBB_IMPORT) {
      yield createImport({
        name: child.attributes['name'] as ImportNode['name'],
        path: child.attributes['path'] as string,
        root: child.attributes['root'] as string | null | undefined,
        isTypeOnly: toBool(child.attributes['isTypeOnly']),
        isNameSpace: toBool(child.attributes['isNameSpace']),
      })
      continue
    }

    if (nodeNames.has(child.nodeName)) {
      yield* collectFileEntries(child)
    }
  }
}

/**
 * Runs a single {@link collectFileEntries} pass over a `<kubb-file>` DOM element
 * and assembles the result into a {@link FileNode}, bucketing each yielded
 * node by its `.kind`.
 */
function createFileNode(child: DOMElement): FileNode {
  const sources: Array<SourceNode> = []
  const exports: Array<ExportNode> = []
  const imports: Array<ImportNode> = []

  for (const node of collectFileEntries(child)) {
    if (node.kind === 'Source') {
      sources.push(node)
      continue
    }
    if (node.kind === 'Export') {
      exports.push(node)
      continue
    }
    imports.push(node)
  }

  return {
    baseName: child.attributes['baseName'],
    path: child.attributes['path'],
    meta: child.attributes['meta'] || {},
    footer: child.attributes['footer'],
    banner: child.attributes['banner'],
    sources,
    exports,
    imports,
  } as FileNode
}

/**
 * Yields each {@link FileNode} as it is encountered during the tree walk,
 * without collecting into an intermediate array. Callers can begin processing
 * each file before the rest of the tree is traversed.
 */
export function* streamFiles(node: DOMElement): Generator<FileNode> {
  for (const child of node.childNodes) {
    if (!child) continue

    if (child.nodeName !== TEXT_NODE_NAME && child.nodeName !== KUBB_FILE && nodeNames.has(child.nodeName)) {
      yield* streamFiles(child)
    }

    if (child.nodeName === KUBB_FILE && child.attributes['baseName'] !== undefined && child.attributes['path'] !== undefined) {
      yield createFileNode(child)
    }
  }
}

/**
 * Walk the virtual DOM tree rooted at `node` and convert every `<kubb-file>` element
 * into a {@link FileNode}, collecting its source blocks, imports, and exports.
 *
 * Returns the list of file nodes in document order. Nested files are supported;
 * the walker descends into non-file elements and recurses through them.
 */
export function collectFiles(node: DOMElement): Array<FileNode> {
  return [...streamFiles(node)]
}
