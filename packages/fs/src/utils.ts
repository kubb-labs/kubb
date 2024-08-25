import type { File, ResolvedFile } from './types.ts'
import hash from 'object-hash'

/**
 * Helper to create a file with name and id set
 */
export function createFile<TMeta extends object = object>(file: File<TMeta>): ResolvedFile<TMeta> {
  return {
    id: hash(file),
    name: trimExtName(file.baseName),
    extName: file.baseName.split('.').pop() || '',
    ...file,
  }
}

export type ParserModule<TImport = unknown, TExport = unknown> = {
  createImport: (props: {
    name:
      | string
      | Array<
          | string
          | {
              propertyName: string
              name?: string
            }
        >
    path: string
    isTypeOnly?: boolean
    isNameSpace?: boolean
  }) => TImport | undefined
  createExport: (props: {
    path: string
    asAlias?: boolean
    isTypeOnly?: boolean
    name?: string | Array<string>
  }) => TExport | undefined
  print: (props: { imports: Array<TImport>; exports: Array<TExport>; source: string }) => string
}

export function createFileParser<TImport = unknown, TExport = unknown>(parser: ParserModule<TImport, TExport>): ParserModule<TImport, TExport> {
  return parser
}

export async function getFileParser(extName: string | undefined): Promise<ParserModule<any, any>> {
  switch (extName) {
    case 'ts':
    case 'js':
    case 'tsx':
    case 'jsx': {
      const module = await import('@kubb/parser-ts')

      return createFileParser({
        createExport({ name, path, isTypeOnly, asAlias }) {
          return module.factory.createExportDeclaration({
            path,
            asAlias,
            isTypeOnly,
            name,
          })
        },
        createImport({ name, path, isTypeOnly }) {
          return module.factory.createImportDeclaration({
            name: name as any,
            path,
            isTypeOnly,
          })
        },
        print(props) {
          const source = [module.print([...props.imports, ...props.exports]), props.source].join('\n')

          // do some basic linting with the ts compiler
          return module.print([], { source, noEmitHelpers: false })
        },
      })
    }
    default:
      return createFileParser<string>({
        createExport() {
          return undefined
        },
        createImport() {
          return undefined
        },
        print(props) {
          return props.source
        },
      })
  }
}

export function trimExtName(text: string): string {
  const extName = text.split('.').pop()

  return text.replace(`.${extName}`, '')
}
