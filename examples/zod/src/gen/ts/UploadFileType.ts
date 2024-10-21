import type { ApiResponseType } from './ApiResponseType.ts'

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

export type UploadFileMutationResponseType = UploadFile200Type

export type UploadFileTypeMutation = {
  Response: UploadFile200Type
  Request: UploadFileMutationRequestType
  PathParams: UploadFilePathParamsType
  QueryParams: UploadFileQueryParamsType
  Errors: any
}
