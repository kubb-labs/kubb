import type { ApiResponse } from '../ApiResponse'

export type UploadFileMutationRequest = string

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer int64
   */
  petId: number
}

export type UploadfileQueryparams = {
  /**
   * @description Additional Metadata
   * @type string | undefined
   */
  additionalMetadata?: string
}

/**
 * UploadFileMutationResponse
 * UploadFileMutationResponse
 * @description successful operation
 */
export type UploadFileMutationResponse = ApiResponse
