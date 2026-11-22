import { dedent, indent, memo } from '@internals/utils'
import { createRequire } from 'node:module'
import { dirname, extname as getExtname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ast } from '@kubb/ast'
import { type ImportSpecifier, type ModuleExportName, parse, type ProgramStatement } from 'yuku'

/**
 * A TypeScript compiler node, typed structurally so `@kubb/parser-ts` does not depend on `@typescript/typescript6`.
 *
 * @deprecated Pass printed strings to `print` instead. Support for compiler nodes is removed in the next major.
 */
export type TsNode = { readonly kind: number }

type Compiler = {
  printNodes: (nodes: Array<TsNode>) => string
}

let compiler: Compiler | undefined

// The parts of the TypeScript 6 API that printing compiler nodes uses, typed here so no package depends on it
type TypeScript = {
  createPrinter(options: { omitTrailingSemicolon: boolean; newLine: number; removeComments: boolean; noEmitHelpers: boolean }): {
    printList(format: number, list: unknown, sourceFile: unknown): string
  }
  createSourceFile(fileName: string, text: string, target: number, setParentNodes: boolean, kind: number): unknown
  factory: { createNodeArray(nodes: Array<TsNode>): unknown }
  NewLineKind: { LineFeed: number }
  ScriptTarget: { ES2022: number }
  ScriptKind: { TSX: number }
  ListFormat: { MultiLine: number }
}

/**
 * Loads TypeScript the first time `print` gets a compiler node. Strings never need it, so bundles for edge runtimes such as Cloudflare Workers leave it out.
 *
 * Loaded with `require`, not `import`: when ESM imports a CommonJS package, Node keeps a second copy of its source
 * to detect named exports, and for TypeScript that copy is about 9 MB.
 */
function loadCompiler(): Compiler {
  if (compiler) return compiler

  process.emitWarning(
    'Printing TypeScript compiler nodes with `print` from `@kubb/parser-ts` is deprecated and is removed in the next major. Return printed strings from printer handlers instead.',
    { type: 'DeprecationWarning', code: 'KUBB_PRINT_TS_NODE' },
  )

  const requireModule = createRequire(import.meta.url)
  // Look in the user's project first: a strict package manager such as pnpm does not link it next to this package
  const paths = [process.cwd(), dirname(fileURLToPath(import.meta.url))]
  let typescript: TypeScript | undefined
  // `typescript` 5 and 6 ship the compiler API; next to TypeScript 7 it comes from `@typescript/typescript6`
  for (const name of ['typescript', '@typescript/typescript6']) {
    try {
      const candidate = requireModule(requireModule.resolve(name, { paths }))
      if (typeof candidate.createPrinter === 'function') {
        typescript = candidate as TypeScript
        break
      }
    } catch {}
  }
  if (!typescript) {
    throw new Error(
      '`print` received a TypeScript compiler node, which needs `typescript` 5 or 6, or `@typescript/typescript6`, installed. Pass a printed string instead.',
    )
  }

  // One printer serves every call; printing does not mutate the source file, which only lends its compiler options
  const printer = typescript.createPrinter({
    omitTrailingSemicolon: true,
    newLine: typescript.NewLineKind.LineFeed,
    removeComments: false,
    noEmitHelpers: true,
  })
  const sourceFile = typescript.createSourceFile('print.tsx', '', typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TSX)

  compiler = {
    printNodes: (nodes) => printer.printList(typescript.ListFormat.MultiLine, typescript.factory.createNodeArray(nodes), sourceFile),
  }

  return compiler
}

/**
 * Module specifier that imports `filePath` from the file at `root`: POSIX, relative to that file's directory, `./`-prefixed unless it climbs with `../`.
 */
export function getRelativePath(root: string, filePath: string): string {
  // A relative input resolves against the working directory, so that directory is part of its key.
  const key = isAbsolute(root) && isAbsolute(filePath) ? `${root}\u0000${filePath}` : `${process.cwd()}\u0000${root}\u0000${filePath}`
  return memo(relativePaths, key, () => {
    const slashed = relative(dirname(root), filePath).replaceAll('\\', '/')
    return slashed.startsWith('../') ? slashed : `./${slashed}`
  })
}

// The limit bounds what a long-running host keeps across builds into fresh roots; one build stays well under it.
const relativePaths = memo.create<string, string>({ max: 100_000 })

/**
 * Swaps the extension of a relative import/export path for `extname`. Package specifiers and extension-less paths stay as-is.
 */
