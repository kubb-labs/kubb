import type { ApiResponse } from '../ApiResponse.ts'

export type UploadFilePathParams = {
  /**
   * @description ID of pet to update
   * @type integer
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

export type UploadFileMutationRequest = Blob

export type UploadFileMutation = {
  Response: UploadFile200
  Request: UploadFileMutationRequest
  Errors: any
}

export type UploadFileMutationResponse = UploadFile200
