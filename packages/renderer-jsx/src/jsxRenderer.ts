import { ast } from '@kubb/ast'
import { Fragment, isKubbElement, type JSX } from './jsx-runtime.ts'
import type { KubbReactElement } from './types.ts'

type HostTag = keyof JSX.IntrinsicElements
type HostProps = Record<string, unknown>
type HostElement = { [K in HostTag]: { type: K; props: JSX.IntrinsicElements[K] } }[HostTag]

type CodeTag = 'kubb-function' | 'kubb-arrow-function' | 'kubb-const' | 'kubb-type'
type CodeFactories = {
  [K in CodeTag]: (props: Omit<JSX.IntrinsicElements[K], 'children'> & { nodes: Array<ast.CodeNode> }) => ast.CodeNode
}

const codeFactories: CodeFactories = {
  'kubb-function': ast.factory.createFunction,
  'kubb-arrow-function': ast.factory.createArrowFunction,
  'kubb-const': ast.factory.createConst,
  'kubb-type': ast.factory.createType,
}

type RootScope = { kind: 'root'; files: Array<ast.FileNode> }
type FileScope = { kind: 'file'; sources: Array<ast.SourceNode>; exports: Array<ast.ExportNode>; imports: Array<ast.ImportNode> }
type CodeScope = { kind: 'code'; nodes: Array<ast.CodeNode> }
type TextScope = { kind: 'text'; value: string }
/** Where the walk pushes what it finds: files at the root, sources inside a file, code nodes inside a source, raw text inside `kubb-jsx`. */
type Scope = RootScope | FileScope | CodeScope | TextScope

/** Walks `element` through arrays, Fragments and function components, pushing text and host elements into `scope`. */
function visit(element: unknown, scope: Scope): void {
  if (element == null || typeof element === 'boolean') return

  if (typeof element === 'string' || typeof element === 'number' || typeof element === 'bigint') {
    visitText(String(element), scope)
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) visit(child, scope)
    return
  }

  if (!isKubbElement(element)) return

  const { type } = element
  if (type === Fragment) {
    visit((element.props as HostProps)['children'], scope)
    return
  }
  if (typeof type === 'function') {
    visit((type as (p: unknown) => unknown)(element.props), scope)
    return
  }
  if (typeof type === 'string') {
    visitHost(element as unknown as HostElement, scope)
  }
}

function visitText(text: string, scope: Scope): void {
  switch (scope.kind) {
    case 'file':
      if (text.trim()) {
        throw new Error(`[jsx] '${text}' should be part of <File.Source> component when using the <File/> component`)
      }
      return
    case 'code':
      if (text.trim()) scope.nodes.push(ast.factory.createText(text))
      return
    case 'text':
      scope.value += text
      return
    case 'root':
      return
  }
}

function visitHost(host: HostElement, scope: Scope): void {
  switch (scope.kind) {
    case 'root':
      if (host.type === 'kubb-file') {
        scope.files.push(createFileNode(host.props))
        return
      }
      visit((host.props as HostProps)['children'], scope)
      return
    case 'file':
      visitFileHost(host, scope)
      return
    case 'code':
      visitCodeHost(host, scope)
      return
    case 'text':
      return
  }
}

function visitFileHost(host: HostElement, scope: FileScope): void {
  switch (host.type) {
    case 'kubb-source': {
      const { name, pointer, isTypeOnly, isExportable, isIndexable, inline, children } = host.props
      scope.sources.push(
        ast.factory.createSource({
          name: name?.toString(),
          ...(pointer !== undefined ? { pointer } : {}),
          isTypeOnly: !!isTypeOnly,
          isExportable: !!isExportable,
          isIndexable: !!isIndexable,
          ...(inline ? { inline } : {}),
          nodes: collectCodeNodes(children),
        }),
      )
      return
    }
    case 'kubb-export': {
      const { name, path, isTypeOnly, asAlias } = host.props
      scope.exports.push(ast.factory.createExport({ name, path, isTypeOnly: !!isTypeOnly, asAlias: !!asAlias }))
      return
    }
    case 'kubb-import': {
      const { name, path, root, isTypeOnly, isNameSpace } = host.props
      scope.imports.push(ast.factory.createImport({ name, path, root, isTypeOnly: !!isTypeOnly, isNameSpace: !!isNameSpace }))
      return
    }
    default:
      visit((host.props as HostProps)['children'], scope)
  }
}

function visitCodeHost(host: HostElement, scope: CodeScope): void {
  switch (host.type) {
    case 'br':
      scope.nodes.push(ast.factory.createBreak())
      return
    case 'kubb-jsx': {
      const text: TextScope = { kind: 'text', value: '' }
      visit(host.props.children, text)
      if (text.value) scope.nodes.push(ast.factory.createJsx(text.value))
      return
    }
    case 'kubb-function':
    case 'kubb-arrow-function':
    case 'kubb-const':
    case 'kubb-type':
      scope.nodes.push(createCodeNode(host.type, host.props))
      return
  }
}

function createCodeNode<K extends CodeTag>(type: K, props: JSX.IntrinsicElements[K]): ast.CodeNode {
  const { children, ...node } = props
  node.nodes = collectCodeNodes(children)

  return codeFactories[type](node as typeof node & { nodes: Array<ast.CodeNode> })
}

function collectCodeNodes(element: unknown): Array<ast.CodeNode> {
  const scope: CodeScope = { kind: 'code', nodes: [] }
  visit(element, scope)

  return scope.nodes
}

function collectFileChildren(element: unknown): FileScope {
  const scope: FileScope = { kind: 'file', sources: [], exports: [], imports: [] }
  visit(element, scope)

  return scope
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
  const scope: RootScope = { kind: 'root', files: [] }

  return {
    async render(element: KubbReactElement): Promise<void> {
      visit(element, scope)
    },
    get files() {
      return scope.files
    },
    [Symbol.dispose]() {},
  }
}
