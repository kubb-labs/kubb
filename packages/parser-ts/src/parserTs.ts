import { normalize, relative } from 'node:path'
import type { FileNode } from '@kubb/ast/types'
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
      if (item.value) {
        sourceParts.push(item.value)
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
