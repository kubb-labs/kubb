import type { Path } from '@kubb/core'

export type Import = {
  name: string | string[]
  path: string
  isTypeOnly?: boolean
}

export type Export = {
  name?: string | string[]
  path: string
  isTypeOnly?: boolean
  asAlias?: boolean
}

export type UUID = string
export type Source = string

export type File = {
  /**
   * Name to be used to dynamicly create the fileName(based on input.path)
   */
  fileName: string
  /**
   * Path will be full qualified path to a specified file
   */
  path: Path
  source: Source
  imports?: Import[]
  exports?: Export[]
  /**
   * This will call fileManager.add instead of fileManager.addOrAppend, adding the source when the files already exists
   * @default `false`
   */
  override?: boolean
  meta?: {
    pluginName?: string
  }
  /**
   * This will override `process.env[key]` inside the `source`, see `getFileSource`.
   */
  env?: NodeJS.ProcessEnv
}

export type ResolvedFile = File & {
  /**
   * crypto.randomUUID()
   */
  id: UUID
}

export type CacheItem = ResolvedFile & {
  cancel?: () => void
}

export type Status = 'new' | 'success' | 'removed'
