import { createRequire } from 'node:module'
import { dirname, extname as getExtname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ast } from '@kubb/ast'
import { type ImportSpecifier, type ModuleExportName, parse, type ProgramStatement } from 'yuku-parser'

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

  const require = createRequire(import.meta.url)
  // Look in the user's project first: a strict package manager such as pnpm does not link it next to this package
  const paths = [process.cwd(), dirname(fileURLToPath(import.meta.url))]
  let typescript: TypeScript | undefined
  // `typescript` 5 and 6 ship the compiler API; next to TypeScript 7 it comes from `@typescript/typescript6`
  for (const name of ['typescript', '@typescript/typescript6']) {
    try {
      const candidate = require(require.resolve(name, { paths }))
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
  const cached = relativePaths.get(key)
  if (cached !== undefined) return cached

  const slashed = relative(dirname(root), filePath).replaceAll('\\', '/')
  const result = slashed.startsWith('../') ? slashed : `./${slashed}`
  if (relativePaths.size >= memoLimit) relativePaths.clear()
  relativePaths.set(key, result)
  return result
}

// The limit bounds what a long-running host keeps across builds into fresh roots; one build stays well under it.
const relativePaths = new Map<string, string>()
const memoLimit = 100_000

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
 * Converts an import specifier into an `ImportNode` name, keeping the quotes of a string-literal name (`{ 'a-b' as ab }`).
 */
function toImportName({ imported, local }: ImportSpecifier): string | { propertyName: string; name: string } {
  if (imported.type === nodeTypes.identifier && imported.name === local.name) return local.name

  return { propertyName: imported.type === nodeTypes.literal ? quoteModulePath(imported.value) : imported.name, name: local.name }
}

/**
 * Converts an `import` declaration into `ImportNode`s. Side-effect imports and imports with attributes or a phase stay as written.
 */
function toImportNodes(statement: ProgramStatement, filePath: string): Array<ast.ImportNode> {
  if (statement.type !== nodeTypes.importDeclaration || !statement.specifiers.length || statement.attributes.length || statement.phase) return []

  const specifier = statement.source.value
  const target = specifier.startsWith('.') ? { path: resolve(dirname(filePath), specifier), root: filePath } : { path: specifier }
  const isTypeOnly = statement.importKind === declarationKinds.type
  const nodes: Array<ast.ImportNode> = []
  const named = statement.specifiers.filter((element) => element.type === nodeTypes.importSpecifier)

  for (const element of statement.specifiers) {
    if (element.type === nodeTypes.importDefaultSpecifier) nodes.push(ast.factory.createImport({ name: element.local.name, ...target, isTypeOnly }))
    if (element.type === nodeTypes.importNamespaceSpecifier)
      nodes.push(ast.factory.createImport({ name: element.local.name, ...target, isTypeOnly, isNameSpace: true }))
  }
  const values = named.filter((element) => element.importKind !== declarationKinds.type)
  const types = named.filter((element) => element.importKind === declarationKinds.type)
  if (values.length) nodes.push(ast.factory.createImport({ name: values.map(toImportName), ...target, isTypeOnly }))
  if (types.length) nodes.push(ast.factory.createImport({ name: types.map(toImportName), ...target, isTypeOnly: true }))

  return nodes
}

/**
 * Converts an `export … from` declaration into `ExportNode`s. Forms `printExport` cannot print stay as written.
 */
function toExportNodes(statement: ProgramStatement): Array<ast.ExportNode> {
  if (statement.type !== nodeTypes.exportAllDeclaration && statement.type !== nodeTypes.exportNamedDeclaration) return []
  if (!statement.source || statement.attributes.length) return []

  const path = statement.source.value
  const isTypeOnly = statement.exportKind === declarationKinds.type

  if (statement.type === nodeTypes.exportAllDeclaration) {
    return [
      statement.exported
        ? ast.factory.createExport({ name: nameOf(statement.exported), path, isTypeOnly, asAlias: true })
        : ast.factory.createExport({ path, isTypeOnly }),
    ]
  }
  if (
    statement.specifiers.some(
      (element) =>
        element.exportKind === declarationKinds.type || element.exported.type === nodeTypes.literal || nameOf(element.exported) !== nameOf(element.local),
    )
  )
    return []

  return [ast.factory.createExport({ name: statement.specifiers.map((element) => nameOf(element.local)), path, isTypeOnly })]
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
    if (node.kind === ast.nodeKinds.break) {
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
 * Indents every non-empty line of `text` by two spaces.
 */
function indentLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : ''))
    .join('\n')
}

