import { ast, type ArrowFunctionNode, type CodeNode, type ExportNode, type FileNode, type ImportNode, type JSDocNode, type SourceNode } from '@kubb/ast'
import { KUBB_ARROW_FUNCTION, KUBB_CONST, KUBB_EXPORT, KUBB_FILE, KUBB_FUNCTION, KUBB_IMPORT, KUBB_JSX, KUBB_SOURCE, KUBB_TYPE } from './constants.ts'
import { Fragment } from './jsx-runtime.ts'
import type { KubbReactElement } from './types.ts'

type OnText = (text: string) => void
type OnHost = (type: string, props: Record<string, unknown>) => void

/**
 * Walks `element`, resolving arrays, Fragments, and function components, then
 * calls `onText` for primitive values and `onHost` for each host element.
 * Function components are called synchronously. Hooks and class components are
 * not supported.
 */
function walkElement(element: unknown, onText: OnText, onHost: OnHost): void {
  if (element == null || typeof element === 'boolean') return

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') {
    onText(String(element))
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) walkElement(child, onText, onHost)
    return
  }

  if (typeof element === 'object' && '$$typeof' in element) {
    const el = element as unknown as KubbReactElement
    const { type } = el
    const props = el.props as Record<string, unknown>

    if (type === Fragment) {
      walkElement(props['children'], onText, onHost)
      return
    }
    if (typeof type === 'function') {
      walkElement((type as (p: unknown) => unknown)(props), onText, onHost)
      return
    }
    if (typeof type === 'string') {
      onHost(type, props)
    }
  }
}

function collectCodeNodes(props: Record<string, unknown>): Array<CodeNode> {
  const nodes: Array<CodeNode> = []
  collectCode(props['children'], nodes)

  return nodes
}

function collectCode(element: unknown, nodes: Array<CodeNode>): void {
  walkElement(
    element,
    (text) => {
      if (text.trim()) nodes.push(ast.factory.createText(text))
    },
    (type, props) => resolveCodeNode(type, props, nodes),
  )
}

function resolveCodeNode(type: string, props: Record<string, unknown>, nodes: Array<CodeNode>): void {
  if (type === 'br') {
    nodes.push(ast.factory.createBreak())
    return
  }

  if (type === KUBB_JSX) {
    let value = ''
    walkElement(
      props['children'],
      (t) => {
        value += t
      },
      () => {},
    )
    if (value) nodes.push(ast.factory.createJsx(value))
    return
  }

  if (type === KUBB_FUNCTION) {
    nodes.push(
      ast.factory.createFunction({
        name: props['name'] as string,
        params: props['params'] as string | null | undefined,
        export: props['export'] as boolean | null | undefined,
        default: props['default'] as boolean | null | undefined,
        async: props['async'] as boolean | null | undefined,
        generics: props['generics'] as string | Array<string> | null | undefined,
        returnType: props['returnType'] as string | null | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | null | undefined,
        nodes: collectCodeNodes(props),
      }),
    )
    return
  }

  if (type === KUBB_ARROW_FUNCTION) {
    nodes.push(
      ast.factory.createArrowFunction({
        name: props['name'] as string,
        params: props['params'] as string | null | undefined,
        export: props['export'] as boolean | null | undefined,
        default: props['default'] as boolean | null | undefined,
        async: props['async'] as boolean | null | undefined,
        generics: props['generics'] as string | Array<string> | null | undefined,
        returnType: props['returnType'] as string | null | undefined,
        singleLine: props['singleLine'] as boolean | null | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | null | undefined,
        nodes: collectCodeNodes(props),
      } as Omit<ArrowFunctionNode, 'kind'>),
    )
    return
  }

  if (type === KUBB_CONST) {
    nodes.push(
      ast.factory.createConst({
        name: props['name'] as string,
        type: props['type'] as string | null | undefined,
        export: props['export'] as boolean | null | undefined,
        asConst: props['asConst'] as boolean | null | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | null | undefined,
        nodes: collectCodeNodes(props),
      }),
    )
    return
  }

  if (type === KUBB_TYPE) {
    nodes.push(
      ast.factory.createType({
        name: props['name'] as string,
        export: props['export'] as boolean | null | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | null | undefined,
        nodes: collectCodeNodes(props),
      }),
    )
    return
  }
}

