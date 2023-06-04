type Import = {
  name: string | string[]
  path: string
  isTypeOnly?: boolean
}

type Export = {
  name?: string | string[]
  path: string
  isTypeOnly?: boolean
  asAlias?: boolean
}

export type File = {
  /**
   * Name to be used to dynamicly create the fileName(based on input.path)
   */
  fileName: string
  /**
   * Path will be full qualified path to a specified file
   */
  path: string
  source: string
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
}

export type UUID = string

export type CacheStore = { id: UUID; file: File; status: Status }

export type Status = 'new' | 'success' | 'removed'
