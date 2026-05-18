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

function bool(val: unknown): boolean {
  return (val ?? false) as boolean
}

/**
 * Collect the text and nested AST-node children of a single kubb-* element.
 *
 * `#text` children become raw text nodes; nested `kubb-function`, `kubb-const`,
 * `kubb-type`, and similar elements are converted into their respective {@link CodeNode}s.
 * Any unrecognized element names are silently skipped.
 */
function collectChildNodes(element: DOMElement): CodeNode[] {
  const result: CodeNode[] = []

  for (const child of element.childNodes) {
    if (!child) continue

    switch (child.nodeName) {
      case TEXT_NODE_NAME: {
        const text = (child as DOMNode<{ nodeName: '#text' }>).nodeValue
        if (text && text.trim()) result.push(createText(text))
        break
      }
      case 'br':
        result.push(createBreak())
        break
      case KUBB_FUNCTION: {
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
        break
      }
      case KUBB_ARROW_FUNCTION: {
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
        break
      }
      case KUBB_CONST: {
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
        break
      }
      case KUBB_TYPE: {
        const attrs = child.attributes
        result.push(
          createType({
            name: attrs['name'] as string,
            export: attrs['export'] as boolean | undefined,
            JSDoc: attrs['JSDoc'] as JSDocNode | undefined,
            nodes: collectChildNodes(child),
          }),
        )
        break
      }
      case KUBB_JSX: {
        const textChild = child.childNodes[0]
        const value = textChild?.nodeName === TEXT_NODE_NAME ? (textChild as DOMNode<{ nodeName: '#text' }>).nodeValue : ''
        if (value) result.push(createJsx(value))
        break
      }
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
function* walkFileChildren(node: DOMElement): Generator<SourceNode | ExportNode | ImportNode> {
  for (const child of node.childNodes) {
    if (!child || child.nodeName === TEXT_NODE_NAME) continue

    if (child.nodeName === KUBB_SOURCE) {
      yield createSource({
        name: child.attributes['name']?.toString(),
        isTypeOnly: bool(child.attributes['isTypeOnly']),
        isExportable: bool(child.attributes['isExportable']),
        isIndexable: bool(child.attributes['isIndexable']),
        nodes: collectChildNodes(child),
      })
      continue
    }

    if (child.nodeName === KUBB_EXPORT) {
      yield createExport({
        name: child.attributes['name'] as ExportNode['name'],
        path: child.attributes['path'] as string,
        isTypeOnly: bool(child.attributes['isTypeOnly']),
        asAlias: bool(child.attributes['asAlias']),
      })
      continue
    }

    if (child.nodeName === KUBB_IMPORT) {
      yield createImport({
        name: child.attributes['name'] as ImportNode['name'],
        path: child.attributes['path'] as string,
        root: child.attributes['root'] as string | undefined,
        isTypeOnly: bool(child.attributes['isTypeOnly']),
        isNameSpace: bool(child.attributes['isNameSpace']),
      })
      continue
    }

    if (nodeNames.has(child.nodeName)) {
      yield* walkFileChildren(child)
    }
  }
}

/**
 * Runs a single {@link walkFileChildren} pass over a `<kubb-file>` DOM element
 * and assembles the result into a {@link FileNode}, bucketing each yielded
 * node by its `.kind`.
 */
function buildFileNode(child: DOMElement): FileNode {
  const sources: SourceNode[] = []
  const exports: ExportNode[] = []
  const imports: ImportNode[] = []

  for (const node of walkFileChildren(child)) {
    if (node.kind === 'Source') sources.push(node)
    else if (node.kind === 'Export') exports.push(node)
    else imports.push(node)
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
      yield buildFileNode(child)
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
export function processFiles(node: DOMElement): FileNode[] {
  return [...streamFiles(node)]
}