type FileChildren = { sources: Array<SourceNode>; exports: Array<ExportNode>; imports: Array<ImportNode> }

function collectFileChildren(element: unknown): FileChildren {
  const sources: Array<SourceNode> = []
  const exports: Array<ExportNode> = []
  const imports: Array<ImportNode> = []

  walkElement(
    element,
    (text) => {
      if (text.trim()) {
        throw new Error(`[react] '${text}' should be part of <File.Source> component when using the <File/> component`)
      }
    },
    (type, props) => {
      if (type === KUBB_SOURCE) {
        sources.push(
          ast.factory.createSource({
            name: props['name']?.toString(),
            isTypeOnly: !!props['isTypeOnly'],
            isExportable: !!props['isExportable'],
            isIndexable: !!props['isIndexable'],
            nodes: collectCodeNodes(props),
          }),
        )
        return
      }

      if (type === KUBB_EXPORT) {
        exports.push(
          ast.factory.createExport({
            name: props['name'] as ExportNode['name'],
            path: props['path'] as string,
            isTypeOnly: !!props['isTypeOnly'],
            asAlias: !!props['asAlias'],
          }),
        )
        return
      }

      if (type === KUBB_IMPORT) {
        imports.push(
          ast.factory.createImport({
            name: props['name'] as ImportNode['name'],
            path: props['path'] as string,
            root: props['root'] as string | null | undefined,
            isTypeOnly: !!props['isTypeOnly'],
            isNameSpace: !!props['isNameSpace'],
          }),
        )
        return
      }

      const nested = collectFileChildren(props['children'])
      sources.push(...nested.sources)
      exports.push(...nested.exports)
      imports.push(...nested.imports)
    },
  )

  return { sources, exports, imports }
}

function* walkFiles(element: unknown): Generator<FileNode> {
  if (element == null || typeof element === 'boolean') return

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') return

  if (Array.isArray(element)) {
    for (const child of element) yield* walkFiles(child)

    return
  }

  if (typeof element === 'object' && '$$typeof' in element) {
    const el = element as unknown as KubbReactElement
    const { type } = el
    const props = el.props as Record<string, unknown>

    if (type === Fragment) {
      yield* walkFiles(props['children'])
      return
    }

    if (typeof type === 'function') {
      yield* walkFiles((type as (p: unknown) => unknown)(props))
      return
    }

    if (typeof type === 'string') {
      if (type === KUBB_FILE && props['baseName'] !== undefined && props['path'] !== undefined) {
        const { sources, exports, imports } = collectFileChildren(props['children'])
        yield {
          baseName: props['baseName'],
          path: props['path'],
          meta: props['meta'] || {},
          footer: props['footer'],
          banner: props['banner'],
          copy: props['copy'],
          sources,
          exports,
          imports,
        } as FileNode
      } else {
        yield* walkFiles(props['children'])
      }
    }
  }
}

/**
 * Synchronous JSX renderer that walks the element tree in a single pass,
 * producing {@link FileNode} objects directly without an intermediate virtual
 * DOM. No React fiber, scheduler, or work loop is involved.
 *
 * All components must be pure functions. Hooks and class components are not
 * supported.
 */
export class Runtime {
  /**
   * Accumulated {@link FileNode} results from every {@link render} call.
   */
  nodes: Array<FileNode> = []

  /**
   * Walks `element` synchronously, converts every `<kubb-file>` subtree into
   * a {@link FileNode} with no intermediate virtual DOM, and appends the results
   * to {@link nodes}.
   */
  render(element: KubbReactElement): void {
    for (const file of walkFiles(element)) {
      this.nodes.push(file)
    }
  }
}
