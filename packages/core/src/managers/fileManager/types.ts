type Import = {
  name: string | string[]
  path: string
  type?: boolean
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
}

export type UUID = string

export type CacheStore = { id: UUID; file: File; status: Status }

export type Status = 'new' | 'success' | 'removed'
