export type UploadFileMutationRequest = string

/**
 * @description successful operation
 */
export type UploadFileMutationResponse = any | null

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
} | undefined
export type UploadFileMutation = {
  Response: UploadFileMutationResponse
  Request: UploadFileMutationRequest
  PathParams: UploadFilePathParams
  QueryParams: UploadFileQueryParams
}
