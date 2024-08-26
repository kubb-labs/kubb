import type { ApiResponseType } from './ApiResponseType'

export type UploadFilePathParamsType = {
  /**
   * @description ID of pet to update
   * @type integer, int64
   */
  petId: number
}

export type UploadFileQueryParamsType = {
  /**
   * @description Additional Metadata
   * @type string | undefined
   */
  additionalMetadata?: string
}

/**
 * @description successful operation
 */
export type UploadFile200Type = ApiResponseType

export type UploadFileMutationRequestType = Blob

/**
 * @description successful operation
 */
export type UploadFileMutationResponseType = ApiResponseType

export type UploadFileTypeMutation = {
  Response: UploadFileMutationResponseType
  Request: UploadFileMutationRequestType
  PathParams: UploadFilePathParamsType
  QueryParams: UploadFileQueryParamsType
}
