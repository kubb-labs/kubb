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
 * Returns the module specifier that imports `filePath` from the file at `root`: a POSIX path
 * relative to that file's directory, prefixed with `./` unless it already climbs with `../`.
 */
export function getRelativePath(root: string, filePath: string): string {
  const slashed = toPosixPath(relative(dirname(root), filePath))
  return slashed.startsWith('../') ? slashed : `./${slashed}`
}

/**
 * Rewrites an import/export path so its extension matches the caller-supplied
 * `options.extname`. When the source path has no extension the original is kept,
 * so virtual/module-only paths flow through unchanged.
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

function isModuleDeclaration(statement: ts.Statement): boolean {
  return typescript.isImportDeclaration(statement) || (typescript.isExportDeclaration(statement) && Boolean(statement.moduleSpecifier))
}

type ModuleDeclarations = {
  header: string
  imports: Array<ast.ImportNode>
  exports: Array<ast.ExportNode>
  body: string
}

/**
 * Splits `source` into its top-level `import`/`export … from` declarations, as nodes, the `header` above the first of them
 * (shebang, directives, comments) and the remaining `body`.
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
      if (isModuleDeclaration(statement)) break
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
 * Serializes a `nodes` array into source text. Each entry is rendered via {@link printCodeNode}
 * and joined with a single newline. A `Break` node (`<br/>`) inserts one blank line between
 * statements. Consecutive breaks, and breaks at the very start or end, are folded into the
 * separator, so a double `<br/>` never emits more than one blank line.
 */
export function printNodes(nodes: Array<ast.CodeNode> | undefined): string {
  if (!nodes || nodes.length === 0) return ''

  let result = ''
  let hasContent = false
  let pendingBreak = false

  for (const node of nodes) {
    if (node.kind === 'Break') {
      if (hasContent) pendingBreak = true
      continue
    }

    const text = printCodeNode(node)
    if (!text) continue

    if (hasContent) result += pendingBreak ? '\n\n' : '\n'
    result += text
    hasContent = true
    pendingBreak = false
  }

  return result
}

/**
 * Indents every non-empty line of `text` by two spaces.
 */
export function indentLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : ''))
    .join('\n')
}

/**
 * Removes the common leading whitespace shared by every non-blank line and trims
 * surrounding blank lines, so multi-line content authored inside an indented template
 * literal lines up at a column-zero baseline. Leading whitespace is counted by
 * character, so N tabs and N spaces are treated as the same depth.
 *
 * @example
 * ```ts
 * dedent('\n    foo\n      bar\n    ')
 * // 'foo\n  bar'
 * ```
 */
