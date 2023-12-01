/* eslint-disable @typescript-eslint/no-namespace */
import crypto from 'node:crypto'
import { extname, resolve } from 'node:path'

import { print } from '@kubb/parser'
import * as factory from '@kubb/parser/factory'

import isEqual from 'lodash.isequal'
import { orderBy } from 'natural-orderby'

import transformers from './transformers/index.ts'
import { getRelativePath, read } from './utils/read.ts'
import { timeout } from './utils/timeout.ts'
import { write } from './utils/write.ts'
import { BarrelManager } from './BarrelManager.ts'

import type { GreaterThan } from '@kubb/types'
import type { BarrelManagerOptions } from './BarrelManager.ts'
import type { KubbPlugin } from './types.ts'
import type { Queue, QueueJob } from './utils/Queue.ts'

type BasePath<T extends string = string> = `${T}/`

export namespace KubbFile {
  export type Import = {
    /**
     * Import name to be used
     * @example ["useState"]
     * @example "React"
     */
    name:
      | string
      | Array<
        string | {
          propertyName: string
          name?: string
        }
      >
    /**
     * Path for the import
     * @xample '@kubb/core'
     */
    path: string
    /**
     * Add `type` prefix to the import, this will result in: `import type { Type } from './path'`.
     */
    isTypeOnly?: boolean
    /**
     * Add `* as` prefix to the import, this will result in: `import * as path from './path'`.
     */
    isNameSpace?: boolean
    /**
     * When root is set it will get the path with relative getRelativePath(root, path).
     */
    root?: string
  }

  export type Export = {
    /**
     * Export name to be used.
     * @example ["useState"]
     * @example "React"
     */
    name?: string | Array<string>
    /**
     * Path for the import.
     * @xample '@kubb/core'
     */
    path: string
    /**
     * Add `type` prefix to the export, this will result in: `export type { Type } from './path'`.
     */
    isTypeOnly?: boolean
    /**
     * Make it possible to override the name, this will result in: `export * as aliasName from './path'`.
     */
    asAlias?: boolean
  }

  export declare const dataTagSymbol: unique symbol
  export type DataTag<Type, Value> = Type & {
    [dataTagSymbol]: Value
  }

  export type UUID = string
  export type Source = string

  export type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

  export type Mode = 'file' | 'directory'

  /**
   * Name to be used to dynamicly create the baseName(based on input.path)
   * Based on UNIX basename
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  export type BaseName = `${string}${Extname}`

  /**
   * Path will be full qualified path to a specified file
   */
  export type Path = string

  export type AdvancedPath<T extends BaseName = BaseName> = `${BasePath}${T}`

  export type OptionalPath = Path | undefined | null

  export type FileMetaBase = {
    pluginKey?: KubbPlugin['key']
  }

  export type File<
    TMeta extends FileMetaBase = FileMetaBase,
    TBaseName extends BaseName = BaseName,
  > = {
    /**
     * Unique identifier to reuse later
     * @default crypto.randomUUID()
     */
    id?: string
    /**
     * Name to be used to create the path
     * Based on UNIX basename, `${name}.extName`
     * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
     */
    baseName: TBaseName
    /**
     * Path will be full qualified path to a specified file
     */
    path: AdvancedPath<TBaseName> | Path
    source: Source
    imports?: Import[]
    exports?: Export[]
    /**
     * This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists
     * This will also ignore the combinefiles utils
     * @default `false`
     */
    override?: boolean
    /**
     * Use extra meta, this is getting used to generate the barrel/index files.
     */
    meta?: TMeta
    /**
     * This will override `process.env[key]` inside the `source`, see `getFileSource`.
     */
    env?: NodeJS.ProcessEnv
  }

  export type ResolvedFile<
    TMeta extends FileMetaBase = FileMetaBase,
    TBaseName extends BaseName = BaseName,
  > = KubbFile.File<TMeta, TBaseName> & {
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
}

type CacheItem = KubbFile.ResolvedFile & {
  cancel?: () => void
}

type AddResult<T extends Array<KubbFile.File>> = Promise<
  Awaited<GreaterThan<T['length'], 1> extends true ? Promise<KubbFile.ResolvedFile[]> : Promise<KubbFile.ResolvedFile>>
>

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
    exportType?: 'barrel' | false
  }
  options?: BarrelManagerOptions
  meta?: KubbFile.File['meta']
}

