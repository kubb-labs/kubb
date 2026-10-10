import { createRequire } from 'node:module'
import { dirname, relative, resolve } from 'node:path'
import { toPosixPath, trimExtName } from '@internals/utils'
import { ast } from '@kubb/kit'
import type * as ts from 'typescript'

/**
 * Loaded with `require`, not `import`. When ESM imports a CommonJS package, Node keeps a second
 * copy of its source to detect named exports, and for TypeScript that copy is about 9 MB.
 */
const typescript: typeof ts = createRequire(import.meta.url)('typescript')

const { factory } = typescript

/**
 * Module specifier that imports `filePath` from the file at `root`: POSIX, relative to that file's directory, `./`-prefixed unless it climbs with `../`.
 */
export function getRelativePath(root: string, filePath: string): string {
  const slashed = toPosixPath(relative(dirname(root), filePath))
  return slashed.startsWith('../') ? slashed : `./${slashed}`
}

/**
 * Swaps the extension of a relative import/export path for `options.extname`; package specifiers and extension-less paths stay as-is.
 */
export function resolveOutputPath(path: string, options: { extname?: string } | undefined, rootAware: boolean): string {
  // Only the final `.<ext>` counts, so `foo.bar.ts` keeps `foo.bar`
  const hasExtname = /\.[^/.]+$/.test(path)
  if (rootAware && options?.extname && hasExtname) {
    return `${trimExtName(path)}${options.extname}`
  }
  return rootAware ? trimExtName(path) : path
}

/**
 * Converts an import specifier into an `ImportNode` name, keeping the quotes of a string-literal name (`{ 'a-b' as ab }`).
 */
function toImportName(element: ts.ImportSpecifier): string | { propertyName: string; name: string } {
  if (!element.propertyName) return element.name.text

  const { propertyName } = element
  return { propertyName: typescript.isStringLiteral(propertyName) ? quoteModulePath(propertyName.text) : propertyName.text, name: element.name.text }
}

/**
 * Converts an `import` declaration into `ImportNode`s. Side-effect imports and imports with attributes stay as written.
 */
function toImportNodes(statement: ts.Statement, filePath: string): Array<ast.ImportNode> {
  if (!typescript.isImportDeclaration(statement) || !statement.importClause || !typescript.isStringLiteral(statement.moduleSpecifier) || statement.attributes)
    return []

  const { name, namedBindings, phaseModifier } = statement.importClause
  const specifier = statement.moduleSpecifier.text
  const target = specifier.startsWith('.') ? { path: resolve(dirname(filePath), specifier), root: filePath } : { path: specifier }
  const isTypeOnly = phaseModifier === typescript.SyntaxKind.TypeKeyword
  const nodes: Array<ast.ImportNode> = []

  if (name) nodes.push(ast.factory.createImport({ name: name.text, ...target, isTypeOnly }))
  if (namedBindings && typescript.isNamespaceImport(namedBindings)) {
    nodes.push(ast.factory.createImport({ name: namedBindings.name.text, ...target, isTypeOnly, isNameSpace: true }))
  }
  if (namedBindings && typescript.isNamedImports(namedBindings)) {
    const values = namedBindings.elements.filter((element) => !element.isTypeOnly)
    const types = namedBindings.elements.filter((element) => element.isTypeOnly)
    if (values.length) nodes.push(ast.factory.createImport({ name: values.map(toImportName), ...target, isTypeOnly }))
    if (types.length) nodes.push(ast.factory.createImport({ name: types.map(toImportName), ...target, isTypeOnly: true }))
  }

  return nodes
}

/**
 * Converts an `export … from` declaration into `ExportNode`s. Forms `printExport` cannot print stay as written.
 */
function toExportNodes(statement: ts.Statement): Array<ast.ExportNode> {
  if (
    !typescript.isExportDeclaration(statement) ||
    !statement.moduleSpecifier ||
    !typescript.isStringLiteral(statement.moduleSpecifier) ||
    statement.attributes
  )
    return []

  const { exportClause, isTypeOnly } = statement
  const path = statement.moduleSpecifier.text

  if (!exportClause) return [ast.factory.createExport({ path, isTypeOnly })]
  if (typescript.isNamespaceExport(exportClause)) return [ast.factory.createExport({ name: exportClause.name.text, path, isTypeOnly, asAlias: true })]
  if (exportClause.elements.some((element) => element.propertyName || element.isTypeOnly || typescript.isStringLiteral(element.name))) return []

  return [ast.factory.createExport({ name: exportClause.elements.map((element) => element.name.text), path, isTypeOnly })]
}

type ModuleDeclarations = {
  header: string
  imports: Array<ast.ImportNode>
  exports: Array<ast.ExportNode>
  body: string
}

