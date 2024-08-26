import { extname, resolve } from 'node:path'

import { orderBy } from 'natural-orderby'
import { isDeepEqual } from 'remeda'

import { getRelativePath, read, write } from '@kubb/fs'
import { BarrelManager } from './BarrelManager.ts'

import type * as KubbFile from '@kubb/fs/types'

import type { GreaterThan } from '@kubb/types'
import type { BarrelManagerOptions } from './BarrelManager.ts'
import type { Logger } from './logger.ts'
import type { Plugin } from './types.ts'
import PQueue from 'p-queue'
import { buildDirectoryTree, type DirectoryTree, TreeNode } from './utils/TreeNode.ts'
import type { ResolvedFile } from '@kubb/fs/types'
import { trimExtName } from '@kubb/fs'
import { createFile, getFileParser } from './utils'

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type AddResult<T extends Array<KubbFile.File>> = Promise<Awaited<GreaterThan<T['length'], 1> extends true ? Promise<ResolvedFile[]> : Promise<ResolvedFile>>>

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
    extName?: string
    exportType?: 'barrel' | 'barrelNamed' | false
  }
  group?: {
    output: string
    exportAs: string
  }
  logger: Logger
  files: KubbFile.File[]
  options?: BarrelManagerOptions
  plugin: Plugin
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

      return this.#add({
        ...file,
        sources: [...(previousFile.sources || []), ...(file.sources || [])],
        imports: [...(previousFile.imports || []), ...(file.imports || [])],
        exports: [...(previousFile.exports || []), ...(file.exports || [])],
      })
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

  async getIndexFiles({ files, plugin, root, output, logger, options = {} }: AddIndexesProps): Promise<KubbFile.File[]> {
    const { exportType = 'barrel' } = output
    if (exportType === false) {
      return []
    }

    const pathToBuildFrom = resolve(root, output.path)

    if (trimExtName(pathToBuildFrom).endsWith('index')) {
      logger.emit('warning', 'Output has the same fileName as the barrelFiles, please disable barrel generation')
      return []
    }

    const exportPath = output.path.startsWith('./') ? output.path : `./${output.path}`
    const mode = FileManager.getMode(output.path)
    const barrelManager = new BarrelManager({ ...options, extName: output.extName })

    let indexFiles = barrelManager.getIndexes(files, pathToBuildFrom)

    if (!indexFiles) {
      return []
    }

    const rootPath = mode === 'split' ? `${exportPath}/index${output.extName || ''}` : `${exportPath}${output.extName || ''}`
    const rootFile: KubbFile.File = {
      path: resolve(root, 'index.ts'),
      baseName: 'index.ts',
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
      sources: [],
      meta: {
        pluginKey: plugin.key,
      },
    }

    if (exportType === 'barrel') {
      indexFiles = indexFiles.map((file) => {
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

      rootFile.exports = rootFile.exports?.map((item) => {
        return {
          ...item,
          name: undefined,
        }
      })
    }

    return [
      ...indexFiles.map((indexFile) => {
        return {
          ...indexFile,
          meta: {
            pluginKey: plugin.key,
          },
        }
      }),
      rootFile,
    ]
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

export async function getSource<TMeta extends FileMetaBase = FileMetaBase>(file: KubbFile.File<TMeta> | ResolvedFile<TMeta>): Promise<string> {
  const parser = await getFileParser(file.extName)

  const source = file.sources.map((item) => item.value).join('\n\n')
  const exports = file.exports ? combineExports(file.exports) : []
  // imports should be defined and source should contain code or we have imports without them being used
  const imports = file.imports && source ? combineImports(file.imports, exports, source) : []

  const importNodes = imports
    .filter((item) => {
      const path = item.root ? getRelativePath(item.root, item.path) : item.path
      // trim extName
      return path !== trimExtName(file.path)
    })
    .map((item) => {
      const path = item.root ? getRelativePath(item.root, item.path) : item.path

      return parser.createImport({
        name: item.name,
        path: item.extName ? `${path}${item.extName}` : path,
        isTypeOnly: item.isTypeOnly,
      })
    })
  const exportNodes = exports
    .map((item) => {
      if (item.path) {
        return parser.createExport({
          name: item.name,
          path: item.extName ? `${item.path}${item.extName}` : item.path,
          isTypeOnly: item.isTypeOnly,
          asAlias: item.asAlias,
        })
      }
    })
    .filter(Boolean)

  return parser.print({
    imports: importNodes,
    exports: exportNodes,
    source,
  })
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

  return orderBy(combinedExports, [(v) => !v.isTypeOnly, (v) => v.asAlias])
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

  return orderBy(combinedImports, [(v) => !v.isTypeOnly])
}

type WriteFilesProps = {
  files: Array<KubbFile.ResolvedFile>
  logger: Logger
  dryRun?: boolean
}
/**
 * Global queue
 */
const queue = new PQueue({ concurrency: 10 })

export async function processFiles({ dryRun, logger, files }: WriteFilesProps) {
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
    logger.consola?.pauseLogs()
    const size = orderedFiles.length

    const promises = orderedFiles.map(async (file, index) => {
      await queue.add(async () => {
        logger.emit('progress', { count: index, size, file })
        const source = await getSource(file)

        await write(file.path, source, { sanity: false })
        await new Promise((resolve) => {
          setTimeout(resolve, 0)
        })
        logger.emit('progress', { count: index + 1, size, file })
      })
    })

    await Promise.all(promises)

    logger.consola?.resumeLogs()
  }

  return files
}