type Options = {
  queue?: Queue
  task?: QueueJob<KubbFile.ResolvedFile>
  /**
   * Timeout between writes
   */
  timeout?: number
}

export class FileManager {
  #cache: Map<KubbFile.Path, CacheItem[]> = new Map()

  #task?: QueueJob<KubbFile.ResolvedFile>
  #isWriting = false
  /**
   * Timeout between writes
   */
  #timeout: number = 0
  #queue?: Queue

  constructor(options?: Options) {
    if (options) {
      this.#task = options.task
      this.#queue = options.queue
      this.#timeout = options.timeout || 0
    }

    return this
  }

  get files(): Array<KubbFile.File> {
    const files: Array<KubbFile.File> = []
    this.#cache.forEach((item) => {
      files.push(...item.flat(1))
    })

    return files
  }
  get isExecuting(): boolean {
    return this.#queue?.hasJobs ?? this.#isWriting ?? false
  }

  #validate(file: KubbFile.File): void {
    if (!file.path.toLowerCase().endsWith(file.baseName.toLowerCase())) {
      throw new Error(`${file.path} should end with the baseName ${file.baseName}`)
    }
  }

  async add<T extends Array<KubbFile.File> = Array<KubbFile.File>>(
    ...files: T
  ): AddResult<T> {
    const promises = files.map((file) => {
      // this.#validate(file)

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

  async #add(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
    const controller = new AbortController()
    const resolvedFile: KubbFile.ResolvedFile = { id: crypto.randomUUID(), name: transformers.trimExtName(file.baseName), ...file }

    this.#cache.set(resolvedFile.path, [{ cancel: () => controller.abort(), ...resolvedFile }])

    if (this.#queue) {
      await this.#queue.run(
        async () => {
          return this.#task?.(resolvedFile)
        },
        { controller },
      )
    }

    return resolvedFile
  }

  async #addOrAppend(file: KubbFile.File): Promise<KubbFile.ResolvedFile> {
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

  async addIndexes({ root, output, meta, options = {} }: AddIndexesProps): Promise<Array<KubbFile.File> | undefined> {
    const { exportType = 'barrel' } = output

    if (!exportType) {
      return undefined
    }

    const exportPath = output.path.startsWith('./') ? output.path : `./${output.path}`
    const barrelManager = new BarrelManager({ extName: output.extName, ...options })
    const files = barrelManager.getIndexes(resolve(root, output.path))

    if (!files) {
      return undefined
    }

    const rootFile: KubbFile.File = {
      path: resolve(root, 'index.ts'),
      baseName: 'index.ts',
      source: '',
      exports: [
        output.exportAs
          ? {
            name: output.exportAs,
            asAlias: true,
            path: exportPath,
            isTypeOnly: options.isTypeOnly,
          }
          : {
            path: exportPath,
            isTypeOnly: options.isTypeOnly,
          },
      ],
    }

    await this.#addOrAppend({
      ...rootFile,
      meta: meta ? meta : rootFile.meta,
    })

    return await Promise.all(
      files.map((file) => {
        return this.#addOrAppend({
          ...file,
          meta: meta ? meta : file.meta,
        })
      }),
    )
  }

  getCacheByUUID(UUID: KubbFile.UUID): KubbFile.File | undefined {
    let cache: KubbFile.File | undefined

    this.#cache.forEach((files) => {
      cache = files.find((item) => item.id === UUID)
    })
    return cache
  }

  get(path: KubbFile.Path): Array<KubbFile.File> | undefined {
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
    if (!this.#isWriting) {
      this.#isWriting = true

      const text = await write(...params)

      this.#isWriting = false
      return text
    }

    await timeout(this.#timeout)

    return this.write(...params)
  }

  async read(...params: Parameters<typeof read>): Promise<string> {
    return read(...params)
  }

  // statics

  static getSource<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase>(file: KubbFile.File<TMeta>): string {
    if (!FileManager.isExtensionAllowed(file.baseName)) {
      return file.source
    }

    const exports = file.exports ? combineExports(file.exports) : []
    const imports = file.imports ? combineImports(file.imports, exports, file.source) : []

    const importNodes = imports.filter(item => {
      // isImportNotNeeded
      // trim extName
      return item.path !== transformers.trimExtName(file.path)
    }).map((item) => {
      return factory.createImportDeclaration({
        name: item.name,
        path: item.root ? getRelativePath(item.root, item.path) : item.path,
        isTypeOnly: item.isTypeOnly,
      })
    })
    const exportNodes = exports.map((item) =>
      factory.createExportDeclaration({
        name: item.name,
        path: item.path,
        isTypeOnly: item.isTypeOnly,
        asAlias: item.asAlias,
      })
    )

    return [print([...importNodes, ...exportNodes]), getEnvSource(file.source, file.env)].join('\n')
  }
  static combineFiles<TMeta extends KubbFile.FileMetaBase = KubbFile.FileMetaBase>(files: Array<KubbFile.File<TMeta> | null>): Array<KubbFile.File<TMeta>> {
    return files.filter(Boolean).reduce((acc, file: KubbFile.File<TMeta>) => {
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
    }, [] as Array<KubbFile.File<TMeta>>)
  }
  static getMode(path: string | undefined | null): KubbFile.Mode {
    if (!path) {
      return 'directory'
    }
    return extname(path) ? 'file' : 'directory'
  }

  static get extensions(): Array<KubbFile.Extname> {
    return ['.js', '.ts', '.tsx']
  }

  static isExtensionAllowed(baseName: string): boolean {
    return FileManager.extensions.some((extension) => baseName.endsWith(extension))
  }
}

