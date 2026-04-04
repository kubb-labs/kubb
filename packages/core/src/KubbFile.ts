type ImportName =
  | string
  | Array<
      | string
      | {
          propertyName: string
          name?: string
        }
    >

export type Import = {
  /**
   * Import name to be used.
   * @example ["useState"]
   * @example "React"
   */
  name: ImportName
  /**
   * Path for the import.
   * @example '@kubb/core'
   */
  path: string
  /**
   * Add type-only import prefix.
   * - `true` generates `import type { Type } from './path'`
   * - `false` generates `import { Type } from './path'`
   * @default false
   */
  isTypeOnly?: boolean
  /**
   * Import entire module as namespace.
   * - `true` generates `import * as Name from './path'`
   * - `false` generates standard import
   * @default false
   */
  isNameSpace?: boolean
  /**
   * When root is set it will compute a relative path with `getRelativePath(root, path)`.
   */
  root?: string
}

export type Source = {
  name?: string
  value?: string
  /**
   * Make this source a type-only export.
   * @default false
   */
  isTypeOnly?: boolean
  /**
   * Include export keyword in source.
   * @default false
   */
  isExportable?: boolean
  /**
   * Include in barrel file generation.
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
   * Path for the export.
   * @example '@kubb/core'
   */
  path: string
  /**
   * Add type-only export prefix.
   * - `true` generates `export type { Type } from './path'`
   * - `false` generates `export { Type } from './path'`
   * @default false
   */
  isTypeOnly?: boolean
  /**
   * Export as aliased namespace.
   * - `true` generates `export * as aliasName from './path'`
   * - `false` generates standard export
   * @default false
   */
  asAlias?: boolean
}

export type Extname = '.ts' | '.js' | '.tsx' | '.json' | `.${string}`

export type Mode = 'single' | 'split'

/**
 * Name to be used to dynamically create the baseName (based on input.path).
 * Based on UNIX basename.
 * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
 */
export type BaseName = `${string}.${string}`

/**
 * Fully qualified path to a specified file.
 */
export type Path = string

export type File<TMeta extends object = object> = {
  /**
   * Name used to create the path.
   * Based on UNIX basename, `${name}${extname}`.
   * @link https://nodejs.org/api/path.html#pathbasenamepath-suffix
   */
  baseName: BaseName
  /**
   * Fully qualified path to the file.
   */
  path: Path
  sources: Array<Source>
  imports: Array<Import>
  exports: Array<Export>
  /**
   * Extra metadata used for barrel/index file generation.
   */
  meta?: TMeta
  banner?: string
  footer?: string
}

export type ResolvedFile<TMeta extends object = object> = File<TMeta> & {
  /**
   * Unique identifier, generated from a hash.
   * @default hash
   */
  id: string
  /**
   * First part of the `baseName`, derived from the file name.
   * @link https://nodejs.org/api/path.html#pathformatpathobject
   */
  name: string
  extname: Extname
  imports: Array<Import>
  exports: Array<Export>
}