export function resolveOutputPath(path: string, extname: string | undefined, rootAware: boolean): string {
  if (!rootAware) return path
  const current = getExtname(path)
  return current ? `${path.slice(0, -current.length)}${extname ?? ''}` : path
}

/**
 * Node types this module reads from the yuku AST.
 */
const nodeTypes = {
  identifier: 'Identifier',
  literal: 'Literal',
  importDeclaration: 'ImportDeclaration',
  importSpecifier: 'ImportSpecifier',
  importDefaultSpecifier: 'ImportDefaultSpecifier',
  importNamespaceSpecifier: 'ImportNamespaceSpecifier',
  exportAllDeclaration: 'ExportAllDeclaration',
  exportNamedDeclaration: 'ExportNamedDeclaration',
} as const

/**
 * `importKind` and `exportKind` values this module reads from the yuku AST.
 */
const declarationKinds = {
  type: 'type',
} as const

function nameOf(node: ModuleExportName): string {
  return node.type === nodeTypes.literal ? node.value : node.name
}

/**
 * Converts an import specifier into a module name, keeping the quotes of a string-literal name (`{ 'a-b' as ab }`).
 */
function toModuleName({ imported, local }: ImportSpecifier): ast.ModuleName {
  if (imported.type === nodeTypes.identifier && imported.name === local.name) return { name: local.name }

  return { name: imported.type === nodeTypes.literal ? quoteModulePath(imported.value) : imported.name, alias: local.name }
}

/**
 * Converts an `import` declaration into `ImportNode`s. Side-effect imports and imports with attributes or a phase stay as written.
 */
function toImportNodes(statement: ProgramStatement, filePath: string): Array<ast.ImportNode> {
  if (statement.type !== nodeTypes.importDeclaration || !statement.specifiers.length || statement.attributes.length || statement.phase) return []

  const specifier = statement.source.value
  const target = specifier.startsWith('.') ? { path: resolve(dirname(filePath), specifier), root: filePath } : { path: specifier }
  const space: ast.Space = statement.importKind === declarationKinds.type ? 'type' : 'value'
  const names = statement.specifiers.map((element): ast.ModuleName => {
    if (element.type === nodeTypes.importDefaultSpecifier) return { name: 'default', alias: element.local.name, space }
    if (element.type === nodeTypes.importNamespaceSpecifier) return { name: '*', alias: element.local.name, space }
    return { ...toModuleName(element), space: element.importKind === declarationKinds.type ? 'type' : space }
  })

  return [ast.factory.createImport({ ...target, names })]
}

/**
 * Converts an `export … from` declaration into `ExportNode`s. Forms `printExport` cannot print stay as written.
 */
function toExportNodes(statement: ProgramStatement): Array<ast.ExportNode> {
  if (statement.type !== nodeTypes.exportAllDeclaration && statement.type !== nodeTypes.exportNamedDeclaration) return []
  if (!statement.source || statement.attributes.length) return []

  const path = statement.source.value
  const space: ast.Space = statement.exportKind === declarationKinds.type ? 'type' : 'value'

  if (statement.type === nodeTypes.exportAllDeclaration) {
    return [ast.factory.createExport({ path, names: [{ name: '*', ...(statement.exported ? { alias: nameOf(statement.exported) } : {}), space }] })]
  }
  if (
    statement.specifiers.some(
      (element) =>
        element.exportKind === declarationKinds.type || element.exported.type === nodeTypes.literal || nameOf(element.exported) !== nameOf(element.local),
    )
  )
    return []

  return [ast.factory.createExport({ path, names: statement.specifiers.map((element) => ({ name: nameOf(element.local), space })) })]
}

/**
 * Splits `source` into its lifted `import`/`export … from` nodes, the `header` above the first one (shebang, directives, comments) and the rest as `body`.
 */
export function splitModuleDeclarations(
  source: string,
  filePath: string,
): { header: string; imports: Array<ast.ImportNode>; exports: Array<ast.ExportNode>; body: string } {
  const { program } = parse(source, { lang: 'ts', sourceType: 'module' })
  const imports: Array<ast.ImportNode> = []
  const exports: Array<ast.ExportNode> = []
  let header = ''
  let body = ''
  let cursor = 0

  for (const statement of program.body) {
    const importNodes = toImportNodes(statement, filePath)
    const exportNodes = toExportNodes(statement)
    if (!importNodes.length && !exportNodes.length) {
      // Lifted declarations print above the body, so stop at the first one that stays in place to keep the evaluation order.
      if (
        statement.type === nodeTypes.importDeclaration ||
        ((statement.type === nodeTypes.exportNamedDeclaration || statement.type === nodeTypes.exportAllDeclaration) && statement.source)
      )
        break
      continue
    }

    const text = source.slice(cursor, statement.start)
    if (imports.length || exports.length) body += text
    else header = text
    imports.push(...importNodes)
    exports.push(...exportNodes)
    cursor = statement.end
  }

  return { header: header.trim(), imports, exports, body: `${body}${source.slice(cursor)}`.trim() }
}

