import crypto from 'node:crypto'
import { extname, resolve } from 'node:path'

import { orderBy } from 'natural-orderby'
import PQueue from 'p-queue'
import { isDeepEqual } from 'remeda'

import { getRelativePath, read, write } from '@kubb/fs'
import { BarrelManager } from './BarrelManager.ts'
import { searchAndReplace } from './transformers/searchAndReplace.ts'
import { trimExtName } from './transformers/trim.ts'

import type * as KubbFile from '@kubb/fs/types'

import type { BaseName, File, UUID } from '@kubb/fs/src/types.ts'
import type { GreaterThan } from '@kubb/types'
import type { BarrelManagerOptions } from './BarrelManager.ts'
import type { Logger } from './logger.ts'
import transformers from './transformers/index.ts'
import type { Plugin } from './types.ts'
import { getParser } from './utils'

export type ResolvedFile<TMeta extends FileMetaBase = FileMetaBase, TBaseName extends BaseName = BaseName> = File<TMeta, TBaseName> & {
  /**
   * @default crypto.randomUUID()
   */
  id: UUID
  /**
   * Contains the first part of the baseName, generated based on baseName
   * @link  https://nodejs.org/api/path.html#pathformatpathobject
   */

  name: string
}

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type FileWithMeta<TMeta extends FileMetaBase = FileMetaBase> = KubbFile.File<TMeta>

type CacheItem = ResolvedFile & {
  cancel?: () => void
}

type AddResult<T extends Array<FileWithMeta>> = Promise<Awaited<GreaterThan<T['length'], 1> extends true ? Promise<ResolvedFile[]> : Promise<ResolvedFile>>>

type AddIndexesProps = {
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  /**
   * Output for plugin
   */
  output: {
    path: string
    exportAs?: string
    extName?: KubbFile.Extname
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  logger: Logger
  options?: BarrelManagerOptions
  meta?: FileWithMeta['meta']
}

type Options = {
  queue?: PQueue
  task?: (file: ResolvedFile) => Promise<ResolvedFile>
}

export class FileManager {
  #cache: Map<KubbFile.Path, CacheItem[]> = new Map()

  #task: Options['task']
  #queue: PQueue

  constructor({ task = async (file) => file, queue = new PQueue() }: Options = {}) {
    this.#task = task
    this.#queue = queue

    return this
  }

  get files(): Array<FileWithMeta> {
    const files: Array<FileWithMeta> = []
    this.#cache.forEach((item) => {
      files.push(...item.flat(1))
    })

    return files
  }
  get isExecuting(): boolean {
    return this.#queue.size !== 0 && this.#queue.pending !== 0
  }

  async add<T extends Array<FileWithMeta> = Array<FileWithMeta>>(...files: T): AddResult<T> {
    const promises = combineFiles(files).map((file) => {
      if (file.override) {
        return this.#add(file)
      }

      return this.#addOrAppend(file)
    })

    const resolvedFiles = await Promise.all(promises)

    if (files.length > 1) {
      return resolvedFiles as unknown as AddResult<T>
    }

    return resolvedFiles[0] as unknown as AddResult<T>
  }

  async #add(file: FileWithMeta): Promise<ResolvedFile> {
    const controller = new AbortController()
    const resolvedFile: ResolvedFile = {
      id: crypto.randomUUID(),
      name: trimExtName(file.baseName),
      ...file,
    }

    if (resolvedFile.exports?.length) {
      const folder = resolvedFile.path.replace(resolvedFile.baseName, '')

      resolvedFile.exports = resolvedFile.exports.filter((exportItem) => {
        const exportedFile = this.files.find((file) => file.path.includes(resolve(folder, exportItem.path)))

        if (exportedFile) {
          return exportedFile.exportable
        }

        return true
      })
    }

    this.#cache.set(resolvedFile.path, [{ cancel: () => controller.abort(), ...resolvedFile }])

    return this.#queue.add(
      async () => {
        return this.#task?.(resolvedFile)
      },
      { signal: controller.signal },
    ) as Promise<ResolvedFile>
  }

  async #addOrAppend(file: FileWithMeta): Promise<ResolvedFile> {
    const previousCaches = this.#cache.get(file.path)
    const previousCache = previousCaches ? previousCaches.at(previousCaches.length - 1) : undefined

    if (previousCache) {
      this.#cache.delete(previousCache.path)

      return this.#add({
        ...file,
        source: previousCache.source && file.source ? `${previousCache.source}\n${file.source}` : '',
        imports: [...(previousCache.imports || []), ...(file.imports || [])],
        exports: [...(previousCache.exports || []), ...(file.exports || [])],
        env: { ...(previousCache.env || {}), ...(file.env || {}) },
      })
    }
    return this.#add(file)
  }

  async addIndexes({ root, output, meta, logger, options = {} }: AddIndexesProps): Promise<void> {
    const { exportType = 'barrel' } = output
    //        ^?
    if (exportType === false) {
      return undefined
    }

    const pathToBuildFrom = resolve(root, output.path)

    if (transformers.trimExtName(pathToBuildFrom).endsWith('index')) {
      logger.emit('warning', 'Output has the same fileName as the barrelFiles, please disable barrel generation')
      return
    }

    const exportPath = output.path.startsWith('./') ? trimExtName(output.path) : `./${trimExtName(output.path)}`
    const mode = FileManager.getMode(output.path)
    const barrelManager = new BarrelManager({
      extName: output.extName,
      ...options,
    })
    let files = barrelManager.getIndexes(pathToBuildFrom)

    if (!files) {
      return undefined
    }

    if (exportType === 'barrelNamed') {
      files = files.map((file) => {
        if (file.exports) {
          return {
            ...file,
            exports: barrelManager.getNamedExports(pathToBuildFrom, file.exports),
          }
        }
        return file
      })
    }

    await Promise.all(
      files.map((file) => {
        return this.#addOrAppend({
          ...file,
          meta: meta ? meta : file.meta,
        })
      }),
    )

    const rootPath = mode === 'split' ? `${exportPath}/index${output.extName || ''}` : `${exportPath}${output.extName || ''}`
    const rootFile: FileWithMeta = {
      path: resolve(root, 'index.ts'),
      baseName: 'index.ts',
      source: '',
      exports: [
        output.exportAs
          ? {
              name: output.exportAs,
              asAlias: true,
              path: rootPath,
              isTypeOnly: options.isTypeOnly,
            }
          : {
              path: rootPath,
              isTypeOnly: options.isTypeOnly,
            },
      ],
      exportable: true,
    }

    if (exportType === 'barrelNamed' && !output.exportAs && rootFile.exports?.[0]) {
      rootFile.exports = barrelManager.getNamedExport(root, rootFile.exports[0])
    }

    await this.#addOrAppend({
      ...rootFile,
      meta: meta ? meta : rootFile.meta,
    })
  }

  getCacheByUUID(UUID: KubbFile.UUID): FileWithMeta | undefined {
    let cache: FileWithMeta | undefined

    this.#cache.forEach((files) => {
      cache = files.find((item) => item.id === UUID)
    })
    return cache
  }

  get(path: KubbFile.Path): Array<FileWithMeta> | undefined {
    return this.#cache.get(path)
  }

  remove(path: KubbFile.Path): void {
    const cacheItem = this.get(path)
    if (!cacheItem) {
      return
    }

    this.#cache.delete(path)
  }

  async write(...params: Parameters<typeof write>): Promise<string | undefined> {
    return write(...params)
  }

  async read(...params: Parameters<typeof read>): Promise<string> {
    return read(...params)
  }

  // statics

  static async getSource<TMeta extends FileMetaBase = FileMetaBase>(file: FileWithMeta<TMeta>): Promise<string> {
    return getSource<TMeta>(file)
  }

  static combineFiles<TMeta extends FileMetaBase = FileMetaBase>(files: Array<FileWithMeta<TMeta> | null>): Array<FileWithMeta<TMeta>> {
    return combineFiles<TMeta>(files)
  }
  static getMode(path: string | undefined | null): KubbFile.Mode {
    if (!path) {
      return 'split'
    }
    return extname(path) ? 'single' : 'split'
  }

  static get extensions(): Array<KubbFile.Extname> {
    return ['.js', '.ts', '.tsx']
  }

  static isJavascript(baseName: string): boolean {
    return FileManager.extensions.some((extension) => baseName.endsWith(extension))
  }
}