export function dedent(text: string): string {
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
 * Renders `<T>(params): ReturnType` shared by function and arrow-function nodes. An async function
 * wraps its return type in `Promise<>`.
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
 * Module-scoped TypeScript printer instance. A printer does not mutate the source file, so one
 * instance is reused across every `print()` call instead of constructing a new printer each time.
 */
const TS_PRINTER = typescript.createPrinter({
  omitTrailingSemicolon: true,
  newLine: typescript.NewLineKind.LineFeed,
  removeComments: false,
  noEmitHelpers: true,
})

/**
 * Module-scoped source file used as the print target. `printList` only reads the source
 * file's compiler options / language version. It never mutates it.
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
 * Converts a {@link ast.JSDocNode} to a JSDoc comment block string.
 *
 * @example
 * ```ts
 * printJSDoc({ comments: ['@description A pet', '@deprecated'] })
 * // /**
 * //  * @description A pet
 * //  * @deprecated
 * //  *\/
 * ```
 */
export function printJSDoc(jsDoc: ast.JSDocNode): string {
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
 * Converts a {@link ast.ConstNode} to a TypeScript `const` declaration string.
 *
 * Mirrors the `Const` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printConst(factory.createConst({ name: 'pet', export: true, nodes: [factory.createText('{}')] }))
 * // 'export const pet = {}'
 * ```
 */
export function printConst(node: ast.ConstNode): string {
  const { name, export: canExport, type, JSDoc, asConst, nodes } = node

  const declaration = `${canExport ? 'export ' : ''}const ${name}${type ? `: ${type}` : ''} = ${printNodes(nodes)}${asConst ? ' as const' : ''}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.TypeNode} to a TypeScript `type` alias declaration string.
 *
 * Mirrors the `Type` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printType(factory.createType({ name: 'Pet', export: true, nodes: [factory.createText('{ id: number }')] }))
 * // 'export type Pet = { id: number }'
 * ```
 */
export function printType(node: ast.TypeNode): string {
  const { name, export: canExport, JSDoc, nodes } = node

  const declaration = `${canExport ? 'export ' : ''}type ${name} = ${printNodes(nodes)}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.FunctionNode} to a TypeScript `function` declaration string.
 *
 * Mirrors the `Function` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printFunction(factory.createFunction({ name: 'getPet', export: true, params: 'id: string', returnType: 'Pet', nodes: [factory.createText('return fetch(id)')] }))
 * // 'export function getPet(id: string): Pet {\n  return fetch(id)\n}'
 * ```
 */
export function printFunction(node: ast.FunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes } = node

  const body = indentLines(printNodes(nodes))
  const prefix = `${canExport ? 'export ' : ''}${isDefault ? 'default ' : ''}${isAsync ? 'async ' : ''}`
  const declaration = `${prefix}function ${name}${signature({ async: isAsync, generics, params, returnType })} {${body ? `\n${body}\n` : ''}}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts an {@link ast.ArrowFunctionNode} to a TypeScript arrow function declaration string.
 *
 * Mirrors the `Function.Arrow` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printArrowFunction(factory.createArrowFunction({ name: 'double', params: 'n: number', singleLine: true, nodes: [factory.createText('n * 2')] }))
 * // 'const double = (n: number) => n * 2'
 * ```
 */
export function printArrowFunction(node: ast.ArrowFunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes, singleLine } = node

  const body = printNodes(nodes)
  const arrowBody = singleLine ? ` => ${body}` : body ? ` => {\n${indentLines(body)}\n}` : ' => {}'
  const prefix = `${canExport ? 'export ' : ''}${isDefault ? 'default ' : ''}`
  const declaration = `${prefix}const ${name} = ${isAsync ? 'async ' : ''}${signature({ async: isAsync, generics, params, returnType })}${arrowBody}`

  return withJSDoc({ jsDoc: JSDoc, declaration })
}

/**
 * Converts a {@link ast.CodeNode} to its TypeScript string representation.
 *
 * Dispatches to the appropriate printer based on the node's `kind`.
 *
 * @example
 * ```ts
 * printCodeNode(factory.createConst({ name: 'x', nodes: [factory.createText('1')] }))
 * // 'const x = 1'
 * ```
 */
export function printCodeNode(node: ast.CodeNode): string {
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
 * Converts a {@link ast.SourceNode} to its TypeScript string representation.
 *
 * Iterates `nodes` in DOM order, rendering each {@link ast.CodeNode} via
 * {@link printCodeNode}.
 *
 * Top-level declarations are separated by a blank line so the source reads
 * cleanly without an external formatter.
 *
 * @example From nodes
 * ```ts
 * printSource({ kind: 'Source', nodes: [factory.createConst({ name: 'x', nodes: [factory.createText('1')] }), factory.createText('x.toString()')] })
 * // 'const x = 1\n\nx.toString()'
 * ```
 */
export function printSource(node: ast.SourceNode): string {
  const nodes = node.nodes

  if (!nodes || nodes.length === 0) return ''

  // Imperative join. `map().filter().join()` allocated a closure and two arrays per source, and
  // this runs once per source fragment during printing, so it surfaced in the deopt churn trace.
  let result = ''
  for (const child of nodes) {
    const text = printCodeNode(child as ast.CodeNode)
    if (!text) continue
    result = result ? `${result}\n\n${text}` : text
  }

  return result
}

/**
 * Wraps a module specifier in single quotes, escaping any embedded backslash or quote so the emitted
 * statement stays valid even for unusual paths.
 */
function quoteModulePath(path: string): string {
  return `'${path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/**
 * Renders an import declaration string in the repo style (single quotes, no semicolons), covering
 * default, namespace (`* as`), and named imports with `{ a as b }` aliases, each optionally
 * `type`-only. `path` is used verbatim, so resolve it first.
 *
 * @example
 * ```ts
 * printImport({ name: ['z'], path: './zod.ts' })
 * // "import { z } from './zod.ts'"
 * ```
 */
export function printImport({
  name,
  path,
  isTypeOnly = false,
  isNameSpace = false,
}: {
  name: string | Array<string | { propertyName: string; name?: string }>
  path: string
  isTypeOnly?: boolean | null
  isNameSpace?: boolean | null
}): string {
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
 * Renders an export declaration string in the repo style (single quotes, no semicolons), covering
 * named re-exports, namespace alias (`* as name`), and wildcard, each optionally `type`-only.
 * `path` is used verbatim, so resolve it first.
 *
 * @example
 * ```ts
 * printExport({ name: ['Pet', 'Order'], path: './models.ts' })
 * // "export { Pet, Order } from './models.ts'"
 * ```
 */
export function printExport({
  path,
  name,
  isTypeOnly = false,
  asAlias = false,
}: {
  path: string
  name?: string | Array<ts.Identifier | string> | null
  isTypeOnly?: boolean | null
  asAlias?: boolean | null
}): string {
  const typePrefix = isTypeOnly ? 'type ' : ''
  const from = quoteModulePath(path)

  if (Array.isArray(name)) {
    const specifiers = name.map((item) => (typeof item === 'string' ? item : item.text))
    return `export ${typePrefix}{ ${specifiers.join(', ')} } from ${from}`
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