/**
 * Joins the printed `nodes` with `separator`; a `Break` widens the next separator to a blank line, and leading, trailing and repeated breaks fold into one.
 *
 * Imperative on purpose: this runs once per source fragment and `map().filter().join()` showed up in deopt traces.
 */
function printNodes({ nodes, separator }: { nodes: Array<ast.CodeNode> | undefined; separator: '\n' | '\n\n' }): string {
  let result = ''
  let pendingBreak = false

  for (const node of nodes ?? []) {
    if (node.kind === ast.node.kinds.break) {
      pendingBreak = result !== ''
      continue
    }

    const text = printCodeNode(node)
    if (!text) continue

    if (result) result += pendingBreak ? '\n\n' : separator
    result += text
    pendingBreak = false
  }

  return result
}

/**
 * Renders `<T>(params): ReturnType`; an async function wraps its return type in `Promise<>`.
 */
function signature({ async: isAsync, generics, params, returnType }: Pick<ast.FunctionNode, 'async' | 'generics' | 'params' | 'returnType'>): string {
  const genericsStr = generics ? `<${Array.isArray(generics) ? generics.join(', ') : generics}>` : ''
  const wrapped = isAsync ? `Promise<${returnType}>` : returnType
  const returnTypeStr = returnType ? `: ${wrapped}` : ''

  return `${genericsStr}(${params ?? ''})${returnTypeStr}`
}

/**
 * Puts the JSDoc block, when it renders to something, above `declaration`.
 */
function withJSDoc({ jsDoc, declaration }: { jsDoc?: ast.JSDocNode | null; declaration: string }): string {
  const jsDocStr = jsDoc ? printJSDoc(jsDoc) : ''

  return jsDocStr ? `${jsDocStr}\n${declaration}` : declaration
}

/**
 * Joins printed code fragments with a newline.
 *
 * Passing TypeScript compiler nodes still works but is deprecated and needs `typescript` 5 or 6, or `@typescript/typescript6`, installed.
 * Support for compiler nodes is removed in the next major.
 */
export function print(...elements: Array<string | TsNode>): string {
  const filtered = elements.filter(Boolean)
  if (filtered.length === 0) return ''
  if (filtered.every((element) => typeof element === 'string')) return filtered.join('\n')
  // Printing compiler nodes as one list keeps the output byte-for-byte the same as before strings were accepted
  if (filtered.every((element) => typeof element !== 'string')) return loadCompiler().printNodes(filtered)

  return filtered.map((element) => (typeof element === 'string' ? element : loadCompiler().printNodes([element]).trimEnd())).join('\n')
}

/**
 * Converts a {@link ast.JSDocNode} to a `/** … *\/` block, dropping blank comments.
 */