function combineFiles<TMeta extends FileMetaBase = FileMetaBase>(files: Array<FileWithMeta<TMeta> | null>): Array<FileWithMeta<TMeta>> {
  return files.filter(Boolean).reduce(
    (acc, file: FileWithMeta<TMeta>) => {
      const prevIndex = acc.findIndex((item) => item.path === file.path)

      if (prevIndex === -1) {
        return [...acc, file]
      }

      const prev = acc[prevIndex]

      if (prev && file.override) {
        acc[prevIndex] = {
          imports: [],
          exports: [],
          ...file,
        }
        return acc
      }

      if (prev) {
        acc[prevIndex] = {
          ...file,
          source: prev.source && file.source ? `${prev.source}\n${file.source}` : '',
          imports: [...(prev.imports || []), ...(file.imports || [])],
          exports: [...(prev.exports || []), ...(file.exports || [])],
          env: { ...(prev.env || {}), ...(file.env || {}) },
        }
      }

      return acc
    },
    [] as Array<FileWithMeta<TMeta>>,
  )
}

export async function getSource<TMeta extends FileMetaBase = FileMetaBase>(file: FileWithMeta<TMeta>): Promise<string> {
  // only use .js, .ts or .tsx files for ESM imports

  if (file.language ? !['typescript', 'javascript'].includes(file.language) : !FileManager.isJavascript(file.baseName)) {
    return file.source
  }

  const parser = await getParser(file.language)

  const exports = file.exports ? combineExports(file.exports) : []
  // imports should be defined and source should contain code or we have imports without them being used
  const imports = file.imports && file.source ? combineImports(file.imports, exports, file.source) : []

  const importNodes = imports
    .filter((item) => {
      const path = item.root ? getRelativePath(item.root, item.path) : item.path
      // trim extName
      return path !== trimExtName(file.path)
    })
    .map((item) => {
      const path = item.root ? getRelativePath(item.root, item.path) : item.path

      return parser.factory.createImportDeclaration({
        name: item.name,
        path: item.extName ? `${path}${item.extName}` : path,
        isTypeOnly: item.isTypeOnly,
      })
    })
  const exportNodes = exports.map((item) =>
    parser.factory.createExportDeclaration({
      name: item.name,
      path: item.extName ? `${item.path}${item.extName}` : item.path,
      isTypeOnly: item.isTypeOnly,
      asAlias: item.asAlias,
    }),
  )

  const source = [parser.print([...importNodes, ...exportNodes]), getEnvSource(file.source, file.env)].join('\n')

  // do some basic linting with the ts compiler
  return parser.print([], { source, noEmitHelpers: false })
}

