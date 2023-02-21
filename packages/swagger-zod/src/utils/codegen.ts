import { factory } from 'typescript'

import type ts from 'typescript'

export const keywordZodNodes = {
  any: 'any',
  number: 'number',
  integer: 'number',
  object: 'object',
  string: 'string',
  boolean: 'boolean',
  undefined: 'undefined',
  null: 'null',
  array: 'array',
  enum: 'enum',
} as const

export function createImportDeclaration({ name, path, isTypeOnly }: { name: string | Array<ts.Identifier | string>; path: string; isTypeOnly?: boolean }) {
  if (!Array.isArray(name)) {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(isTypeOnly ?? false, factory.createIdentifier(name), undefined),
      factory.createStringLiteral(path),
      undefined
    )
  }

  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      isTypeOnly ?? true,
      undefined,
      factory.createNamedImports(
        name.map((propertyName) => {
          return factory.createImportSpecifier(false, undefined, typeof propertyName === 'string' ? factory.createIdentifier(propertyName) : propertyName)
        })
      )
    ),
    factory.createStringLiteral(path),
    undefined
  )
}

export function createExportDeclaration({ path }: { path: string }) {
  return factory.createExportDeclaration(undefined, false, undefined, factory.createStringLiteral(path), undefined)
}
