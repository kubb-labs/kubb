import { extname } from 'node:path'
import type * as KubbFile from '@kubb/fs/types'

import type { ResolvedExport } from '@kubb/fs/src/types.ts'
import hash from 'object-hash'
import type { Logger } from '../logger.ts'

/**
 * Helper to create a file with name and id set
 */
export function createFile<TMeta extends object = object>(file: KubbFile.File<TMeta>): KubbFile.ResolvedFile<TMeta> {
  const extName = extname(file.baseName) as KubbFile.Extname

  if (!extName) {
    throw new Error(`No extName found for ${file.baseName}`)
  }

  return {
    ...file,
    id: hash({ path: file.path }),
    name: trimExtName(file.baseName),
    extName,
    imports: file.imports?.map((item) => createFileImport(item)) || [],
    exports: file.exports?.map((item) => createFileExport(item)) || [],
  }
}

/**
 * Helper to create a fileImport with extName set
 */
export function createFileImport(imp: KubbFile.Import): KubbFile.ResolvedImport {
  const extName = extname(imp.path) as KubbFile.Extname

  return {
    ...imp,
    extName: imp.extName ? imp.extName : extName,
  } as any
}

/**
 * Helper to create a fileExport with extName set
 */
export function createFileExport(exp: KubbFile.Export): KubbFile.ResolvedExport {
  const extName = extname(exp.path) as KubbFile.Extname

  return {
    ...exp,
    extName: exp.extName ? exp.extName : extName,
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

type GetFileParserOptions = {
  logger: Logger
}

export async function getFileParser(extName: KubbFile.Extname | undefined, { logger }: GetFileParserOptions): Promise<ParserModule<any, any>> {
  switch (extName) {
    case '.ts':
    case '.js':
    case '.tsx':
    case '.jsx': {
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
          logger.emit('warning', `No createExport found for ${extName}`)

          return undefined
        },
        createImport() {
          logger.emit('warning', `No createImport found for ${extName}`)

          throw new Error(`No parser found for ${extName}`)
        },
        print(props) {
          logger.emit('warning', `No print found for ${extName}, falling back on source`)

          return props.source
        },
      })
  }
}

export function trimExtName(text: string): string {
  const extName = text.split('.').pop()

  return text.replace(`.${extName}`, '')
}
