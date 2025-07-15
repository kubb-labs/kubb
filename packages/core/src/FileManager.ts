import { extname, join, relative } from 'node:path'

import { orderBy } from 'natural-orderby'
import { isDeepEqual, uniqueBy } from 'remeda'
import pLimit from 'p-limit';


import { BarrelManager } from './BarrelManager.ts'

import type { KubbFile } from './fs/index.ts'
import { trimExtName, write } from './fs/index.ts'
import type { ResolvedFile } from './fs/types.ts'
import type { Logger } from './logger.ts'
import type { BarrelType, Config, Plugin } from './types.ts'
import { ContentCache, createFile, getFileParser } from './utils'
import type { GreaterThan } from './utils/types.ts'

export type FileMetaBase = {
  pluginKey?: Plugin['key']
}

type AddResult<T extends Array<KubbFile.File>> = Promise<Awaited<GreaterThan<T['length'], 1> extends true ? Promise<ResolvedFile[]> : Promise<ResolvedFile>>>

type AddIndexesProps = {
  type: BarrelType | false | undefined
  /**
   * Root based on root and output.path specified in the config
   */
  root: string
  /**
   * Output for plugin
   */
  output: {
    path: string
  }
  group?: {
    output: string
    exportAs: string
  }
  logger?: Logger

  meta?: FileMetaBase
}

type WriteFilesProps = {
  root: Config['root']
  extension?: Record<KubbFile.Extname, KubbFile.Extname | ''>
  logger?: Logger
  dryRun?: boolean
}

export class FileManager {
  #cache = new ContentCache<KubbFile.ResolvedFile>()
  #limit = pLimit(100);

  constructor() {
    return this
  }

  async add<T extends Array<KubbFile.File> = Array<KubbFile.File>>(...files: T): AddResult<T> {
    const resolvedFiles: KubbFile.ResolvedFile[] = [];

    const mergedFiles = new Map<string, KubbFile.File>();

    files.forEach((file) => {
      const existing = mergedFiles.get(file.path);
      if (existing) {
        mergedFiles.set(file.path, mergeFile(existing, file));
      } else {
        mergedFiles.set(file.path, file);
      }
    })

    for (const file of mergedFiles.values()) {
      const existing = await this.#cache.get(file.path);

      const merged = existing ? mergeFile(existing, file) : file;
      const resolvedFile = createFile(merged);

      await this.#cache.set(resolvedFile.path, resolvedFile);

      resolvedFiles.push(resolvedFile);
    }

    if (files.length > 1) {
      return resolvedFiles as unknown as AddResult<T>;
    }

    return resolvedFiles[0] as unknown as AddResult<T>;
  }

  async getByPath(path: KubbFile.Path): Promise<KubbFile.ResolvedFile | null> {
    return this.#cache.get(path)
  }

  async deleteByPath(path: KubbFile.Path): Promise<void> {
    await this.#cache.delete(path)
  }

  async clear(): Promise<void> {
    await this.#cache.clear()
  }

