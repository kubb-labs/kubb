import { normalize, relative } from 'node:path'
import type { ArrowFunctionNode, CodeNode, ConstNode, FunctionNode, JSDocNode, JsxNode, SourceNode, TextNode, TypeNode } from '@kubb/ast'
import ts from 'typescript'
import {
  CARRIAGE_RETURN_PATTERN,
  CRLF_PATTERN,
  CURRENT_DIRECTORY_PREFIX,
  FILE_EXTENSION_PATTERN,
  INDENT_SIZE,
  JSDOC_TERMINATOR_PATTERN,
  LEADING_DIGIT_PATTERN,
  PARENT_DIRECTORY_PREFIX,
  WINDOWS_PATH_SEPARATOR,
} from './constants.ts'

const { factory } = ts

/**
 * Normalizes a file-system path to POSIX separators and strips any leading `../` segment.
 */
export function slash(path: string): string {
  return normalize(path).replaceAll(WINDOWS_PATH_SEPARATOR, '/').replace(PARENT_DIRECTORY_PREFIX, '')
}

/**
 * Resolves `filePath` relative to `rootDir` and returns a POSIX-style path
 * prefixed with `./` when the target sits inside the root, or `../` when it escapes it.
 */
export function getRelativePath(rootDir: string, filePath: string): string {
  const rel = relative(rootDir, filePath)
  const slashed = slash(rel)
  return slashed.startsWith(PARENT_DIRECTORY_PREFIX) ? slashed : `${CURRENT_DIRECTORY_PREFIX}${slashed}`
}

/**
 * Strips the trailing file extension (for example `.ts`) from a path.
 * Preserves intermediate dots like `foo.bar.ts` → `foo.bar`.
 */
