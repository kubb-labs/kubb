type BasePath<T extends string = string> = `${T}/`

export type Import = {
  /**
   * Import name to be used
   * @example ["useState"]
   * @example "React"
   */
  name:
    | string
    | Array<
        | string
        | {
            propertyName: string
            name?: string
          }
      >
  /**
   * Path for the import
   * @example '@kubb/core'
   */
  path: string
  extName?: Extname
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
   * @example '@kubb/core'
   */
  path: string
  extName?: Extname
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

export type Mode = 'single' | 'split'

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

export type File<TMeta extends object = object, TBaseName extends BaseName = BaseName> = {
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
   * Override if a file can be exported by the BarrelManager
   * @default true
   */
  exportable?: boolean
  /**
   * This will override `process.env[key]` inside the `source`, see `getFileSource`.
   */
  env?: NodeJS.ProcessEnv
  /**
   * The name of the language being used. This can be TypeScript, JavaScript and still have another ext.
   */
  language?: string
}
