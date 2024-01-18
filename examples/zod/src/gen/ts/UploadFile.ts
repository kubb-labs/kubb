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
export type UploadFileMutationResponse = ApiResponse
export namespace UploadFileMutation {
  export type Response = UploadFileMutationResponse
  export type Request = UploadFileMutationRequest
  export type PathParams = UploadFilePathParams
  export type QueryParams = UploadFileQueryParams
}