export function combineExports(exports: Array<KubbFile.Export>): Array<KubbFile.Export> {
  const combinedExports = orderBy(exports, [(v) => !v.isTypeOnly], ['asc']).reduce((prev, curr) => {
    const name = curr.name
    const prevByPath = prev.findLast((imp) => imp.path === curr.path)
    const prevByPathAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly)

    if (prevByPathAndIsTypeOnly) {
      // we already have an export that has the same path but uses `isTypeOnly` (export type ...)
      return prev
    }

    const uniquePrev = prev.findLast(
      (imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly && imp.asAlias === curr.asAlias,
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
  }, [] as Array<KubbFile.Export>)

  return orderBy(combinedExports, [(v) => !v.isTypeOnly, (v) => v.asAlias], ['desc', 'desc'])
}

export function combineImports(imports: Array<KubbFile.Import>, exports: Array<KubbFile.Export>, source?: string): Array<KubbFile.Import> {
  const combinedImports = orderBy(imports, [(v) => !v.isTypeOnly], ['asc']).reduce((prev, curr) => {
    let name = Array.isArray(curr.name) ? [...new Set(curr.name)] : curr.name

    const hasImportInSource = (importName: string) => {
      if (!source) {
        return true
      }

      const checker = (name?: string) => name && !!source.includes(name)
      return checker(importName) || exports.some(({ name }) => (Array.isArray(name) ? name.some(checker) : checker(name)))
    }

    if (Array.isArray(name)) {
      name = name.filter((item) => typeof item === 'string' ? hasImportInSource(item) : hasImportInSource(item.propertyName))
    }

    const prevByPath = prev.findLast((imp) => imp.path === curr.path && imp.isTypeOnly === curr.isTypeOnly)
    const uniquePrev = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly === curr.isTypeOnly)
    const prevByPathNameAndIsTypeOnly = prev.findLast((imp) => imp.path === curr.path && isEqual(imp.name, name) && imp.isTypeOnly)

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
  }, [] as Array<KubbFile.Import>)

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
      prev = transformers.searchAndReplace({ text: prev.replaceAll(`process.env.${key}`, replaceBy), replaceBy, prefix: 'process.env', key })
      // removes `declare const ...`
      prev = transformers.searchAndReplace({ text: prev.replaceAll(new RegExp(`(declare const).*\n`, 'ig'), ''), replaceBy, key })
    }

    return prev
  }, source)
}
