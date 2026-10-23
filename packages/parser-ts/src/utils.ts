import { createRequire } from 'node:module'
import { dirname, extname as getExtname, relative, resolve } from 'node:path'
import { ast } from '@kubb/ast'

/**
 * A TypeScript compiler node, typed structurally so `@typescript/typescript6` stays an optional peer.
 *
 * @deprecated Pass printed strings to `print` instead. Support for compiler nodes is removed in the next major.
 */
export type TsNode = { readonly kind: number }

type Compiler = {
  printNodes: (nodes: Array<TsNode>) => string
}

let compiler: Compiler | undefined

/**
 * Loads TypeScript the first time `print` gets a compiler node. Strings never need it, so bundles for edge runtimes such as Cloudflare Workers leave it out.
 *
 * Loaded with `require`, not `import`: when ESM imports a CommonJS package, Node keeps a second copy of its source
 * to detect named exports, and for TypeScript that copy is about 9 MB.
 */
function loadCompiler(): Compiler {
  if (compiler) return compiler

  let typescript: typeof import('@typescript/typescript6')
  try {
    typescript = createRequire(import.meta.url)('@typescript/typescript6')
  } catch (cause) {
    throw new Error('`print` received a TypeScript compiler node, which needs `@typescript/typescript6` installed. Pass a printed string instead.', {
      cause,
    })
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
    printNodes: (nodes) =>
      printer.printList(
        typescript.ListFormat.MultiLine,
        typescript.factory.createNodeArray(nodes as Array<import('@typescript/typescript6').Node>),
        sourceFile,
      ),
  }

  return compiler
}

/**
 * Module specifier that imports `filePath` from the file at `root`: POSIX, relative to that file's directory, `./`-prefixed unless it climbs with `../`.
 */
export function getRelativePath(root: string, filePath: string): string {
  const slashed = relative(dirname(root), filePath).replaceAll('\\', '/')
  return slashed.startsWith('../') ? slashed : `./${slashed}`
}

/**
 * Swaps the extension of a relative import/export path for `extname`. Package specifiers and extension-less paths stay as-is.
 */
export function resolveOutputPath(path: string, extname: string | undefined, rootAware: boolean): string {
  if (!rootAware) return path
  const current = getExtname(path)
  return current ? `${path.slice(0, -current.length)}${extname ?? ''}` : path
}

type Token = { kind: 'word' | 'string' | 'punct'; text: string; value: string }

/**
 * Reads the tokens of `import` and `export … from` declarations: words, quoted strings and punctuation, skipping whitespace and comments.
 */
