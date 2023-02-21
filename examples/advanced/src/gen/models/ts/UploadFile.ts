import type { ApiResponse } from './ApiResponse'

export type UploadFileParams = {
  /**
   * @type integer | undefined int64
   */
  petId?: number | undefined
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
