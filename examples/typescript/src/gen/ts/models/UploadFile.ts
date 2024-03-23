import type { ApiResponse } from './ApiResponse'

export type UploadFileMutationRequest = string

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer int64
   */
  petId: number
}

export type UploadFileQueryParams = {
  /**
   * @description Additional Metadata
   * @type string | undefined
   */
  additionalMetadata?: string
}

/**
 * @description successful operation
 */
export type UploadFile200 = ApiResponse

/**
 * @description successful operation
 */
export type UploadFileMutationResponse = ApiResponse
export type UploadFileMutation = {
  Response: UploadFileMutationResponse
  Request: UploadFileMutationRequest
  PathParams: UploadFilePathParams
  QueryParams: UploadFileQueryParams
}
