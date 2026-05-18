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
import React from 'react'
import type { KubbReactElement } from './types.ts'

// ── shared traversal ──────────────────────────────────────────────────────────

type OnText = (text: string) => void
type OnHost = (type: string, props: Record<string, unknown>) => void

/**
 * Walks `element`, resolving arrays, Fragments, and function components
 * transparently, then calls `onText` for primitive values and `onHost` for
 * every host element encountered. Pure function components are called
 * synchronously; hooks and class components are not supported.
 */
function eachElement(element: unknown, onText: OnText | null, onHost: OnHost): void {
  if (element == null || typeof element === 'boolean') return

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') {
    onText?.(String(element))
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) eachElement(child, onText, onHost)
    return
  }

  if (typeof element === 'object' && '$$typeof' in element) {
    const el = element as unknown as React.ReactElement
    const { type } = el
    const props = el.props as Record<string, unknown>

    if (type === React.Fragment) {
      eachElement(props['children'], onText, onHost)
    } else if (typeof type === 'function') {
      eachElement((type as (p: unknown) => unknown)(props), onText, onHost)
    } else if (typeof type === 'string') {
      onHost(type, props)
    }
  }
}

// ── level 3 / 2: code-node collection (inside kubb-source or nested code elements) ──

function collectCode(element: unknown, nodes: CodeNode[]): void {
  eachElement(element, (text) => {
    if (text.trim()) nodes.push(createText(text))
  }, (type, props) => onCodeHost(type, props, nodes))
}

function onCodeHost(type: string, props: Record<string, unknown>, nodes: CodeNode[]): void {
  if (type === 'br') {
    nodes.push(createBreak())
    return
  }

  if (type === 'kubb-jsx') {
    let value = ''
    eachElement(props['children'], (t) => { value += t }, () => {})
    if (value) nodes.push(createJsx(value))
    return
  }

  if (type === 'kubb-function') {
    const childNodes: CodeNode[] = []
    collectCode(props['children'], childNodes)
    nodes.push(
      createFunction({
        name: props['name'] as string,
        params: props['params'] as string | undefined,
        export: props['export'] as boolean | undefined,
        default: props['default'] as boolean | undefined,
        async: props['async'] as boolean | undefined,
        generics: props['generics'] as string | undefined,
        returnType: props['returnType'] as string | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | undefined,
        nodes: childNodes,
      }),
    )
    return
  }

  if (type === 'kubb-arrow-function') {
    const childNodes: CodeNode[] = []
    collectCode(props['children'], childNodes)
    nodes.push(
      createArrowFunction({
        name: props['name'] as string,
        params: props['params'] as string | undefined,
        export: props['export'] as boolean | undefined,
        default: props['default'] as boolean | undefined,
        async: props['async'] as boolean | undefined,
        generics: props['generics'] as string | undefined,
        returnType: props['returnType'] as string | undefined,
        singleLine: props['singleLine'] as boolean | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | undefined,
        nodes: childNodes,
      } as Omit<ArrowFunctionNode, 'kind'>),
    )
    return
  }

  if (type === 'kubb-const') {
    const childNodes: CodeNode[] = []
    collectCode(props['children'], childNodes)
    nodes.push(
      createConst({
        name: props['name'] as string,
        type: props['type'] as string | undefined,
        export: props['export'] as boolean | undefined,
        asConst: props['asConst'] as boolean | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | undefined,
        nodes: childNodes,
      }),
    )
    return
  }

  if (type === 'kubb-type') {
    const childNodes: CodeNode[] = []
    collectCode(props['children'], childNodes)
    nodes.push(
      createType({
        name: props['name'] as string,
        export: props['export'] as boolean | undefined,
        JSDoc: props['JSDoc'] as JSDocNode | undefined,
        nodes: childNodes,
      }),
    )
    return
  }
}

// ── level 1: file-child collection (inside kubb-file) ────────────────────────

