import { normalize, relative } from 'node:path'
import { trimExtName } from '@internals/utils'
import type { ArrowFunctionNode, CodeNode, ConstNode, FunctionNode, JSDocNode, JsxNode, SourceNode, TextNode, TypeNode } from '@kubb/ast'
import ts from 'typescript'
import {
  CARRIAGE_RETURN_PATTERN,
  CRLF_PATTERN,
  CURRENT_DIRECTORY_PREFIX,
  FILE_EXTENSION_PATTERN,
  INDENT,
  INDENT_CHAR,
  JSDOC_TERMINATOR_PATTERN,
  LEADING_DIGIT_PATTERN,
  PARENT_DIRECTORY_PREFIX,
  WINDOWS_PATH_SEPARATOR,
} from './constants.ts'

const { factory } = ts

/**
 * Resolves `filePath` relative to `rootDir` and returns a POSIX-style path
 * prefixed with `./` when the target sits inside the root, or `../` when it escapes it.
 */
export function getRelativePath(rootDir: string, filePath: string): string {
  const rel = relative(rootDir, filePath)
  const slashed = normalize(rel).replaceAll(WINDOWS_PATH_SEPARATOR, '/').replace(PARENT_DIRECTORY_PREFIX, '')
  return slashed.startsWith(PARENT_DIRECTORY_PREFIX) ? slashed : `${CURRENT_DIRECTORY_PREFIX}${slashed}`
}

/**
 * Rewrites an import/export path so its extension matches the caller-supplied
 * `options.extname`. When the source path has no extension the original is kept,
 * so virtual/module-only paths flow through unchanged.
 */
export function resolveOutputPath(path: string, options: { extname?: string } | undefined, rootAware: boolean): string {
  const hasExtname = FILE_EXTENSION_PATTERN.test(path)
  if (options?.extname && hasExtname) {
    return `${trimExtName(path)}${options.extname}`
  }
  return rootAware ? trimExtName(path) : path
}

/**
 * Serializes a `nodes` array into source text. Each entry is rendered via {@link printCodeNode}
 * and joined with a single newline. A `Break` node (`<br/>`) inserts one blank line between
 * statements. Consecutive breaks, and breaks at the very start or end, are folded into the
 * separator, so a double `<br/>` never emits more than one blank line.
 */
export function printNodes(nodes: Array<CodeNode> | undefined): string {
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
 * Indents every non-empty line of `text` by one indent unit. Pass a number to repeat
 * {@link INDENT_CHAR} that many times, or a string to use as the indent verbatim.
 */
export function indentLines(text: string, indent: number | string = INDENT): string {
  if (!text) return ''
  const pad = typeof indent === 'string' ? indent : INDENT_CHAR.repeat(indent)
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : ''))
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

/**
 * Renders the generic clause (`<T, U>`) shared by function and arrow-function nodes.
 * Accepts either a raw string (rendered verbatim) or an array of type-parameter names.
 */
export function formatGenerics(generics: FunctionNode['generics'] | ArrowFunctionNode['generics']): string {
  if (!generics) return ''
  return `<${Array.isArray(generics) ? generics.join(', ') : generics}>`
}

/**
 * Renders the return-type suffix (`: T` or `: Promise<T>` when `isAsync` is true).
 * Returns an empty string when no return type is provided.
 */
export function formatReturnType(returnType: string | null | undefined, isAsync: boolean | null | undefined): string {
  if (!returnType) return ''
  return isAsync ? `: Promise<${returnType}>` : `: ${returnType}`
}

/**
 * Module-scoped TypeScript printer instance. A printer does not mutate the source file, so one
 * instance is reused across every `print()` call instead of constructing a new printer each time.
 */
const TS_PRINTER = ts.createPrinter({
  omitTrailingSemicolon: true,
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  noEmitHelpers: true,
})

/**
 * Module-scoped source file used as the print target. `printList` only reads the source
 * file's compiler options / language version. It never mutates it.
 */
const PRINT_SOURCE_FILE = ts.createSourceFile('print.tsx', '', ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)

