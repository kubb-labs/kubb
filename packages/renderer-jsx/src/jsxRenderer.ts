import { ast } from '@kubb/kit'
import { Fragment, isKubbElement, type JSX } from './jsx-runtime.ts'
import type { KubbReactElement } from './types.ts'

type HostTag = keyof JSX.IntrinsicElements
type HostProps = Record<string, unknown>
type OnText = (text: string) => void
type OnHost = (type: HostTag, props: HostProps) => void

/** Walks `element` through arrays, Fragments and function components, calling `onText` and `onHost`. */
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

  if (isKubbElement(element)) {
    const { type } = element
    const props = element.props as HostProps

    if (type === Fragment) {
      walkElement(props['children'], onText, onHost)
      return
    }
    if (typeof type === 'function') {
      walkElement((type as (p: unknown) => unknown)(props), onText, onHost)
      return
    }
    if (typeof type === 'string') {
      onHost(type as HostTag, props)
    }
  }
}

type CodeFactory = (input: HostProps) => ast.CodeNode

// Each component passes its tag's full key set in node field order, so the spread matches `ast.factory`.
const codeFactories: Partial<Record<HostTag, CodeFactory>> = {
  'kubb-function': ast.factory.createFunction as CodeFactory,
  'kubb-arrow-function': ast.factory.createArrowFunction as CodeFactory,
  'kubb-const': ast.factory.createConst as CodeFactory,
  'kubb-type': ast.factory.createType as CodeFactory,
}

function collectCodeNodes(element: unknown): Array<ast.CodeNode> {
  const nodes: Array<ast.CodeNode> = []

  walkElement(
    element,
    (text) => {
      if (text.trim()) nodes.push(ast.factory.createText(text))
    },
    (type, props) => {
      if (type === 'br') {
        nodes.push(ast.factory.createBreak())
        return
      }

      if (type === 'kubb-jsx') {
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

      const factory = codeFactories[type]
      if (factory) {
        const { children, ...rest } = props
        nodes.push(factory({ ...rest, nodes: collectCodeNodes(children) }))
      }
    },
  )

  return nodes
}

type FileChildren = { sources: Array<ast.SourceNode>; exports: Array<ast.ExportNode>; imports: Array<ast.ImportNode> }

function collectFileChildren(element: unknown): FileChildren {
  const sources: Array<ast.SourceNode> = []
  const exports: Array<ast.ExportNode> = []
  const imports: Array<ast.ImportNode> = []

  walkElement(
    element,
    (text) => {
      if (text.trim()) {
        throw new Error(`[jsx] '${text}' should be part of <File.Source> component when using the <File/> component`)
      }
    },
    (type, props) => {
      if (type === 'kubb-source') {
        sources.push(
          ast.factory.createSource({
            name: props['name']?.toString(),
            isTypeOnly: !!props['isTypeOnly'],
            isExportable: !!props['isExportable'],
            isIndexable: !!props['isIndexable'],
            nodes: collectCodeNodes(props['children']),
          }),
        )
        return
      }

      if (type === 'kubb-export') {
        exports.push(
          ast.factory.createExport({
            name: props['name'] as ast.ExportNode['name'],
            path: props['path'] as string,
            isTypeOnly: !!props['isTypeOnly'],
            asAlias: !!props['asAlias'],
          }),
        )
        return
      }

      if (type === 'kubb-import') {
        imports.push(
          ast.factory.createImport({
            name: props['name'] as ast.ImportNode['name'],
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

function createFileNode(props: HostProps): ast.FileNode {
  const { sources, exports, imports } = collectFileChildren(props['children'])
  // Not `ast.factory.createFile`: it prunes imports, which must wait until `FileManager` merged same-path fragments.
  const file: ast.UserFileNode = {
    baseName: props['baseName'] as ast.FileNode['baseName'],
    path: props['path'] as string,
    meta: (props['meta'] as ast.FileNode['meta']) || {},
    footer: props['footer'] as ast.FileNode['footer'],
    banner: props['banner'] as ast.FileNode['banner'],
    copy: props['copy'] as ast.FileNode['copy'],
    sources,
    exports,
    imports,
  }

  return file as unknown as ast.FileNode
}

/**
 * Factory for a renderer that walks the JSX tree in a single recursive pass,
 * with no React reconciler or scheduler. Pass it as the `renderer` property on
 * `defineGenerator`. Kubb core calls the factory once per render cycle and stays
 * generic, with no hard dependency on `@kubb/renderer-jsx`. Every component must be a pure
 * function; hooks, suspense and class components are not supported.
 *
 * @example Wire up a JSX generator
 * ```tsx
 * import { defineGenerator } from '@kubb/core'
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const myGenerator = defineGenerator<PluginTs>({
 *   name: 'types',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     return (
 *       <File baseName="output.ts" path={`${ctx.root}/output.ts`}>
 *         <Type node={node} resolver={ctx.resolver} />
 *       </File>
 *     )
 *   },
 * })
 * ```
 */
export const jsxRenderer = () => {
  const files: Array<ast.FileNode> = []

  function collectFiles(element: unknown): void {
    walkElement(
      element,
      () => {},
      (type, props) => {
        if (type === 'kubb-file') {
          files.push(createFileNode(props))
          return
        }
        collectFiles(props['children'])
      },
    )
  }

  return {
    async render(element: KubbReactElement): Promise<void> {
      collectFiles(element)
    },
    get files() {
      return files
    },
    [Symbol.dispose]() {},
  }
}
