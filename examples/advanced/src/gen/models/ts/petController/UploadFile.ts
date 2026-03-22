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

export type UploadFileMutationResponse = UploadFile200

export type UploadFileMutation = {
  /**
   * @type object
   */
  Response: UploadFile200
  /**
   * @type object
   */
  Request: UploadFileMutationRequest
  /**
   * @type object
   */
  PathParams: UploadFilePathParams
  /**
   * @type object
   */
  QueryParams: UploadFileQueryParams
  Errors: any
}