// Pre-warm the printer at module load. The first `printList` call lazily initializes
// the printer's internal string-builder and identifier tables. Doing it once at import
// time keeps that cost off the critical path for short-lived CLI builds.
TS_PRINTER.printList(ts.ListFormat.MultiLine, factory.createNodeArray([]), PRINT_SOURCE_FILE)

/**
 * Converts TypeScript/TSX AST nodes to a string using the TypeScript printer.
 */
export function print(...elements: Array<ts.Node>): string {
  const filtered = elements.filter(Boolean)
  if (filtered.length === 0) return ''

  const output = TS_PRINTER.printList(ts.ListFormat.MultiLine, factory.createNodeArray(filtered), PRINT_SOURCE_FILE)

  return output.replace(CRLF_PATTERN, '\n')
}

/**
 * Converts a {@link JSDocNode} to a JSDoc comment block string.
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
export function printJSDoc(jsDoc: JSDocNode): string {
  const comments = (jsDoc.comments ?? []).filter((c) => c != null)
  if (comments.length === 0) return ''

  const lines = comments
    .flatMap((c) => c.split(/\r?\n/))
    .map((l) => l.replace(JSDOC_TERMINATOR_PATTERN, '* /').replace(CARRIAGE_RETURN_PATTERN, ''))
    .filter((l) => l.trim().length > 0)

  if (lines.length === 0) return ''

  return ['/**', ...lines.map((l) => ` * ${l}`), ' */'].join('\n')
}

/**
 * Converts a {@link ConstNode} to a TypeScript `const` declaration string.
 *
 * Mirrors the `Const` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printConst(factory.createConst({ name: 'pet', export: true, nodes: ['{}'] }))
 * // 'export const pet = {}'
 * ```
 *
 * @example With type and `as const`
 * ```ts
 * printConst(factory.createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true, nodes: ['[]'] }))
 * // 'export const pets: Pet[] = [] as const'
 * ```
 */
export function printConst(node: ConstNode): string {
  const { name, export: canExport, type, JSDoc, asConst, nodes } = node

  const jsDocStr = JSDoc ? printJSDoc(JSDoc) : ''
  const body = printNodes(nodes)

  const parts: Array<string> = []
  if (canExport) parts.push('export ')
  parts.push('const ')
  parts.push(name)
  if (type) {
    parts.push(`: ${type}`)
  }
  parts.push(' = ')
  parts.push(body)
  if (asConst) parts.push(' as const')

  const declaration = parts.join('')
  return [jsDocStr, declaration].filter(Boolean).join('\n')
}

/**
 * Converts a {@link TypeNode} to a TypeScript `type` alias declaration string.
 *
 * Mirrors the `Type` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printType(factory.createType({ name: 'Pet', export: true, nodes: ['{ id: number }'] }))
 * // 'export type Pet = { id: number }'
 * ```
 */
export function printType(node: TypeNode): string {
  const { name, export: canExport, JSDoc, nodes } = node

  const jsDocStr = JSDoc ? printJSDoc(JSDoc) : ''
  const body = printNodes(nodes)

  const parts: Array<string> = []
  if (canExport) parts.push('export ')
  parts.push('type ')
  parts.push(name)
  parts.push(' = ')
  parts.push(body)

  const declaration = parts.join('')
  return [jsDocStr, declaration].filter(Boolean).join('\n')
}

/**
 * Converts a {@link FunctionNode} to a TypeScript `function` declaration string.
 *
 * Mirrors the `Function` component from `@kubb/renderer-jsx`.
 *
 * @example
 * ```ts
 * printFunction(factory.createFunction({ name: 'getPet', export: true, params: 'id: string', returnType: 'Pet', nodes: ['return fetch(id)'] }))
 * // 'export function getPet(id: string): Pet {\n  return fetch(id)\n}'
 * ```
 *
 * @example Async with generics
 * ```ts
 * printFunction(factory.createFunction({ name: 'fetchPet', export: true, async: true, generics: ['T'], params: 'id: string', returnType: 'T' }))
 * // 'export async function fetchPet<T>(id: string): Promise<T> {\n}'
 * ```
 */
