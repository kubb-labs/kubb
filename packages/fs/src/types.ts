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

  isNameSpace?: boolean
  /**
   * When root is set it will get the path with relative getRelativePath(root, path).
   */
  root?: string
}

export type Source = {
  name?: string
  value?: string
  isTypeOnly?: boolean
  /**
   * Has const or type 'export'
   * @default false
   */
  isExportable?: boolean
  /**
   * When set, barrel generation will add this
   * @default false
   */
  isIndexable?: boolean
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

export type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

export type Mode = 'single' | 'split'

/**
 * Name to be used to dynamicly create the baseName(based on input.path)
 * Based on UNIX basename
 * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
 */
export type BaseName = `${string}.${string}`

/**
 * Path will be full qualified path to a specified file
 */
export type Path = string

export type AdvancedPath<T extends BaseName = BaseName> = `${BasePath}${T}`

export type OptionalPath = Path | undefined | null

export type File<TMeta extends object = object> = {
  /**
   * Name to be used to create the path
   * Based on UNIX basename, `${name}.extName`
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: BaseName
  /**
   * Path will be full qualified path to a specified file
   */
  path: AdvancedPath<BaseName> | Path
  sources: Array<Source>
  imports?: Array<Import>
  exports?: Array<Export>
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
}

export type ResolvedImport = Import

export type ResolvedExport = Export

export type ResolvedFile<TMeta extends object = object> = File<TMeta> & {
  /**
   * @default object-hash
   */
  id: string
  /**
   * Contains the first part of the baseName, generated based on baseName
   * @link  https://nodejs.org/api/path.html#pathformatpathobject
   */
  name: string
  extName: Extname
  imports: Array<ResolvedImport>
  exports: Array<ResolvedExport>
}
