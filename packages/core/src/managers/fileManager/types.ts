/* eslint-disable @typescript-eslint/no-namespace */

import type { KubbPlugin } from '../../types.ts'

type BasePath<T extends string = string> = `${T}/`

type ArrayWithLength<T extends number, U extends any[] = []> = U['length'] extends T ? U : ArrayWithLength<T, [true, ...U]>
type GreaterThan<T extends number, U extends number> = ArrayWithLength<U> extends [...ArrayWithLength<T>, ...infer _] ? false : true

export type CacheItem = KubbFile.ResolvedFile & {
  cancel?: () => void
}

export type AddResult<T extends Array<KubbFile.File>> = Promise<
  Awaited<GreaterThan<T['length'], 1> extends true ? Promise<KubbFile.ResolvedFile[]> : Promise<KubbFile.ResolvedFile>>
>

export namespace KubbFile {
  export type Import = {
    name: string | Array<string>
    path: string
    isTypeOnly?: boolean
  }

  export type Export = {
    name?: string | Array<string>
    path: string
    isTypeOnly?: boolean
    asAlias?: boolean
  }

  export type UUID = string
  export type Source = string

  export type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

  export type Mode = 'file' | 'directory'

  export type BaseName = `${string}${Extname}`

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
     * Name to be used to dynamicly create the baseName(based on input.path)
     * Based on UNIX basename
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
    meta?: TMeta
    /**
     * This will override `process.env[key]` inside the `source`, see `getFileSource`.
     */
    env?: NodeJS.ProcessEnv
    validate?: boolean
  }

  export type ResolvedFile = KubbFile.File & {
    /**
     * crypto.randomUUID()
     */
    id: UUID
  }
}