export function printFunction(node: FunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes } = node

  const jsDocStr = JSDoc ? printJSDoc(JSDoc) : ''
  const body = printNodes(nodes)
  const indented = body ? indentLines(body) : ''

  const parts: Array<string> = []
  if (canExport) parts.push('export ')
  if (isDefault) parts.push('default ')
  if (isAsync) parts.push('async ')
  parts.push('function ')
  parts.push(name)
  parts.push(formatGenerics(generics))
  parts.push(`(${params ?? ''})`)
  parts.push(formatReturnType(returnType, isAsync))
  parts.push(' {')
  if (indented) {
    parts.push(`\n${indented}\n`)
  }
  parts.push('}')

  const declaration = parts.join('')
  return [jsDocStr, declaration].filter(Boolean).join('\n')
}

/**
 * Converts an {@link ArrowFunctionNode} to a TypeScript arrow function declaration string.
 *
 * Mirrors the `Function.Arrow` component from `@kubb/renderer-jsx`.
 *
 * @example Multi-line arrow function
 * ```ts
 * printArrowFunction(factory.createArrowFunction({ name: 'getPet', export: true, params: 'id: string', nodes: ['return fetch(id)'] }))
 * // 'export const getPet = (id: string) => {\n  return fetch(id)\n}'
 * ```
 *
 * @example Single-line arrow function
 * ```ts
 * printArrowFunction(factory.createArrowFunction({ name: 'double', params: 'n: number', singleLine: true, nodes: ['n * 2'] }))
 * // 'const double = (n: number) => n * 2'
 * ```
 */
export function printArrowFunction(node: ArrowFunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes, singleLine } = node

  const jsDocStr = JSDoc ? printJSDoc(JSDoc) : ''
  const body = printNodes(nodes)
  const arrowBody = singleLine ? ` => ${body}` : body ? ` => {\n${indentLines(body)}\n}` : ' => {}'

  const parts: Array<string> = []
  if (canExport) parts.push('export ')
  if (isDefault) parts.push('default ')
  parts.push('const ')
  parts.push(name)
  parts.push(' = ')
  if (isAsync) parts.push('async ')
  parts.push(formatGenerics(generics))
  parts.push(`(${params ?? ''})`)
  parts.push(formatReturnType(returnType, isAsync))
  parts.push(arrowBody)

  const declaration = parts.join('')
  return [jsDocStr, declaration].filter(Boolean).join('\n')
}

/**
 * Converts a {@link CodeNode} to its TypeScript string representation.
 *
 * Dispatches to the appropriate printer based on the node's `kind`.
 *
 * @example
 * ```ts
 * printCodeNode(factory.createConst({ name: 'x', nodes: ['1'] }))
 * // 'const x = 1'
 * ```
 */
export function printCodeNode(node: CodeNode): string {
  if (node.kind === 'Break') return ''
  if (node.kind === 'Text') return dedent((node as TextNode).value)
  if (node.kind === 'Jsx') return dedent((node as JsxNode).value)
  if (node.kind === 'Const') return printConst(node)
  if (node.kind === 'Type') return printType(node)
  if (node.kind === 'Function') return printFunction(node)
  if (node.kind === 'ArrowFunction') return printArrowFunction(node)
  return ''
}

/**
 * Converts a {@link SourceNode} to its TypeScript string representation.
 *
 * Iterates `nodes` in DOM order, rendering each {@link CodeNode} via
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
export function printSource(node: SourceNode): string {
  const nodes = node.nodes

  if (!nodes || nodes.length === 0) return ''

  // Imperative join. `map().filter().join()` allocated a closure and two arrays per source, and
  // this runs once per source fragment during printing, so it surfaced in the deopt churn trace.
  let result = ''
  for (const child of nodes) {
    const text = printCodeNode(child as CodeNode)
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
    const parsedName = LEADING_DIGIT_PATTERN.test(name) ? `_${name.slice(1)}` : name
    return `export ${typePrefix}* as ${parsedName} from ${from}`
  }

  if (name) {
    console.warn(`When using name as string, asAlias should be true: ${name}`)
  }

  return `export ${typePrefix}* from ${from}`
}
