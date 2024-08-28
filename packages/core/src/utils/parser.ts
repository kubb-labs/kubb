import { extname } from 'node:path'
import type * as KubbFile from '@kubb/fs/types'

import { getRelativePath } from '@kubb/fs'
import hash from 'object-hash'
import { combineExports, combineImports } from '../FileManager.ts';
import type { Logger } from '../logger.ts'

/**
 * Helper to create a file with name and id set
 */
export function createFile<TMeta extends object = object>(file: KubbFile.File<TMeta>): KubbFile.ResolvedFile<TMeta> {
  const extName = extname(file.baseName) as KubbFile.Extname

  if (!extName) {
    throw new Error(`No extName found for ${file.baseName}`)
  }

  const source = file.sources.map((item) => item.value).join('\n\n')
  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports && source ? combineImports(file.imports, exports, source) : []


  return {
    ...file,
    id: hash({ path: file.path }),
    name: trimExtName(file.baseName),
    extName,
    imports: imports?.map((item) => createFileImport(item)) || [],
    exports: exports?.map((item) => createFileExport(item)) || [],
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

export type ParserModule<TMeta extends object = object> = {
  /**
   * By default @kubb/react is used
   */
  render: (item: any) => any
  /**
   * Convert a file to string
   */
  print: (file: KubbFile.ResolvedFile<TMeta>) => string
}

export function createFileParser<TMeta extends object = object>(parser: ParserModule<TMeta>): ParserModule<TMeta> {
  return parser
}

type GetFileParserOptions = {
  logger?: Logger
}

export async function getFileParser<TMeta extends object = object>(
  extName: KubbFile.Extname | undefined,
  { logger }: GetFileParserOptions = {},
): Promise<ParserModule<TMeta>> {
  switch (extName) {
    case '.ts':
    case '.js':
    case '.tsx':
    case '.jsx': {
      const module = await import('@kubb/parser-ts')

      return createFileParser({
        render() {
          return undefined
        },
        print(file) {
          const importNodes = file.imports
            .map((item) => {
              const path = item.root ? getRelativePath(item.root, item.path) : item.path

              return module.factory.createImportDeclaration({
                name: item.name,
                path,
                isTypeOnly: item.isTypeOnly,
              })
            })
            .filter(Boolean)

          const exportNodes = file.exports
            .map((item) => {
              return module.factory.createExportDeclaration({
                name: item.name,
                path: item.path,
                isTypeOnly: item.isTypeOnly,
                asAlias: item.asAlias,
              })
            })
            .filter(Boolean)

          const source = [module.print([...importNodes, ...exportNodes]), file.sources.map((item) => item.value).join('\n\n')].join('\n')

          // do some basic linting with the ts compiler
          return module.print([], { source, noEmitHelpers: false })
        },
      })
    }
    default:
      return createFileParser({
        render() {
          return undefined
        },
        print(file) {
          logger?.emit('warning', `[parser] No print found for ${file.path}, falling back will be used`)

          return file.sources.map((item) => item.value).join('\n\n')
        },
      })
  }
}

export function trimExtName(text: string): string {
  const extName = text.split('.').pop()

  return text.replace(`.${extName}`, '')
}