  async getFiles(): Promise<Array<KubbFile.ResolvedFile>> {
    const cachedKeys = await this.#cache.keys()

    // order by path length and if file is a barrel file
    const keys =  orderBy(cachedKeys, [
      (v) => v.length,
      (v) => trimExtName(v).endsWith('index'),
    ])

    const files = await Promise.all(
      keys.map(async (key) => {
        return this.#limit(async ()=> {
          const file = await this.#cache.get(key)
          return file as KubbFile.ResolvedFile
        })
      }),
    )

    return files.filter(Boolean)
  }

  async processFiles({ dryRun, root, extension, logger }: WriteFilesProps): Promise<Array<KubbFile.ResolvedFile>> {
    const files= await this.getFiles()

    logger?.emit('progress_start', { id: 'files', size: files.length, message: 'Writing files ...' })

    const promises = files.map((file) => {
      return this.#limit(async () => {
        const message = file ? `Writing ${relative(root, file.path)}` : ''
        const extname = extension?.[file.extname] || undefined

        if(!dryRun){
          const source = await getSource(file, { logger, extname })
          await write(file.path, source, { sanity: false })
          // await this.#cache.delete(file.path)
        }

        logger?.emit('progressed', { id: 'files', message })
      })
    })

    await Promise.all(promises)

    logger?.emit('progress_stop', { id: 'files' })

    return files
  }
  async getBarrelFiles({ type, meta = {}, root, output, logger }: AddIndexesProps): Promise<KubbFile.File[]> {
    if (!type || type === 'propagate') {
      return []
    }

    const barrelManager = new BarrelManager({ logger })
    const files = await this.getFiles()

    const pathToBuildFrom = join(root, output.path)

    if (trimExtName(pathToBuildFrom).endsWith('index')) {
      logger?.emit('warning', 'Output has the same fileName as the barrelFiles, please disable barrel generation')

      return []
    }

    const barrelFiles = barrelManager.getFiles({ files, root: pathToBuildFrom, meta })

    if (type === 'all') {
      return barrelFiles.map((file) => {
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

    return barrelFiles.map((indexFile) => {
      return {
        ...indexFile,
        meta,
      }
    })
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
  extname?: KubbFile.Extname
  logger?: Logger
}

export async function getSource<TMeta extends FileMetaBase = FileMetaBase>(
  file: ResolvedFile<TMeta>,
  { logger, extname }: GetSourceOptions = {},
): Promise<string> {
  const parser = await getFileParser(file.extname)
  const source = await parser.print(file, { logger, extname })

  return parser.format(source).catch((err) => {
    console.warn(err)
    return source
  })
}


function mergeFile<TMeta extends FileMetaBase = FileMetaBase>(a: KubbFile.File<TMeta>, b: KubbFile.File<TMeta>): KubbFile.File<TMeta> {
  return {
    ...a,
    sources: [...(a.sources || []), ...(b.sources || [])],
    imports: [...(a.imports || []), ...(b.imports || [])],
    exports: [...(a.exports || []), ...(b.exports || [])],
  }
}

export function combineSources(sources: Array<KubbFile.Source>): Array<KubbFile.Source> {
  return uniqueBy(sources, (obj) => [obj.name, obj.isExportable, obj.isTypeOnly] as const)
}

export function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
  return orderBy(exports, [
    (v) => !!Array.isArray(v.name),
    (v) => !v.isTypeOnly,
    (v) => v.path,
    (v) => !!v.name,
    (v) => (Array.isArray(v.name) ? orderBy(v.name) : v.name),
  ]).reduce(
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

      // we already have an item that was unique enough or name field is empty or prev asAlias is set but current has no changes
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

      // merge all names when prev and current both have the same isTypeOnly set
      if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(curr.name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
        prevByPath.name = [...new Set([...prevByPath.name, ...curr.name])]

        return prev
      }

      return [...prev, curr]
    },
    [] as Array<KubbFile.Export>,
  )
}

export function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
  return orderBy(imports, [
    (v) => !!Array.isArray(v.name),
    (v) => !v.isTypeOnly,
    (v) => v.path,
    (v) => !!v.name,
    (v) => (Array.isArray(v.name) ? orderBy(v.name) : v.name),
  ]).reduce(
    (prev, curr) => {
      let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

      const hasImportInSource = (importName: string) => {
        if (!source) {
          return true
        }

        const checker = (name?: string) => {
          return name && source.includes(name)
        }

        return checker(importName) || exports.some(({ name }) => (Array.isArray(name) ? name.some(checker) : checker(name)))
      }

      if (curr.path === curr.root) {
        // root and path are the same file, remove the "./" import
        return prev
      }

      // merge all names and check if the importName is being used in the generated source and if not filter those imports out
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

      // already unique enough or name is empty
      if (uniquePrev || (Array.isArray(name) && !name.length)) {
        return prev
      }

      // new item, append name
      if (!prevByPath) {
        return [
          ...prev,
          {
            ...curr,
            name,
          },
        ]
      }

      // merge all names when prev and current both have the same isTypeOnly set
      if (prevByPath && Array.isArray(prevByPath.name) && Array.isArray(name) && prevByPath.isTypeOnly === curr.isTypeOnly) {
        prevByPath.name = [...new Set([...prevByPath.name, ...name])]

        return prev
      }

      // no import was found in the source, ignore import
      if (!Array.isArray(name) && name && !hasImportInSource(name)) {
        return prev
      }

      return [...prev, curr]
    },
    [] as Array<KubbFile.Import>,
  )
}