function printJSDoc(jsDoc: ast.JSDocNode): string {
  const comments = (jsDoc.comments ?? []).filter((c) => c != null)
  if (comments.length === 0) return ''

  const lines = comments
    .flatMap((c) => c.split(/\r?\n/))
    .map((l) => l.replace(/\*\//g, '* /').replace(/\r/g, ''))
    .filter((l) => l.trim().length > 0)

  if (lines.length === 0) return ''

  return ['/**', ...lines.map((l) => ` * ${l}`), ' */'].join('\n')
}

/**
 * Converts a {@link ast.ConstNode} to a `const` declaration, mirroring the `Const` component from `@kubb/renderer-jsx`.
 */
function printConst(node: ast.ConstNode): string {
  const { name, export: canExport, type, JSDoc, asConst, nodes } = node

  const declaration = `${canExport ? 'export ' : ''}const ${name}${type ? `: ${type}` : ''} = ${printNodes({ nodes, separator: '\n' })}${asConst ? ' as const' : ''}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.TypeNode} to a `type` alias or an `interface`, mirroring the `Type` component from `@kubb/renderer-jsx`.
 */
function printType(node: ast.TypeNode): string {
  const { name, export: canExport, syntax, JSDoc, nodes } = node
  const body = printNodes({ nodes, separator: '\n' })

  const declaration = `${canExport ? 'export ' : ''}${syntax === 'interface' ? `interface ${name} ${body}` : `type ${name} = ${body}`}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.FunctionNode} to a `function` declaration, mirroring the `Function` component from `@kubb/renderer-jsx`.
 */
function printFunction(node: ast.FunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes } = node

  const body = indent({ text: printNodes({ nodes, separator: '\n' }) })
  const prefix = `${canExport ? 'export ' : ''}${isDefault ? 'default ' : ''}${isAsync ? 'async ' : ''}`
  const declaration = `${prefix}function ${name}${signature({ async: isAsync, generics, params, returnType })} {${body ? `\n${body}\n` : ''}}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts an {@link ast.ArrowFunctionNode} to a `const` arrow function, mirroring the `Function.Arrow` component from `@kubb/renderer-jsx`.
 */
function printArrowFunction(node: ast.ArrowFunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes, singleLine } = node

  const body = printNodes({ nodes, separator: '\n' })
  const arrowBody = singleLine ? ` => ${body}` : body ? ` => {\n${indent({ text: body })}\n}` : ' => {}'
  const prefix = `${canExport ? 'export ' : ''}${isDefault ? 'default ' : ''}`
  const declaration = `${prefix}const ${name} = ${isAsync ? 'async ' : ''}${signature({ async: isAsync, generics, params, returnType })}${arrowBody}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Dispatches a {@link ast.CodeNode} to the printer for its `kind`.
 */
function printCodeNode(node: ast.CodeNode): string {
  switch (node.kind) {
    case ast.node.kinds.break:
      return ''
    case ast.node.kinds.text:
    case ast.node.kinds.jsx:
      return dedent(node.value)
    case ast.node.kinds.const:
      return printConst(node)
    case ast.node.kinds.type:
      return printType(node)
    case ast.node.kinds.function:
      return printFunction(node)
    case ast.node.kinds.arrowFunction:
      return printArrowFunction(node)
  }
}

/**
 * Prints a {@link ast.SourceNode} with a blank line between its top-level nodes.
 */
export function printSource(node: ast.SourceNode): string {
  return printNodes({ nodes: node.nodes, separator: '\n\n' })
}

/**
 * Wraps a module specifier in single quotes, escaping embedded backslashes and quotes.
 */
function quoteModulePath(path: string): string {
  return `'${path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

// `{ a, b as c }`, with `type` before the braces when every name is a type, else before each type name.
function printNamed(names: ReadonlyArray<ast.ModuleName>): string {
  const allTypes = names.every((item) => item.space === 'type')
  const specifiers = names.map((item) => `${!allTypes && item.space === 'type' ? 'type ' : ''}${item.alias ? `${item.name} as ${item.alias}` : item.name}`)
  return `${allTypes ? 'type ' : ''}{ ${specifiers.join(', ')} }`
}

/**
 * Renders the `import` declarations for `names`: one per default or `* as` name, and one for the named members.
 * `path` is used verbatim, so resolve it first.
 */
export function printImport({ names, path }: { names: ReadonlyArray<ast.ModuleName>; path: string }): string {
  const from = quoteModulePath(path)
  const lines: Array<string> = []
  const named: Array<ast.ModuleName> = []
  for (const item of names) {
    const type = item.space === 'type' ? 'type ' : ''
    if (item.alias && item.name === '*') lines.push(`import ${type}* as ${item.alias} from ${from}`)
    else if (item.alias && item.name === 'default') lines.push(`import ${type}${item.alias} from ${from}`)
    // Without a local name, a default or whole-module import binds nothing, and `{ default }` does not parse.
    else if (item.name !== '*' && item.name !== 'default') named.push(item)
  }
  if (named.length) lines.push(`import ${printNamed(named)} from ${from}`)
  return lines.join('\n')
}

/**
 * Renders the `export … from` declarations for `names`: one per `*` name, as `export *` or `export * as`, and one
 * for the named members. `path` is used verbatim, so resolve it first.
 */
export function printExport({ names, path }: { names: ReadonlyArray<ast.ModuleName>; path: string }): string {
  const from = quoteModulePath(path)
  const lines = names
    .filter((item) => item.name === '*')
    .map((item) => {
      // An identifier cannot start with a digit, so swap the digit for `_`
      const alias = item.alias && (/^\d/.test(item.alias) ? `_${item.alias.slice(1)}` : item.alias)
      return `export ${item.space === 'type' ? 'type ' : ''}* ${alias ? `as ${alias} ` : ''}from ${from}`
    })
  const named = names.filter((item) => item.name !== '*')
  if (named.length) lines.push(`export ${printNamed(named)} from ${from}`)
  return lines.join('\n')
}
