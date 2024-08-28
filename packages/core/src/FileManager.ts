import { extname, join, relative } from 'node:path'

import { orderBy } from 'natural-orderby'
import { isDeepEqual } from 'remeda'

import { getRelativePath, read, write } from '@kubb/fs'
import { BarrelManager } from './BarrelManager.ts'

import type * as KubbFile from '@kubb/fs/types'

import { trimExtName } from '@kubb/fs'
import type { ResolvedFile } from '@kubb/fs/types'
import type { GreaterThan } from '@kubb/types'
import PQueue from 'p-queue'
import type { Logger } from './logger.ts'
import type { Config, Plugin } from './types.ts'
import { createFile, getFileParser } from './utils'
import { type DirectoryTree, TreeNode, buildDirectoryTree } from './utils/TreeNode.ts'

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type AddResult<T extends Array<KubbFile.File>> = Promise<Awaited<GreaterThan<T['length'], 1> extends true ? Promise<ResolvedFile[]> : Promise<ResolvedFile>>>

type AddIndexesProps = {
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  files: KubbFile.File[]
  /**
   * Output for plugin
   */
  output: {
    path: string
    extName?: KubbFile.Extname
    exportAs?: string
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  group?: {
    output: string
    exportAs: string
  }
  logger?: Logger

  meta?: FileMetaBase
}

export class FileManager {
  #filesByPath: Map<KubbFile.Path, KubbFile.ResolvedFile> = new Map()
  #files: Set<KubbFile.ResolvedFile> = new Set()
  constructor() {
    return this
  }

  get files(): Array<KubbFile.ResolvedFile> {
    return Array.from(this.#files)
  }

  get orderedFiles(): Array<KubbFile.ResolvedFile> {
    return orderBy(Array.from(this.#files), [
      (v) => v?.meta && 'pluginKey' in v.meta && !v.meta.pluginKey,
      (v) => v.path.length,
      (v) => trimExtName(v.path).endsWith('index'),
      (v) => trimExtName(v.baseName),
      (v) => v.path.split('.').pop(),
    ])
  }

  get groupedFiles(): DirectoryTree | null {
    return buildDirectoryTree(Array.from(this.#files))
  }

  get treeNode(): TreeNode | null {
    return TreeNode.build(Array.from(this.#files))
  }

  async add<T extends Array<KubbFile.File> = Array<KubbFile.File>>(...files: T): AddResult<T> {
    const promises = files.map((file) => {
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

  async #add(file: KubbFile.File): Promise<ResolvedFile> {
    const resolvedFile = createFile(file)

    this.#filesByPath.set(resolvedFile.path, resolvedFile)
    this.#files.add(resolvedFile)

    return resolvedFile
  }

  async #addOrAppend(file: KubbFile.File): Promise<ResolvedFile> {
    const previousFile = this.#filesByPath.get(file.path)

    if (previousFile) {
      this.#filesByPath.delete(previousFile.path)
      this.#files.delete(previousFile)

      return this.#add(mergeFile(previousFile, file))
    }
    return this.#add(file)
  }

  getCacheById(id: string): KubbFile.File | undefined {
    let cache: KubbFile.File | undefined

    this.#files.forEach((file) => {
      if (file.id === id) {
        cache = file
      }
    })
    return cache
  }

  getByPath(path: KubbFile.Path): KubbFile.ResolvedFile | undefined {
    return this.#filesByPath.get(path)
  }

  deleteByPath(path: KubbFile.Path): void {
    const cacheItem = this.getByPath(path)
    if (!cacheItem) {
      return
    }

    this.#filesByPath.delete(path)
    this.#files.delete(cacheItem)
  }

  async getBarrelFiles({ files, meta, root, output, logger }: AddIndexesProps): Promise<KubbFile.File[]> {
    const { exportType = 'barrelNamed' } = output
    const barrelManager = new BarrelManager({ logger })

    if (exportType === false) {
      return []
    }

    const pathToBuildFrom = join(root, output.path)

    if (trimExtName(pathToBuildFrom).endsWith('index')) {
      logger?.emit('warning', 'Output has the same fileName as the barrelFiles, please disable barrel generation')

      return []
    }

    const barrelFiles = barrelManager.getFiles(files, pathToBuildFrom)

    const rootPath = join(root, 'index.ts')
    const rootFile: KubbFile.File = {
      path: rootPath,
      baseName: 'index.ts',
      exports: barrelFiles
        // .filter((file) => !file.path.endsWith('index.ts'))
        .flatMap((file) =>
          file.exports?.map((exportItem) =>
            exportItem?.path
              ? {
                  path: getRelativePath(rootPath, file.path),
                  name: exportItem.name,
                  isTypeOnly: exportItem.isTypeOnly,
                  extName: output.extName,
                }
              : undefined,
          ),
        )
        .filter(Boolean),
      sources: [],
      meta,
    }

    if (exportType === 'barrel') {
      return [rootFile, ...barrelFiles].map((file) => {
        return {
          ...file,
          exports: file.exports?.map((exportItem) => {
            return {
              ...exportItem,
              name: undefined,
            }
          }),
        }
      })
    }

    return [rootFile, ...barrelFiles].map((indexFile) => {
      return {
        ...indexFile,
        meta,
      }
    })
  }

  async write(...params: Parameters<typeof write>): ReturnType<typeof write> {
    return write(...params)
  }

  async read(...params: Parameters<typeof read>): ReturnType<typeof read> {
    return read(...params)
  }

  // statics
  static getMode(path: string | undefined | null): KubbFile.Mode {
    if (!path) {
      return 'split'
    }
    return extname(path) ? 'single' : 'split'
  }
}

type GetSourceOptions = {
  logger?: Logger
}

export async function getSource<TMeta extends FileMetaBase = FileMetaBase>(file: ResolvedFile<TMeta>, { logger }: GetSourceOptions = {}): Promise<string> {
  const parser = await getFileParser(file.extName, { logger })

  return parser.print(file)
}

export function mergeFile<TMeta extends FileMetaBase = FileMetaBase>(a: KubbFile.File<TMeta>, b: KubbFile.File<TMeta>): KubbFile.File<TMeta> {
  return {
    ...a,
    sources: [...(a.sources || []), ...(b.sources || [])],
    imports: [...(a.imports || []), ...(b.imports || [])],
    exports: [...(a.exports || []), ...(b.exports || [])],
  }
}

export function combineSources(sources: Array<KubbFile.Source>): Array<KubbFile.Source> {
  return sources.reduce(
    (prev, curr) => {
      const prevByName = prev.findLast((imp) => imp.name === curr.name)
      const prevByPathAndIsExportable = prev.findLast((imp) => imp.name === curr.name && imp.isExportable)

      if (prevByPathAndIsExportable) {
        // we already have an export that has the same name but uses `isExportable` (export type ...)
        return [...prev, curr]
      }

      if (prevByName) {
        prevByName.value = curr.value
        prevByName.isExportable = curr.isExportable
        prevByName.isTypeOnly = curr.isTypeOnly

        return prev
      }

      return [...prev, curr]
    },
    [] as Array<KubbFile.Source>,
  )
}

export function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
  const combinedExports = exports.reduce(
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

  return orderBy(combinedExports, [(v) => v.isTypeOnly, (v) => v.path, (v) => v.name])
}

export function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
  const combinedImports = imports.reduce(
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

  return orderBy(combinedImports, [(v) => v.isTypeOnly, (v) => v.path, (v) => v.name])
}
type WriteFilesProps = {
  config: Config
  files: Array<KubbFile.ResolvedFile>
  logger: Logger
  dryRun?: boolean
}
/**
 * Global queue
 */
const queue = new PQueue({ concurrency: 100 })

export async function processFiles({ dryRun, config, logger, files }: WriteFilesProps) {
  const orderedFiles = orderBy(files, [
    (v) => v?.meta && 'pluginKey' in v.meta && !v.meta.pluginKey,
    (v) => v.path.length,
    (v) => trimExtName(v.path).endsWith('index'),
  ])

  logger.emit('debug', {
    logs: [JSON.stringify({ files: orderedFiles }, null, 2)],
    fileName: 'kubb-files.json',
    override: true,
  })

  if (!dryRun) {
    const size = orderedFiles.length

    logger.emit('progress_start', { id: 'files', size })
    const promises = orderedFiles.map(async (file) => {
      await queue.add(async () => {
        const source = await getSource(file, { logger })

        await write(file.path, source, { sanity: false })

        logger.emit('progress', { id: 'files', data: file ? relative(config.root, file.path) : '' })
      })
    })

    await Promise.all(promises)

    logger.emit('progress_stop', { id: 'files' })
  }

  return files
}