export function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
  const combinedExports = orderBy(exports, [(v) => !v.isTypeOnly], ['asc']).reduce(
    (prev, curr) => {
      const name = curr.name
      const prevByPath = prev.findLast((imp) => imp.path === curr.path)
      const prevByPathAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isDeepEqual(imp.name, name) && imp.isTypeOnly)

      if (prevByPathAndIsTypeOnly) {
        // we already have an export that has the same path but uses `isTypeOnly` (export type ...)
        return prev
      }

      const uniquePrev = prev.findLast(
        (imp) => imp.path === curr.path && isDeepEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly && imp.asAlias === curr.asAlias,
      )

      if (uniquePrev || (Array.isArray(name) && !name.length) || (prevByPath?.asAlias && !curr.asAlias)) {
        return prev
      }

      if (!prevByPath) {
        return [
          ...prev,
          {
            ...curr,
            name: Array.isArray(name) ? [...new Set(name)] : name,
          },
        ]
      }

      if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(curr.name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
        prevByPath.name = [...new Set([...prevByPath.name, ...curr.name])]

        return prev
      }

      return [...prev, curr]
    },
    [] as Array<KubbFile.Export>,
  )

  return orderBy(combinedExports, [(v) => !v.isTypeOnly, (v) => v.asAlias], ['desc', 'desc'])
}

export function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
  const combinedImports = orderBy(imports, [(v) => !v.isTypeOnly], ['asc']).reduce(
    (prev, curr) => {
      let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

      const hasImportInSource = (importName: string) => {
        if (!source) {
          return true
        }

        const checker = (name?: string) => name && !!source.includes(name)

        return checker(importName) || exports.some(({ name }) => (Array.isArray(name) ? name.some(checker) : checker(name)))
      }

      if (curr.path === curr.root) {
        // root and path are the same file, remove the "./" import
        return prev
      }

      if (Array.isArray(name)) {
        name = name.filter((item) => (typeof item === 'string' ? hasImportInSource(item) : hasImportInSource(item.propertyName)))
      }

      const prevByPath = prev.findLast((imp) => imp.path === curr.path && imp.isTypeOnly === curr.isTypeOnly)
      const uniquePrev = prev.findLast((imp) => imp.path === curr.path && isDeepEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly)
      const prevByPathNameAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isDeepEqual(imp.name, name) && imp.isTypeOnly)

      if (prevByPathNameAndIsTypeOnly) {
        // we already have an export that has the same path but uses `isTypeOnly` (import type ...)
        return prev
      }

      if (uniquePrev || (Array.isArray(name) && !name.length)) {
        return prev
      }

      if (!prevByPath) {
        return [
          ...prev,
          {
            ...curr,
            name,
          },
        ]
      }

      if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
        prevByPath.name = [...new Set([...prevByPath.name, ...name])]

        return prev
      }

      if (!Array.isArray(name) && name && !hasImportInSource(name)) {
        return prev
      }

      return [...prev, curr]
    },
    [] as Array<KubbFile.Import>,
  )

  return orderBy(combinedImports, [(v) => !v.isTypeOnly], ['desc'])
}

function getEnvSource(source: string, env: NodeJS.ProcessEnv | undefined): string {
  if (!env) {
    return source
  }

  const keys = Object.keys(env)

  if (!keys.length) {
    return source
  }

  return keys.reduce((prev, key: string) => {
    const environmentValue = env[key]
    const replaceBy = environmentValue ? `'${environmentValue.replaceAll('"', '')?.replaceAll("'", '')}'` : 'undefined'

    if (key.toUpperCase() !== key) {
      throw new TypeError(`Environment should be in upperCase for ${key}`)
    }

    if (typeof replaceBy === 'string') {
      prev = searchAndReplace({
        text: prev.replaceAll(`process.env.${key}`, replaceBy),
        replaceBy,
        prefix: 'process.env',
        key,
      })
      // removes `declare const ...`
      prev = searchAndReplace({
        text: prev.replaceAll(/(declare const).*\n/gi, ''),
        replaceBy,
        key,
      })
    }

    return prev
  }, source)
}
