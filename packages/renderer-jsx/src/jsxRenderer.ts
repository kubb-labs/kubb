import { ast } from '@kubb/kit'
import { Fragment, isKubbElement, type JSX } from './jsx-runtime.ts'
import type { KubbReactElement } from './types.ts'

type HostTag = keyof JSX.IntrinsicElements
type HostProps = Record<string, unknown>
type HostElement = { [K in HostTag]: { type: K; props: JSX.IntrinsicElements[K] } }[HostTag]
type OnText = (text: string) => void
type OnHost = (host: HostElement) => void

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
      onHost({ type, props } as HostElement)
    }
  }
}

/** Returns the `children` prop of a host element, or `undefined` for tags without one. */
function childrenOf(host: HostElement): unknown {
  return 'children' in host.props ? host.props.children : undefined
}

type CodeTag = 'kubb-function' | 'kubb-arrow-function' | 'kubb-const' | 'kubb-type'
type CodeHost = Extract<HostElement, { type: CodeTag }>
type CodeFactories = {
  [K in CodeTag]: (props: Omit<JSX.IntrinsicElements[K], 'children'> & { nodes: Array<ast.CodeNode> }) => ast.CodeNode
}

const codeFactories: CodeFactories = {
  'kubb-function': ast.factory.createFunction,
  'kubb-arrow-function': ast.factory.createArrowFunction,
  'kubb-const': ast.factory.createConst,
  'kubb-type': ast.factory.createType,
}

function isCodeHost(host: HostElement): host is CodeHost {
  return host.type in codeFactories
}

function createCodeNode<K extends CodeTag>(type: K, props: JSX.IntrinsicElements[K]): ast.CodeNode {
  const { children, ...rest } = props

  return codeFactories[type]({ ...rest, nodes: collectCodeNodes(children) })
}

function collectCodeNodes(element: unknown): Array<ast.CodeNode> {
  const nodes: Array<ast.CodeNode> = []

  walkElement(
    element,
    (text) => {
      if (text.trim()) nodes.push(ast.factory.createText(text))
    },
    (host) => {
      if (host.type === 'br') {
        nodes.push(ast.factory.createBreak())
        return
      }

      if (host.type === 'kubb-jsx') {
        let value = ''
        walkElement(
          host.props.children,
          (t) => {
            value += t
          },
          () => {},
        )
        if (value) nodes.push(ast.factory.createJsx(value))
        return
      }

      if (isCodeHost(host)) {
        nodes.push(createCodeNode(host.type, host.props))
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
    (host) => {
      if (host.type === 'kubb-source') {
        const { name, isTypeOnly, isExportable, isIndexable, children } = host.props
        sources.push(
          ast.factory.createSource({
            name: name?.toString(),
            isTypeOnly: !!isTypeOnly,
            isExportable: !!isExportable,
            isIndexable: !!isIndexable,
            nodes: collectCodeNodes(children),
          }),
        )
        return
      }

      if (host.type === 'kubb-export') {
        const { name, path, isTypeOnly, asAlias } = host.props
        exports.push(ast.factory.createExport({ name, path, isTypeOnly: !!isTypeOnly, asAlias: !!asAlias }))
        return
      }

      if (host.type === 'kubb-import') {
        const { name, path, root, isTypeOnly, isNameSpace } = host.props
        imports.push(ast.factory.createImport({ name, path, root, isTypeOnly: !!isTypeOnly, isNameSpace: !!isNameSpace }))
        return
      }

      const nested = collectFileChildren(childrenOf(host))
      sources.push(...nested.sources)
      exports.push(...nested.exports)
      imports.push(...nested.imports)
    },
  )

  return { sources, exports, imports }
}

function createFileNode(props: JSX.IntrinsicElements['kubb-file']): ast.FileNode {
  const { sources, exports, imports } = collectFileChildren(props.children)
  // Not `ast.factory.createFile`: it prunes imports, which must wait until `FileManager` merged same-path fragments.
  const file: ast.UserFileNode = {
    baseName: props.baseName,
    path: props.path,
    meta: props.meta || {},
    footer: props.footer,
    banner: props.banner,
    copy: props.copy,
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
 * function. Hooks, suspense and class components are not supported.
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
      (host) => {
        if (host.type === 'kubb-file') {
          files.push(createFileNode(host.props))
          return
        }
        collectFiles(childrenOf(host))
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
