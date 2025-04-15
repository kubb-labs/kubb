import path from 'node:path'
import type * as KubbFile from '@kubb/fs/types'

import { getRelativePath } from '@kubb/fs'
import hash from 'object-hash'
import { combineExports, combineImports, combineSources } from '../FileManager.ts'
import type { Logger } from '../logger.ts'
import type { Config } from '../types.ts'

/**
 * Generate a default banner for files created by Kubb
 * @returns A string with the default banner
 */
export function getDefaultBanner({ title, description, version, config }: { title?: string; description?: string; version?: string; config: Config }): string {
  try {
    let source = ''
    if ('path' in config.input) {
      source = path.basename(config.input.path)
    } else if ('data' in config.input) {
      source = 'text content'
    }

    let banner = '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n'

    if (config.output.defaultBanner === 'simple') {
      banner += '*/\n'
      return banner
    }

    if (source) {
      banner += `* Source: ${source}\n`
    }

    if (title) {
      banner += `* Title: ${title}\n`
    }

    if (description) {
      const formattedDescription = description.replace(/\n/gm, '\n* ')
      banner += `* Description: ${formattedDescription}\n`
    }

    if (version) {
      banner += `* OpenAPI spec version: ${version}\n`
    }

    banner += '*/\n'
    return banner
  } catch (error) {
    // If there's any error in parsing the Oas data, return a simpler banner
    return '/**\n* Generated by Kubb (https://kubb.dev/).\n* Do not edit manually.\n*/'
  }
}

/**
 * Helper to create a file with name and id set
 */
export function createFile<TMeta extends object = object>(file: KubbFile.File<TMeta>): KubbFile.ResolvedFile<TMeta> {
  const extname = path.extname(file.baseName) as KubbFile.Extname

  if (!extname) {
    throw new Error(`No extname found for ${file.baseName}`)
  }

  const source = file.sources.map((item) => item.value).join('\n\n')
  const exports = file.exports ? combineExports(file.exports) : []
  const imports = file.imports && source ? combineImports(file.imports, exports, source) : []
  const sources = file.sources ? combineSources(file.sources) : []

  return {
    ...file,
    id: hash({ path: file.path }),
    name: trimExtName(file.baseName),
    extname,
    imports: imports.map((item) => createFileImport(item)),
    exports: exports.map((item) => createFileExport(item)),
    sources: sources.map((item) => createFileSource(item)),
    meta: file.meta || ({} as TMeta),
  }
}

/**
 * Helper to create a fileImport with extname set
 */
function createFileSource(source: KubbFile.Source): KubbFile.Source {
  return source
}

/**
 * Helper to create a fileImport with extname set
 */
export function createFileImport(imp: KubbFile.Import): KubbFile.ResolvedImport {
  return {
    ...imp,
  }
}

/**
 * Helper to create a fileExport with extname set
 */
export function createFileExport(exp: KubbFile.Export): KubbFile.ResolvedExport {
  return {
    ...exp,
  }
}

export type ParserModule<TMeta extends object = object> = {
  format: (source: string) => Promise<string>
  /**
   * Convert a file to string
   */
  print: (file: KubbFile.ResolvedFile<TMeta>, options: PrintOptions) => Promise<string>
}

export function createFileParser<TMeta extends object = object>(parser: ParserModule<TMeta>): ParserModule<TMeta> {
  return parser
}

type PrintOptions = {
  extname?: KubbFile.Extname
  logger?: Logger
}

const typeScriptParser = createFileParser({
  async format(source) {
    const module = await import('@kubb/parser-ts')

    return module.format(source)
  },
  async print(file, options = { extname: '.ts' }) {
    const module = await import('@kubb/parser-ts')

    const source = file.sources.map((item) => item.value).join('\n\n')

    const importNodes = file.imports
      .map((item) => {
        const importPath = item.root ? getRelativePath(item.root, item.path) : item.path
        const hasExtname = !!path.extname(importPath)

        return module.factory.createImportDeclaration({
          name: item.name,
          path: options.extname && hasExtname ? `${trimExtName(importPath)}${options.extname}` : item.root ? trimExtName(importPath) : importPath,
          isTypeOnly: item.isTypeOnly,
        })
      })
      .filter(Boolean)

    const exportNodes = file.exports
      .map((item) => {
        const exportPath = item.path

        const hasExtname = !!path.extname(exportPath)

        return module.factory.createExportDeclaration({
          name: item.name,
          path: options.extname && hasExtname ? `${trimExtName(item.path)}${options.extname}` : trimExtName(item.path),
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        })
      })
      .filter(Boolean)

    return [file.banner, module.print([...importNodes, ...exportNodes]), source, file.footer].join('\n')
  },
})

const tsxParser = createFileParser({
  async format(source) {
    const module = await import('@kubb/parser-ts')
    //4 = tsx
    return module.format(source)
  },
  async print(file, options = { extname: '.tsx' }) {
    return typeScriptParser.print(file, options)
  },
})

const defaultParser = createFileParser({
  async format(source) {
    return source
  },
  async print(file) {
    return file.sources.map((item) => item.value).join('\n\n')
  },
})

const parsers: Record<KubbFile.Extname, ParserModule<any>> = {
  '.ts': typeScriptParser,
  '.js': typeScriptParser,
  '.jsx': tsxParser,
  '.tsx': tsxParser,
  '.json': defaultParser,
}

export async function getFileParser<TMeta extends object = object>(extname: KubbFile.Extname | undefined): Promise<ParserModule<TMeta>> {
  if (!extname) {
    return defaultParser
  }

  const parser = parsers[extname]

  if (!parser) {
    console.warn(`[parser] No parser found for ${extname}, default parser will be used`)
  }

  return parser || defaultParser
}

function trimExtName(text: string): string {
  const extname = text.split('.').pop()

  return text.replace(`.${extname}`, '')
}
