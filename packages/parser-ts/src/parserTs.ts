import { normalize, relative } from 'node:path'
import type { ArrowFunctionNode, CodeNode, ConstNode, FileNode, FunctionNode, JSDocNode, SourceNode, TypeNode } from '@kubb/ast/types'
import type { Parser } from '@kubb/core'
import { defineParser } from '@kubb/core'
import ts from 'typescript'

const { factory } = ts

function slash(path: string): string {
  return normalize(path).replaceAll(/\\/g, '/').replace('../', '')
}

function getRelativePath(rootDir: string, filePath: string): string {
  const rel = relative(rootDir, filePath)
  const slashed = slash(rel)
  return slashed.startsWith('../') ? slashed : `./${slashed}`
}

function trimExtName(text: string): string {
  return text.replace(/\.[^/.]+$/, '')
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

  return output.replace(/\r\n/g, '\n')
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
    const parsedName = name?.match(/^\d/) ? `_${name?.slice(1)}` : name

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
    .map((l) => l.replace(/\*\//g, '* /').replace(/\r/g, ''))
    .filter((l) => l.trim().length > 0)

  if (lines.length === 0) return ''

  return ['/**', ...lines.map((l) => ` * ${l}`), ' */'].join('\n')
}

/**
 * Detaches a parsed TypeScript node from its source file by replacing all
 * position-dependent literal nodes with freshly-created factory nodes.
 *
 * When nodes parsed from one source file are printed in the context of a
 * different source file (as in {@link print}), the TypeScript printer
 * looks up literal text by source position and gets an empty string. This
 * transform prevents that data loss by embedding the literal text directly
 * into new factory nodes.
 */
function detachNode<T extends ts.Node>(node: T): T {
  const result = ts.transform(node, [
    (context) =>
      (root: T): T => {
        const visit = (n: ts.Node): ts.Node => {
          if (ts.isStringLiteral(n)) return factory.createStringLiteral(n.text)
          if (ts.isNumericLiteral(n)) return factory.createNumericLiteral(n.text)
          if (ts.isBigIntLiteral(n)) return factory.createBigIntLiteral(n.text)
          if (ts.isNoSubstitutionTemplateLiteral(n)) return factory.createNoSubstitutionTemplateLiteral(n.text, n.rawText)
          if (ts.isTemplateHead(n)) return factory.createTemplateHead(n.text, n.rawText)
          if (ts.isTemplateMiddle(n)) return factory.createTemplateMiddle(n.text, n.rawText)
          if (ts.isTemplateTail(n)) return factory.createTemplateTail(n.text, n.rawText)
          return ts.visitEachChild(n, visit, context)
        }
        return ts.visitNode(root, visit) as T
      },
  ])
  const transformed = result.transformed[0] as T
  result.dispose()
  return transformed
}

/** Parse a TypeScript expression from a source string. */
function parseExpressionFromString(code: string): ts.Expression | undefined {
  const trimmed = code.trim()
  if (!trimmed) return undefined
  const sf = ts.createSourceFile('tmp.ts', `const _x = ${trimmed}`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const expr = (sf.statements[0] as ts.VariableStatement | undefined)?.declarationList?.declarations[0]?.initializer
  return expr ? detachNode(expr) : undefined
}

/** Parse a TypeScript type annotation from a source string. */
function parseTypeNodeFromString(typeStr: string): ts.TypeNode | undefined {
  const trimmed = typeStr.trim()
  if (!trimmed) return undefined
  const sf = ts.createSourceFile('tmp.ts', `type _T = ${trimmed}`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const typeNode = (sf.statements[0] as ts.TypeAliasDeclaration | undefined)?.type
  return typeNode ? detachNode(typeNode) : undefined
}

/** Parse TypeScript statements from a source string, wrapped in a function body for correct context. */
function parseStatementsFromString(code: string): ts.Statement[] {
  const trimmed = code.trim()
  if (!trimmed) return []
  const sf = ts.createSourceFile('tmp.ts', `function _f() { ${trimmed} }`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const fn = sf.statements[0] as ts.FunctionDeclaration | undefined
  const stmts = fn?.body?.statements ? [...fn.body.statements] : []
  return stmts.map((s) => detachNode(s))
}

/** Parse TypeScript parameter declarations from a source string. */
function parseParametersFromString(paramsStr: string): ts.ParameterDeclaration[] {
  const trimmed = paramsStr.trim()
  if (!trimmed) return []
  const sf = ts.createSourceFile('tmp.ts', `function _f(${trimmed}) {}`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const fn = sf.statements[0] as ts.FunctionDeclaration | undefined
  const params = fn?.parameters ? [...fn.parameters] : []
  return params.map((p) => detachNode(p))
}

/** Parse TypeScript type parameter declarations from a string or string array. */
function parseTypeParametersFromString(generics: string | string[] | undefined): ts.TypeParameterDeclaration[] | undefined {
  if (!generics) return undefined
  const genericsStr = Array.isArray(generics) ? generics.join(', ') : generics
  const trimmed = genericsStr.trim()
  if (!trimmed) return undefined
  const sf = ts.createSourceFile('tmp.ts', `function _f<${trimmed}>() {}`, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const fn = sf.statements[0] as ts.FunctionDeclaration | undefined
  const typeParams = fn?.typeParameters ? [...fn.typeParameters] : undefined
  return typeParams ? typeParams.map((p) => detachNode(p)) : undefined
}

/**
 * Attaches a {@link JSDocNode} to a TypeScript AST node as a synthetic leading comment.
 * Uses `ts.addSyntheticLeadingComment` so the TypeScript printer emits the comment.
 */
function withJSDoc<TNode extends ts.Node>(node: TNode, jsDoc: JSDocNode | undefined): TNode {
  if (!jsDoc?.comments) return node
  const filtered = jsDoc.comments.filter((c): c is string => c != null)
  if (!filtered.length) return node
  const text = filtered.reduce<string>((acc, comment) => `${acc}\n * ${comment.replaceAll('*/', '*\\/')}`, '*')
  return ts.addSyntheticLeadingComment(node, ts.SyntaxKind.MultiLineCommentTrivia, `${text}\n`, true)
}

/**
 * Serialises the body / value content from a `nodes` array.
 *
 * Each element is either a raw string or a structured {@link CodeNode}
 * (recursively converted via {@link printCodeNode}).
 * Elements are joined with `\n`.
 */
function printNodes(nodes: Array<CodeNode | string> | undefined): string {
  if (!nodes || nodes.length === 0) return ''
  return nodes.map((n) => (typeof n === 'string' ? n : printCodeNode(n))).join('\n')
}

/**
 * Converts a {@link ConstNode} to a TypeScript `const` declaration string
 * using the TypeScript factory API.
 *
 * Mirrors the `Const` component from `@kubb/react-fabric`.
 *
 * @example
 * ```ts
 * printConst(createConst({ name: 'pet', export: true, nodes: ['{}'] }))
 * // 'export const pet = {};'
 * ```
 *
 * @example With type and `as const`
 * ```ts
 * printConst(createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true, nodes: ['[]'] }))
 * // 'export const pets: Pet[] = [] as const;'
 * ```
 */
export function printConst(node: ConstNode): string {
  const { name, export: canExport, type, JSDoc, asConst, nodes } = node

  const body = printNodes(nodes).trim()
  let initializer: ts.Expression | undefined
  if (body) {
    const expr = parseExpressionFromString(body)
    initializer = asConst && expr ? factory.createAsExpression(expr, factory.createTypeReferenceNode('const')) : expr
  }

  const typeAnnotation = type ? parseTypeNodeFromString(type) : undefined
  const mods: ts.Modifier[] = canExport ? [factory.createModifier(ts.SyntaxKind.ExportKeyword)] : []

  const stmt = factory.createVariableStatement(
    mods.length ? mods : undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier(name), undefined, typeAnnotation, initializer)],
      ts.NodeFlags.Const,
    ),
  )

  return print(withJSDoc(stmt, JSDoc)).trimEnd()
}

/**
 * Converts a {@link TypeNode} to a TypeScript `type` alias declaration string
 * using the TypeScript factory API.
 *
 * Mirrors the `Type` component from `@kubb/react-fabric`.
 *
 * @example
 * ```ts
 * printType(createType({ name: 'Pet', export: true, nodes: ['{ id: number }'] }))
 * // 'export type Pet = {\n    id: number;\n};'
 * ```
 */
export function printType(node: TypeNode): string {
  const { name, export: canExport, JSDoc, nodes } = node

  const body = printNodes(nodes).trim()
  const typeBody = (body ? parseTypeNodeFromString(body) : undefined) ?? factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)

  const mods: ts.Modifier[] = canExport ? [factory.createModifier(ts.SyntaxKind.ExportKeyword)] : []

  const stmt = factory.createTypeAliasDeclaration(mods.length ? mods : undefined, factory.createIdentifier(name), undefined, typeBody)

  return print(withJSDoc(stmt, JSDoc)).trimEnd()
}

/**
 * Converts a {@link FunctionNode} to a TypeScript `function` declaration string
 * using the TypeScript factory API.
 *
 * Mirrors the `Function` component from `@kubb/react-fabric`.
 *
 * @example
 * ```ts
 * printFunction(createFunction({ name: 'getPet', export: true, params: 'id: string', returnType: 'Pet', nodes: ['return fetch(id)'] }))
 * // 'export function getPet(id: string): Pet {\n    return fetch(id);\n}'
 * ```
 *
 * @example Async with generics
 * ```ts
 * printFunction(createFunction({ name: 'fetchPet', export: true, async: true, generics: ['T'], params: 'id: string', returnType: 'T' }))
 * // 'export async function fetchPet<T>(id: string): Promise<T> { }'
 * ```
 */
export function printFunction(node: FunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes } = node

  const mods: ts.Modifier[] = []
  if (canExport) mods.push(factory.createModifier(ts.SyntaxKind.ExportKeyword))
  if (isDefault) mods.push(factory.createModifier(ts.SyntaxKind.DefaultKeyword))
  if (isAsync) mods.push(factory.createModifier(ts.SyntaxKind.AsyncKeyword))

  const typeParams = parseTypeParametersFromString(generics)
  const parameters = parseParametersFromString(params ?? '')

  let returnTypeNode: ts.TypeNode | undefined
  if (returnType) {
    const inner = parseTypeNodeFromString(returnType)
    returnTypeNode = isAsync && inner ? factory.createTypeReferenceNode('Promise', [inner]) : inner
  }

  const bodyCode = printNodes(nodes)
  const bodyStmts = parseStatementsFromString(bodyCode)
  const body = factory.createBlock(bodyStmts, bodyStmts.length > 0)

  const stmt = factory.createFunctionDeclaration(
    mods.length ? mods : undefined,
    undefined,
    factory.createIdentifier(name),
    typeParams,
    parameters,
    returnTypeNode,
    body,
  )

  return print(withJSDoc(stmt, JSDoc)).trimEnd()
}

/**
 * Converts an {@link ArrowFunctionNode} to a TypeScript arrow function declaration string
 * using the TypeScript factory API.
 *
 * Mirrors the `Function.Arrow` component from `@kubb/react-fabric`.
 *
 * @example Multi-line arrow function
 * ```ts
 * printArrowFunction(createArrowFunction({ name: 'getPet', export: true, params: 'id: string', nodes: ['return fetch(id)'] }))
 * // 'export const getPet = (id: string) => {\n    return fetch(id);\n};'
 * ```
 *
 * @example Single-line arrow function
 * ```ts
 * printArrowFunction(createArrowFunction({ name: 'double', params: 'n: number', singleLine: true, nodes: ['n * 2'] }))
 * // 'const double = (n: number) => n * 2;'
 * ```
 */
export function printArrowFunction(node: ArrowFunctionNode): string {
  const { name, default: isDefault, export: canExport, async: isAsync, generics, params, returnType, JSDoc, nodes, singleLine } = node

  const typeParams = parseTypeParametersFromString(generics)
  const parameters = parseParametersFromString(params ?? '')

  let returnTypeNode: ts.TypeNode | undefined
  if (returnType) {
    const inner = parseTypeNodeFromString(returnType)
    returnTypeNode = isAsync && inner ? factory.createTypeReferenceNode('Promise', [inner]) : inner
  }

  const bodyCode = printNodes(nodes)
  let arrowBody: ts.ConciseBody
  if (singleLine && bodyCode.trim()) {
    arrowBody = parseExpressionFromString(bodyCode) ?? factory.createBlock([], false)
  } else {
    const bodyStmts = parseStatementsFromString(bodyCode)
    arrowBody = factory.createBlock(bodyStmts, bodyStmts.length > 0)
  }

  const arrowFn = factory.createArrowFunction(
    isAsync ? [factory.createModifier(ts.SyntaxKind.AsyncKeyword)] : undefined,
    typeParams,
    parameters,
    returnTypeNode,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    arrowBody,
  )

  const constMods: ts.Modifier[] = []
  if (canExport) constMods.push(factory.createModifier(ts.SyntaxKind.ExportKeyword))
  if (isDefault) constMods.push(factory.createModifier(ts.SyntaxKind.DefaultKeyword))

  const stmt = factory.createVariableStatement(
    constMods.length ? constMods : undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier(name), undefined, undefined, arrowFn)],
      ts.NodeFlags.Const,
    ),
  )

  return print(withJSDoc(stmt, JSDoc)).trimEnd()
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
 * Uses `value` if present; otherwise converts the structured `nodes` array
 * via {@link printCodeNode}.
 *
 * @example From value
 * ```ts
 * printSource({ kind: 'Source', value: 'const x = 1' })
 * // 'const x = 1'
 * ```
 *
 * @example From nodes
 * ```ts
 * printSource({ kind: 'Source', nodes: [createConst({ name: 'x', nodes: ['1'] })] })
 * // 'const x = 1'
 * ```
 */