/**
 * Splits `source` into its lifted `import`/`export … from` nodes, the `header` above the first of them (shebang, directives, comments) and the remaining `body`.
 */
export function splitModuleDeclarations(source: string, filePath: string): ModuleDeclarations {
  const sourceFile = typescript.createSourceFile(filePath, source, typescript.ScriptTarget.Latest)
  const imports: Array<ast.ImportNode> = []
  const exports: Array<ast.ExportNode> = []
  let header = ''
  let body = ''
  let cursor = 0

  for (const statement of sourceFile.statements) {
    const importNodes = toImportNodes(statement, filePath)
    const exportNodes = toExportNodes(statement)
    if (!importNodes.length && !exportNodes.length) {
      // Lifted declarations print above the body, so stop at the first one that stays in place to keep the evaluation order.
      if (typescript.isImportDeclaration(statement) || (typescript.isExportDeclaration(statement) && statement.moduleSpecifier)) break
      continue
    }

    const text = source.slice(cursor, statement.getStart(sourceFile))
    if (imports.length || exports.length) body += text
    else header = text
    imports.push(...importNodes)
    exports.push(...exportNodes)
    cursor = statement.getEnd()
  }

  return { header: header.trim(), imports, exports, body: `${body}${source.slice(cursor)}`.trim() }
}

/**
 * Joins the printed `nodes` with `separator`; a `Break` node widens the next separator to a blank line and leading, trailing and consecutive breaks fold into one.
 *
 * Imperative on purpose: this runs once per source fragment and `map().filter().join()` showed up in deopt traces.
 */
function printNodes({ nodes, separator }: { nodes: Array<ast.CodeNode> | undefined; separator: '\n' | '\n\n' }): string {
  let result = ''
  let pendingBreak = false

  for (const node of nodes ?? []) {
    if (node.kind === 'Break') {
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
 * Strips the common leading whitespace and the surrounding blank lines, counting tabs and spaces alike, so indented template-literal content starts at column zero.
 */
function dedent(text: string): string {
  if (!text) return ''

  const lines = text.split('\n')
  const isBlank = (line: string) => line.trim() === ''

  const start = lines.findIndex((line) => !isBlank(line))
  if (start === -1) return ''
  const end = lines.findLastIndex((line) => !isBlank(line))

  const trimmed = lines.slice(start, end + 1)
  const indents = trimmed.filter((line) => !isBlank(line)).map((line) => line.match(/^\s*/)?.[0].length ?? 0)
  const min = indents.length ? Math.min(...indents) : 0

  return trimmed.map((line) => (isBlank(line) ? '' : line.slice(min))).join('\n')
}

type Signature = {
  async?: boolean | null
  generics?: ast.FunctionNode['generics'] | ast.ArrowFunctionNode['generics']
  params?: string | null
  returnType?: string | null
}

/**
 * Renders `<T>(params): ReturnType`; an async function wraps its return type in `Promise<>`.
 */
function signature({ async: isAsync, generics, params, returnType }: Signature): string {
  const genericsStr = generics ? `<${Array.isArray(generics) ? generics.join(', ') : generics}>` : ''
  const returnTypeStr = returnType ? (isAsync ? `: Promise<${returnType}>` : `: ${returnType}`) : ''

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
 * One printer serves every `print()` call; printing does not mutate the source file.
 */
const TS_PRINTER = typescript.createPrinter({
  omitTrailingSemicolon: true,
  newLine: typescript.NewLineKind.LineFeed,
  removeComments: false,
  noEmitHelpers: true,
})

/**
 * Print target for `printList`, which only reads its compiler options and language version.
 */
const PRINT_SOURCE_FILE = typescript.createSourceFile('print.tsx', '', typescript.ScriptTarget.ES2022, true, typescript.ScriptKind.TSX)

// Pre-warm the printer at module load. The first `printList` call lazily initializes
// the printer's internal string-builder and identifier tables. Doing it once at import
// time keeps that cost off the critical path for short-lived CLI builds.
TS_PRINTER.printList(typescript.ListFormat.MultiLine, factory.createNodeArray([]), PRINT_SOURCE_FILE)

/**
 * Converts TypeScript/TSX AST nodes to a string using the TypeScript printer.
 */
export function print(...elements: Array<ts.Node>): string {
  const filtered = elements.filter(Boolean)
  if (filtered.length === 0) return ''

  const output = TS_PRINTER.printList(typescript.ListFormat.MultiLine, factory.createNodeArray(filtered), PRINT_SOURCE_FILE)

  return output.replace(/\r\n/g, '\n')
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
    case 'Break':
      return ''
    case 'Text':
    case 'Jsx':
      return dedent(node.value)
    case 'Const':
      return printConst(node)
    case 'Type':
      return printType(node)
    case 'Function':
      return printFunction(node)
    case 'ArrowFunction':
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
