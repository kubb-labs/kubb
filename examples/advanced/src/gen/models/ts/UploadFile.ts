import type { ApiResponse } from './ApiResponse'

export type UploadFilePathParams = {
  /**
   * @type integer int64
   */
  petId: number
}

export type UploadFileQueryParams = {
  /**
   * @type string | undefined
   */
  additionalMetadata?: string | undefined
}

export type UploadFileRequest = any | null

/**
 * @description successful operation
 */
export type UploadFileResponse = ApiResponse