function collectFileChildren(
  element: unknown,
  sources: SourceNode[],
  exports: ExportNode[],
  imports: ImportNode[],
): void {
  eachElement(
    element,
    (text) => {
      if (text.trim()) {
        throw new Error(`[react] '${text}' should be part of <File.Source> component when using the <File/> component`)
      }
    },
    (type, props) => {
      if (type === 'kubb-source') {
        const nodes: CodeNode[] = []
        collectCode(props['children'], nodes)
        sources.push(
          createSource({
            name: props['name']?.toString(),
            isTypeOnly: (props['isTypeOnly'] ?? false) as boolean,
            isExportable: (props['isExportable'] ?? false) as boolean,
            isIndexable: (props['isIndexable'] ?? false) as boolean,
            nodes,
          }),
        )
        return
      }

      if (type === 'kubb-export') {
        exports.push(
          createExport({
            name: props['name'] as ExportNode['name'],
            path: props['path'] as string,
            isTypeOnly: (props['isTypeOnly'] ?? false) as boolean,
            asAlias: (props['asAlias'] ?? false) as boolean,
          }),
        )
        return
      }

      if (type === 'kubb-import') {
        imports.push(
          createImport({
            name: props['name'] as ImportNode['name'],
            path: props['path'] as string,
            root: props['root'] as string | undefined,
            isTypeOnly: (props['isTypeOnly'] ?? false) as boolean,
            isNameSpace: (props['isNameSpace'] ?? false) as boolean,
          }),
        )
        return
      }

      // Any other host element: recurse into its children to find sources/exports/imports
      collectFileChildren(props['children'], sources, exports, imports)
    },
  )
}

// ── level 0: top-level file walker ────────────────────────────────────────────

function* walkFiles(element: unknown): Generator<FileNode> {
  if (element == null || typeof element === 'boolean') return

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') return

  if (Array.isArray(element)) {
    for (const child of element) yield* walkFiles(child)
    return
  }

  if (typeof element === 'object' && '$$typeof' in element) {
    const el = element as unknown as React.ReactElement
    const { type } = el
    const props = el.props as Record<string, unknown>

    if (type === React.Fragment) {
      yield* walkFiles(props['children'])
      return
    }

    if (typeof type === 'function') {
      yield* walkFiles((type as (p: unknown) => unknown)(props))
      return
    }

    if (typeof type === 'string') {
      if (type === 'kubb-file' && props['baseName'] !== undefined && props['path'] !== undefined) {
        const sources: SourceNode[] = []
        const fileExports: ExportNode[] = []
        const fileImports: ImportNode[] = []
        collectFileChildren(props['children'], sources, fileExports, fileImports)
        yield {
          baseName: props['baseName'],
          path: props['path'],
          meta: props['meta'] || {},
          footer: props['footer'],
          banner: props['banner'],
          sources,
          exports: fileExports,
          imports: fileImports,
        } as FileNode
        return
      }
      // Non-file host element: recurse into children to find nested files
      yield* walkFiles(props['children'])
    }
  }
}

// ── SyncRuntime ───────────────────────────────────────────────────────────────

/**
 * Synchronous JSX renderer that walks the element tree in a single pass,
 * producing {@link FileNode} objects directly without an intermediate virtual
 * DOM. No React fiber, scheduler, or work loop is involved.
 *
 * All components must be pure functions — hooks and class components are not
 * supported. Produces identical output to the React-backed {@link Runtime} at
 * approximately 2–4× the speed and a fraction of the allocations.
 */
export class SyncRuntime {
  /**
   * Accumulated {@link FileNode} results from every {@link render} call.
   */
  nodes: FileNode[] = []

  /**
   * Walks `element` synchronously, converts every `<kubb-file>` subtree into
   * a {@link FileNode} directly — no intermediate virtual DOM — and appends
   * the results to {@link nodes}.
   */
  render(element: KubbReactElement): void {
    for (const file of walkFiles(element)) {
      this.nodes.push(file)
    }
  }

  /**
   * Walks `element` synchronously and yields each {@link FileNode} as it is
   * produced, without buffering into an intermediate array first. Callers can
   * begin processing each file before the rest of the element tree is traversed.
   *
   * @example
   * ```ts
   * for (const file of runtime.stream(element)) {
   *   await writeFile(file)
   * }
   * ```
   */
  *stream(element: KubbReactElement): Generator<FileNode> {
    yield* walkFiles(element)
  }
}