function createTokenizer(source: string) {
  const trivia = /(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\/)*/y
  const token = /([A-Za-z_$][\w$]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|([{},;*])/y
  let pos = 0

  function skipTrivia(): number {
    trivia.lastIndex = pos
    trivia.exec(source)
    pos = trivia.lastIndex
    return pos
  }

  function peek(): Token | undefined {
    const start = skipTrivia()
    token.lastIndex = start
    const match = token.exec(source)
    if (!match) return undefined
    if (match[1]) return { kind: 'word', text: match[1], value: match[1] }
    if (match[2]) return { kind: 'string', text: match[2], value: match[2].slice(1, -1).replace(/\\(.)/g, '$1') }
    return { kind: 'punct', text: match[3]!, value: match[3]! }
  }

  function next(): Token | undefined {
    const current = peek()
    if (current) pos += current.text.length
    return current
  }

  /** Consumes the next token when it is `text`. */
  function eat(text: string): boolean {
    if (peek()?.text !== text) return false
    pos += text.length
    return true
  }

  return {
    peek,
    next,
    eat,
    skipTrivia,
    get pos() {
      return pos
    },
    set pos(value: number) {
      pos = value
    },
  }
}

type Specifier = { name: Token; propertyName?: Token; isTypeOnly: boolean }

/**
 * Reads `{ a, type b, c as d, 'e-f' as g }` after the opening brace.
 */
function readSpecifiers(tokens: ReturnType<typeof createTokenizer>): Array<Specifier> | undefined {
  const specifiers: Array<Specifier> = []

  while (!tokens.eat('}')) {
    let first = tokens.next()
    let isTypeOnly = false
    const following = tokens.peek()
    if (first?.text === 'type' && following && following.text !== 'as' && following.text !== ',' && following.text !== '}') {
      isTypeOnly = true
      first = tokens.next()
    }
    if (!first || first.kind === 'punct') return undefined

    if (tokens.eat('as')) {
      const name = tokens.next()
      if (!name || name.kind === 'punct') return undefined
      specifiers.push({ name, propertyName: first, isTypeOnly })
    } else {
      specifiers.push({ name: first, isTypeOnly })
    }

    if (!tokens.eat(',') && tokens.peek()?.text !== '}') return undefined
  }

  return specifiers
}

/**
 * Reads `from '<path>'` and an optional `;`. Returns `undefined` for import attributes, which stay as written.
 */
function readFrom(tokens: ReturnType<typeof createTokenizer>): string | undefined {
  if (!tokens.eat('from')) return undefined
  const path = tokens.next()
  if (path?.kind !== 'string') return undefined
  const after = tokens.peek()?.text
  if (after === 'with' || after === 'assert') return undefined
  tokens.eat(';')
  return path.value
}

/**
 * Converts an import specifier into an `ImportNode` name, keeping the quotes of a string-literal name (`{ 'a-b' as ab }`).
 */
function toImportName({ name, propertyName }: Specifier): string | { propertyName: string; name: string } {
  if (!propertyName) return name.value

  return { propertyName: propertyName.kind === 'string' ? quoteModulePath(propertyName.value) : propertyName.value, name: name.value }
}

/**
 * Reads an `import` declaration after the `import` keyword. Side-effect imports and imports with attributes return `undefined` and stay as written.
 */
function readImport(tokens: ReturnType<typeof createTokenizer>, filePath: string): Array<ast.ImportNode> | undefined {
  let isTypeOnly = false
  let defaultName: string | undefined
  let namespace: string | undefined
  let specifiers: Array<Specifier> = []

  if (tokens.peek()?.text === 'type') {
    const save = tokens.pos
    tokens.next()
    const following = tokens.peek()?.text
    // `import type from './x'` imports a default named `type`
    if (following === 'from' || following === ',') tokens.pos = save
    else isTypeOnly = true
  }

  const first = tokens.peek()
  if (first?.kind === 'word') {
    defaultName = tokens.next()!.value
    if (!tokens.eat(',')) return finish()
  }
  if (tokens.eat('*')) {
    if (!tokens.eat('as')) return undefined
    const name = tokens.next()
    if (name?.kind !== 'word') return undefined
    namespace = name.value
  } else if (tokens.eat('{')) {
    const read = readSpecifiers(tokens)
    if (!read) return undefined
    specifiers = read
  } else {
    return undefined
  }

  return finish()

  function finish(): Array<ast.ImportNode> | undefined {
    const specifier = readFrom(tokens)
    if (specifier === undefined) return undefined

    const target = specifier.startsWith('.') ? { path: resolve(dirname(filePath), specifier), root: filePath } : { path: specifier }
    const nodes: Array<ast.ImportNode> = []

    if (defaultName) nodes.push(ast.factory.createImport({ name: defaultName, ...target, isTypeOnly }))
    if (namespace) nodes.push(ast.factory.createImport({ name: namespace, ...target, isTypeOnly, isNameSpace: true }))
    const values = specifiers.filter((element) => !element.isTypeOnly)
    const types = specifiers.filter((element) => element.isTypeOnly)
    if (values.length) nodes.push(ast.factory.createImport({ name: values.map(toImportName), ...target, isTypeOnly }))
    if (types.length) nodes.push(ast.factory.createImport({ name: types.map(toImportName), ...target, isTypeOnly: true }))

    return nodes
  }
}

/**
 * Reads an `export … from` declaration after the `export` keyword. Other exports and forms `printExport` cannot print return `undefined`.
 */
function readExport(tokens: ReturnType<typeof createTokenizer>): Array<ast.ExportNode> | undefined {
  const isTypeOnly = tokens.eat('type')

  if (tokens.eat('*')) {
    let name: string | undefined
    if (tokens.eat('as')) {
      const alias = tokens.next()
      if (alias?.kind !== 'word') return undefined
      name = alias.value
    }
    const path = readFrom(tokens)
    if (path === undefined) return undefined
    return [name ? ast.factory.createExport({ name, path, isTypeOnly, asAlias: true }) : ast.factory.createExport({ path, isTypeOnly })]
  }

  if (!tokens.eat('{')) return undefined
  const specifiers = readSpecifiers(tokens)
  const path = readFrom(tokens)
  if (!specifiers || path === undefined) return undefined
  if (specifiers.some((element) => element.propertyName || element.isTypeOnly || element.name.kind === 'string')) return undefined

  return [ast.factory.createExport({ name: specifiers.map((element) => element.name.value), path, isTypeOnly })]
}

/**
 * Splits `source` into its lifted `import`/`export … from` nodes, the `header` above the first one (shebang, directives, comments) and the rest as `body`.
 *
 * shortcut: only the leading block of declarations is lifted, so an import below the first other statement stays in the body; parse the whole module if a template ever needs that.
 */
export function splitModuleDeclarations(
  source: string,
  filePath: string,
): { header: string; imports: Array<ast.ImportNode>; exports: Array<ast.ExportNode>; body: string } {
  const tokens = createTokenizer(source)
  const imports: Array<ast.ImportNode> = []
  const exports: Array<ast.ExportNode> = []
  let header = ''
  let body = ''
  let cursor = 0

  if (source.startsWith('#!')) tokens.pos = source.indexOf('\n') === -1 ? source.length : source.indexOf('\n')

  while (true) {
    const start = tokens.skipTrivia()
    const keyword = tokens.next()

    // Directives such as `'use client'` belong to the header
    if (keyword?.kind === 'string' && !imports.length && !exports.length) {
      tokens.eat(';')
      continue
    }

    const nodes = keyword?.text === 'import' ? readImport(tokens, filePath) : keyword?.text === 'export' ? readExport(tokens) : undefined
    if (!nodes) break

    const text = source.slice(cursor, start)
    if (imports.length || exports.length) body += text
    else header = text
    for (const node of nodes) {
      if (node.kind === 'Import') imports.push(node)
      else exports.push(node)
    }
    cursor = tokens.pos
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
 * Strips the common leading whitespace and the surrounding blank lines, counting tabs and spaces alike, so indented template literals start at column zero.
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
 * Passing TypeScript compiler nodes still works but needs `@typescript/typescript6` installed.
 *
 * @deprecated Compiler nodes are deprecated; pass strings. Support for compiler nodes is removed in the next major.
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