export function printSource(node: SourceNode): string {
  if (node.value) return node.value
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
        sourceParts.push(sourceStr)
      }
    }
    const source = sourceParts.join('\n\n')

    const importNodes: Array<ts.ImportDeclaration> = []
    for (const item of (file as FileNode).imports) {
      const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
      const hasExtname = !!/\.[^/.]+$/.exec(importPath)

      importNodes.push(
        createImport({
          name: item.name as string | Array<string | { propertyName: string; name?: string }>,
          path: options?.extname && hasExtname ? `${trimExtName(importPath)}${options.extname}` : item.root ? trimExtName(importPath) : importPath,
          isTypeOnly: item.isTypeOnly,
          isNameSpace: item.isNameSpace,
        }),
      )
    }

    const exportNodes: Array<ts.ExportDeclaration> = []
    for (const item of (file as FileNode).exports) {
      const exportPath = item.path
      const hasExtname = !!/\.[^/.]+$/.exec(exportPath)

      exportNodes.push(
        createExport({
          name: item.name as string | Array<ts.Identifier | string> | undefined,
          path: options?.extname && hasExtname ? `${trimExtName(item.path)}${options.extname}` : trimExtName(item.path),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        }),
      )
    }

    const parts = [file.banner, print(...importNodes, ...exportNodes), source, file.footer].filter((segment): segment is string => segment != null)
    return parts.join('\n')
  },
})
