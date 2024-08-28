import { extname } from 'node:path'
import type * as KubbFile from '@kubb/fs/types'

import { getRelativePath } from '@kubb/fs'
import hash from 'object-hash'
import { combineExports, combineImports, combineSources } from '../FileManager.ts'
import type { Logger } from '../logger.ts'

/**
 * Helper to create a file with name and id set
 */
export function createFile<TMeta extends object = object>(file: KubbFile.File<TMeta>): KubbFile.ResolvedFile<TMeta> {
  const extName = extname(file.baseName) as KubbFile.Extname

  console.log(extName, file.baseName)

  if (!extName) {
    throw new Error(`No extName found for ${file?.baseName}`)
  }

  const source = file.sources.map((item) => item.value).join('\n\n')
  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports && source ? combineImports(file.imports, exports, source) : []
  const sources = file.sources ? combineSources(file.sources) : []

  return {
    ...file,
    id: hash({ path: file.path }),
    name: trimExtName(file.baseName),
    extName,
    imports: imports.map((item) => createFileImport(item)),
    exports: exports.map((item) => createFileExport(item)),
    sources: sources.map((item) => createFileSource(item)),
  }
}

/**
 * Helper to create a fileImport with extName set
 */
export function createFileSource(source: KubbFile.Source): KubbFile.Source {
  return source
}

/**
 * Helper to create a fileImport with extName set
 */
export function createFileImport(imp: KubbFile.Import): KubbFile.ResolvedImport {
  const extName = extname(imp.path) as KubbFile.Extname

  return {
    ...imp,
    extName: imp.extName ? imp.extName : extName,
  }
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
  print: (file: KubbFile.ResolvedFile<TMeta>, options: PrintOptions) => Promise<string>
}

export function createFileParser<TMeta extends object = object>(parser: ParserModule<TMeta>): ParserModule<TMeta> {
  return parser
}

type PrintOptions = {
  logger?: Logger
}

const typeScriptParser = createFileParser({
  render() {
    return undefined
  },
  async print(file) {
    const module = await import('@kubb/parser-ts')

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

const defaultParser = createFileParser({
  render() {
    return undefined
  },
  async print(file, { logger }) {
    return file.sources.map((item) => item.value).join('\n\n')
  },
})

const parsers: Record<KubbFile.Extname, ParserModule<any>> = {
  '.ts': typeScriptParser,
  '.js': typeScriptParser,
  '.jsx': typeScriptParser,
  '.tsx': typeScriptParser,
  '.json': defaultParser,
}

export async function getFileParser<TMeta extends object = object>(extName: KubbFile.Extname | undefined): Promise<ParserModule<TMeta>> {
  if (!extName) {
    return defaultParser
  }

  const parser = parsers[extName]

  if (!parser) {
    console.warn(`[parser] No parser found for ${extName}, default parser will be used`)
  }

  return parser || defaultParser
}

export function trimExtName(text: string): string {
  const extName = text.split('.').pop()

  return text.replace(`.${extName}`, '')
}