/**
 * Strips the common leading whitespace and the surrounding blank lines, counting tabs and spaces alike, so indented template literals start at column zero.
 */
function dedent(text: string): string {
  if (!text) return ''
  // Most text nodes are one line, so the common indent is its leading whitespace.
  if (!text.includes('\n')) return text.trim() ? text.trimStart() : ''

  const lines = text.split('\n')
  // -1 marks a blank line. A loop, not `Math.min(...indents)`, which overflows the stack on very long text.
  const indents: Array<number> = []
  let start = -1
  let end = -1
  let min = Infinity
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const indent = line.length - line.trimStart().length
    if (indent === line.length) {
      indents.push(-1)
      continue
    }
    indents.push(indent)
    if (start === -1) start = i
    end = i
    if (indent < min) min = indent
  }
  if (start === -1) return ''

  const out: Array<string> = []
  for (let i = start; i <= end; i++) out.push(indents[i] === -1 ? '' : lines[i]!.slice(min))
  return out.join('\n')
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
 * Converts a {@link ast.TypeNode} to a `type` alias, mirroring the `Type` component from `@kubb/renderer-jsx`.
 */
function printType(node: ast.TypeNode): string {
  const { name, export: canExport, JSDoc, nodes } = node

  const declaration = `${canExport ? 'export ' : ''}type ${name} = ${printNodes({ nodes, separator: '\n' })}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.FunctionNode} to a `function` declaration, mirroring the `Function` component from `@kubb/renderer-jsx`.
 */
function printFunction(node: ast.FunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes } = node

  const body = indentLines(printNodes({ nodes, separator: '\n' }))
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
  const arrowBody = singleLine ? ` => ${body}` : body ? ` => {\n${indentLines(body)}\n}` : ' => {}'
  const prefix = `${canExport ? 'export ' : ''}${isDefault ? 'default ' : ''}`
  const declaration = `${prefix}const ${name} = ${isAsync ? 'async ' : ''}${signature({ async: isAsync, generics, params, returnType })}${arrowBody}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Dispatches a {@link ast.CodeNode} to the printer for its `kind`.
 */
function printCodeNode(node: ast.CodeNode): string {
  switch (node.kind) {
    case ast.nodeKinds.break:
      return ''
    case ast.nodeKinds.text:
    case ast.nodeKinds.jsx:
      return dedent(node.value)
    case ast.nodeKinds.const:
      return printConst(node)
    case ast.nodeKinds.type:
      return printType(node)
    case ast.nodeKinds.function:
      return printFunction(node)
    case ast.nodeKinds.arrowFunction:
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

/**
 * Renders an `import` declaration (default, `* as`, or named with `{ a as b }`, each optionally `type`-only). `path` is used verbatim, so resolve it first.
 */
export function printImport({
  name,
  path,
  isTypeOnly = false,
  isNameSpace = false,
}: Pick<ast.ImportNode, 'name' | 'path' | 'isTypeOnly' | 'isNameSpace'>): string {
  const typePrefix = isTypeOnly ? 'type ' : ''
  const from = quoteModulePath(path)

  if (!Array.isArray(name)) {
    if (isNameSpace) return `import ${typePrefix}* as ${name} from ${from}`
    return `import ${typePrefix}${name} from ${from}`
  }

  const specifiers = name.map((item) => {
    if (typeof item === 'object') {
      return item.name ? `${item.propertyName} as ${item.name}` : item.propertyName
    }
    return item
  })

  return `import ${typePrefix}{ ${specifiers.join(', ')} } from ${from}`
}

/**
 * Renders an `export … from` declaration (named, `* as name`, or wildcard, each optionally `type`-only). `path` is used verbatim, so resolve it first.
 */
export function printExport({ path, name, isTypeOnly = false, asAlias = false }: Pick<ast.ExportNode, 'name' | 'path' | 'isTypeOnly' | 'asAlias'>): string {
  const typePrefix = isTypeOnly ? 'type ' : ''
  const from = quoteModulePath(path)

  if (Array.isArray(name)) {
    return `export ${typePrefix}{ ${name.join(', ')} } from ${from}`
  }

  if (asAlias && name) {
    // An identifier cannot start with a digit, so swap the digit for `_`
    const parsedName = /^\d/.test(name) ? `_${name.slice(1)}` : name
    return `export ${typePrefix}* as ${parsedName} from ${from}`
  }

  if (name) {
    return `export ${typePrefix}{ ${name} } from ${from}`
  }

  return `export ${typePrefix}* from ${from}`
}
