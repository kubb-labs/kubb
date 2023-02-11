/**
 * @deprecated Use userFile instead
 */
export type EmittedFile = {
  /**
   *  equal to importee when getting passed through resolveId
   */
  id: string
  /**
   * The importer is the fully resolved id of the importing module.
   */
  importer?: string
  /**
   * Name to be used to dynamicly create the fileName(based on input.path)
   */
  name?: string
  /**
   * FileName will be the end result so no input.path will not be added
   */
  fileName?: string
  source?: string
  options?: Record<string, any>
}

type Import={
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
