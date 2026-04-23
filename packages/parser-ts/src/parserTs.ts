import { normalize, relative } from 'node:path'
import type { ArrowFunctionNode, CodeNode, ConstNode, FileNode, FunctionNode, JSDocNode, JsxNode, SourceNode, TextNode, TypeNode } from '@kubb/ast'
import type { Parser } from '@kubb/core'
import { defineParser } from '@kubb/core'
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

function slash(path: string): string {
  return normalize(path).replaceAll(WINDOWS_PATH_SEPARATOR, '/').replace(PARENT_DIRECTORY_PREFIX, '')
}

/**
 * Resolves `filePath` relative to `rootDir` and returns a POSIX-style path
 * prefixed with `./` when the target sits inside the root, or `../` when it escapes it.
 */
function getRelativePath(rootDir: string, filePath: string): string {
  const rel = relative(rootDir, filePath)
  const slashed = slash(rel)
  return slashed.startsWith(PARENT_DIRECTORY_PREFIX) ? slashed : `${CURRENT_DIRECTORY_PREFIX}${slashed}`
}

/**
 * Strips the trailing file extension (for example `.ts`) from a path.
 * Preserves intermediate dots like `foo.bar.ts` → `foo.bar`.
 */
function trimExtName(text: string): string {
  return text.replace(FILE_EXTENSION_PATTERN, '')
}

/**
 * Rewrites an import/export path so its extension matches the caller-supplied
 * `options.extname`. When the source path has no extension the original is kept,
 * so virtual/module-only paths flow through unchanged.
 */
function resolveOutputPath(path: string, options: { extname?: string } | undefined, rootAware: boolean): string {
  const hasExtname = FILE_EXTENSION_PATTERN.test(path)
  if (options?.extname && hasExtname) {
    return `${trimExtName(path)}${options.extname}`
  }
  return rootAware ? trimExtName(path) : path
}

/**
 * Validates TypeScript AST nodes before printing.
 * Throws an error if any node has SyntaxKind.Unknown which would cause the
 * TypeScript printer to crash.
 */
export function validateNodes(...nodes: ts.Node[]): void {
  for (const node of nodes) {
    if (!node) {
      throw new Error('Attempted to print undefined or null TypeScript node')
    }
    if (node.kind === ts.SyntaxKind.Unknown) {
      throw new Error(
        'Invalid TypeScript AST node detected with SyntaxKind.Unknown. ' +
          'This typically indicates a schema pattern that could not be properly converted to TypeScript. ' +
          `Node: ${JSON.stringify(node, null, 2)}`,
      )
    }
  }
}

/**
 * Converts TypeScript/TSX AST nodes to a string using the TypeScript printer.
 */
export function print(...elements: Array<ts.Node>): string {
  const sourceFile = ts.createSourceFile('print.tsx', '', ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX)

  const printer = ts.createPrinter({
    omitTrailingSemicolon: true,
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    noEmitHelpers: true,
  })

  const output = printer.printList(ts.ListFormat.MultiLine, factory.createNodeArray(elements.filter(Boolean)), sourceFile)

  return output.replace(CRLF_PATTERN, '\n')
}

/**
 * Like `print` but validates nodes first to surface issues early.
 */
export function safePrint(...elements: Array<ts.Node>): string {
  validateNodes(...elements)
  return print(...elements)
}

export function createImport({
  name,
  path,
  root,
  isTypeOnly = false,
  isNameSpace = false,
}: {
  name: string | Array<string | { propertyName: string; name?: string }>
  path: string
  root?: string
  /** @default false */
  isTypeOnly?: boolean
  /** @default false */
  isNameSpace?: boolean
}): ts.ImportDeclaration {
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
  asAlias,
  isTypeOnly = false,
  name,
}: {
  path: string
  /** @default false */
  asAlias?: boolean
  /** @default false */
  isTypeOnly?: boolean
  name?: string | Array<ts.Identifier | string>
}): ts.ExportDeclaration {
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
 * Serializes the body / value content from a `nodes` array.
 *
 * Each element is either a raw string or a structured {@link CodeNode}
 * (recursively converted via {@link printCodeNode}).
 * Elements are joined with `\n`.
 */
function printNodes(nodes: Array<CodeNode> | undefined): string {
  if (!nodes || nodes.length === 0) return ''
  return nodes.map(printCodeNode).join('\n')
}

/**
 * Indents every non-empty line of `text` by `spaces` spaces.
 */
function indentLines(text: string, spaces: number = INDENT_SIZE): string {
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
function formatGenerics(generics: FunctionNode['generics'] | ArrowFunctionNode['generics']): string {
  if (!generics) return ''
  return `<${Array.isArray(generics) ? generics.join(', ') : generics}>`
}

/**
 * Renders the return-type suffix (`: T` or `: Promise<T>` when `isAsync` is true).
 * Returns an empty string when no return type is provided.
 */
function formatReturnType(returnType: string | undefined, isAsync: boolean | undefined): string {
  if (!returnType) return ''
  return isAsync ? `: Promise<${returnType}>` : `: ${returnType}`
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

  const parts: string[] = []
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

  const parts: string[] = []
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

  const parts: string[] = []
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

  const parts: string[] = []
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
  switch (node.kind) {
    case 'Break':
      return ''
    case 'Text':
      return (node as TextNode).value
    case 'Jsx':
      return (node as JsxNode).value
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
  if (node.nodes && node.nodes.length > 0) {
    return node.nodes.map(printCodeNode).join('\n')
  }
  return ''
}

/**
 * Parser that converts `.ts` and `.js` files to strings using the TypeScript
 * compiler. Handles import/export statement generation from file metadata.
 *
 * @default Used automatically when no `parsers` option is set in `defineConfig`.
 */
export const parserTs: Parser = defineParser({
  name: 'typescript',
  extNames: ['.ts', '.js'],
  async parse(file, options = { extname: '.ts' }) {
    const sourceParts: Array<string> = []
    for (const item of file.sources) {
      const sourceStr = printSource(item as SourceNode)
      if (sourceStr) {
        sourceParts.push(sourceStr.trimEnd())
      }
    }
    const source = sourceParts.join('\n\n')

    const importNodes: Array<ts.ImportDeclaration> = []
    for (const item of (file as FileNode).imports) {
      const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
      importNodes.push(
        createImport({
          name: item.name as string | Array<string | { propertyName: string; name?: string }>,
          path: resolveOutputPath(importPath, options, Boolean(item.root)),
          isTypeOnly: item.isTypeOnly,
          isNameSpace: item.isNameSpace,
        }),
      )
    }

    const exportNodes: Array<ts.ExportDeclaration> = []
    for (const item of (file as FileNode).exports) {
      exportNodes.push(
        createExport({
          name: item.name as string | Array<ts.Identifier | string> | undefined,
          path: resolveOutputPath(item.path, options, true),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        }),
      )
    }

    const parts = [file.banner, print(...importNodes, ...exportNodes), source, file.footer]
      .filter((segment): segment is string => Boolean(segment))
      .map((s) => s.trimEnd())
    return parts.join('\n\n')
  },
})