export function trimExtName(text: string): string {
  return text.replace(FILE_EXTENSION_PATTERN, '')
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
 * Serializes the body / value content from a `nodes` array.
 *
 * Each element is either a raw string or a structured {@link CodeNode}
 * (recursively converted via {@link printCodeNode}).
 * Elements are joined with `\n`.
 */
export function printNodes(nodes: Array<CodeNode> | undefined): string {
  if (!nodes || nodes.length === 0) return ''

  const parts: Array<string> = []

  for (const node of nodes) {
    parts.push(printCodeNode(node))
  }

  return parts.join('\n')
}

/**
 * Indents every non-empty line of `text` by `spaces` spaces.
 */
export function indentLines(text: string, spaces: number = INDENT_SIZE): string {
  if (!text) return ''
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${pad}${line}` : ''))
    .join('\n')
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
 * Module-scoped TypeScript printer instance. `ts.createPrinter()` is stateless across calls
 * (it does not mutate the source file) so a single instance can be safely reused for every
 * `print()` call. Hoisting it out of `print()` avoids re-running the printer initialization
 * for each file's import/export section.
 */
const TS_PRINTER = ts.createPrinter({
  omitTrailingSemicolon: true,
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  noEmitHelpers: true,
})

/**
 * Module-scoped source file used as the print target. `printList` only reads the source
 * file's compiler options / language version; it never mutates it.
 */
const PRINT_SOURCE_FILE = ts.createSourceFile('print.tsx', '', ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)

// Pre-warm the printer at module load. The first `printList` call lazily initializes
// the printer's internal string-builder and identifier tables; doing it once at import
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
 * printConst(createConst({ name: 'pet', export: true, nodes: ['{}'] }))
 * // 'export const pet = {}'
 * ```
 *
 * @example With type and `as const`
 * ```ts
 * printConst(createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true, nodes: ['[]'] }))
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
 * printType(createType({ name: 'Pet', export: true, nodes: ['{ id: number }'] }))
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
 * printFunction(createFunction({ name: 'getPet', export: true, params: 'id: string', returnType: 'Pet', nodes: ['return fetch(id)'] }))
 * // 'export function getPet(id: string): Pet {\n  return fetch(id)\n}'
 * ```
 *
 * @example Async with generics
 * ```ts
 * printFunction(createFunction({ name: 'fetchPet', export: true, async: true, generics: ['T'], params: 'id: string', returnType: 'T' }))
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
 * printArrowFunction(createArrowFunction({ name: 'getPet', export: true, params: 'id: string', nodes: ['return fetch(id)'] }))
 * // 'export const getPet = (id: string) => {\n  return fetch(id)\n}'
 * ```
 *
 * @example Single-line arrow function
 * ```ts
 * printArrowFunction(createArrowFunction({ name: 'double', params: 'n: number', singleLine: true, nodes: ['n * 2'] }))
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
 * printCodeNode(createConst({ name: 'x', nodes: ['1'] }))
 * // 'const x = 1'
 * ```
 */
export function printCodeNode(node: CodeNode): string {
  if (node.kind === 'Break') return ''
  if (node.kind === 'Text') return (node as TextNode).value
  if (node.kind === 'Jsx') return (node as JsxNode).value
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
 * @example From nodes
 * ```ts
 * printSource({ kind: 'Source', nodes: [createConst({ name: 'x', nodes: [createText('1')] }), createText('x.toString()')] })
 * // 'const x = 1\nx.toString()'
 * ```
 */
export function printSource(node: SourceNode): string {
  const nodes = node.nodes

  if (!nodes || nodes.length === 0) return ''
  const parts: Array<string> = []

  for (const child of nodes) {
    parts.push(printCodeNode(child as CodeNode))
  }

  return parts.join('\n')
}

export function createImport({
  name,
  path,
  root,
  isTypeOnly: isTypeOnlyRaw = false,
  isNameSpace: isNameSpaceRaw = false,
}: {
  name: string | Array<string | { propertyName: string; name?: string }>
  path: string
  root?: string | null
  /** @default false */
  isTypeOnly?: boolean | null
  /** @default false */
  isNameSpace?: boolean | null
}): ts.ImportDeclaration {
  const isTypeOnly = isTypeOnlyRaw ?? false
  const isNameSpace = isNameSpaceRaw ?? false
  const resolvePath = root ? getRelativePath(root, path) : path

  if (!Array.isArray(name)) {
    if (isNameSpace) {
      return factory.createImportDeclaration(
        undefined,
        factory.createImportClause(isTypeOnly, undefined, factory.createNamespaceImport(factory.createIdentifier(name))),
        factory.createStringLiteral(resolvePath),
        undefined,
      )
    }

    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(isTypeOnly, factory.createIdentifier(name), undefined),
      factory.createStringLiteral(resolvePath),
      undefined,
    )
  }

  const specifiers = name.map((item) => {
    if (typeof item === 'object') {
      const { propertyName, name: alias } = item
      return factory.createImportSpecifier(false, alias ? factory.createIdentifier(propertyName) : undefined, factory.createIdentifier(alias ?? propertyName))
    }
    return factory.createImportSpecifier(false, undefined, factory.createIdentifier(item))
  })

  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(isTypeOnly, undefined, factory.createNamedImports(specifiers)),
    factory.createStringLiteral(resolvePath),
    undefined,
  )
}

export function createExport({
  path,
  asAlias: asAliasRaw,
  isTypeOnly: isTypeOnlyRaw = false,
  name,
}: {
  path: string
  /** @default false */
  asAlias?: boolean | null
  /** @default false */
  isTypeOnly?: boolean | null
  name?: string | Array<ts.Identifier | string> | null
}): ts.ExportDeclaration {
  const asAlias = asAliasRaw ?? false
  const isTypeOnly = isTypeOnlyRaw ?? false
  if (name && !Array.isArray(name) && !asAlias) {
    console.warn(`When using name as string, asAlias should be true: ${name}`)
  }

  if (!Array.isArray(name)) {
    const parsedName = name && LEADING_DIGIT_PATTERN.test(name) ? `_${name.slice(1)}` : name

    return factory.createExportDeclaration(
      undefined,
      isTypeOnly,
      asAlias && parsedName ? factory.createNamespaceExport(factory.createIdentifier(parsedName)) : undefined,
      factory.createStringLiteral(path),
      undefined,
    )
  }

  return factory.createExportDeclaration(
    undefined,
    isTypeOnly,
    factory.createNamedExports(
      name.map((propertyName) =>
        factory.createExportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName),
      ),
    ),
    factory.createStringLiteral(path),
    undefined,
  )
}
