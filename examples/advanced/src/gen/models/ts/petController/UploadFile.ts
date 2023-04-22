import type { ApiResponse } from '../ApiResponse'

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

/**
 * @description successful operation
 */
export type UploadFileMutationResponse = ApiResponse
