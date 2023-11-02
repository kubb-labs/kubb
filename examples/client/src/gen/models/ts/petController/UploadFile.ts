import type { ApiResponse } from '../ApiResponse'

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
export type UploadFileMutationResponse = ApiResponse

export type UploadFile = {
  response: UploadFileMutationResponse
  request: UploadFileMutationRequest
  pathParams: UploadFilePathParams
  queryParams: UploadFileQueryParams
}
