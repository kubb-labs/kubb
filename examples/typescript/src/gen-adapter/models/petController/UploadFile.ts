import type { ApiResponse } from '../ApiResponse.ts'

export type UploadFilePathPetId = number

export type UploadFileQueryAdditionalMetadata = string

/**
 * @description successful operation
 */
export type UploadFileStatus200 = ApiResponse

export type UploadFileMutationRequest = Blob

export interface UploadFileRequestConfig {
  data?: UploadFileMutationRequest
  pathParams: {
    petId: UploadFilePathPetId
  }
  queryParams?: {
    additionalMetadata?: UploadFileQueryAdditionalMetadata
  }
  headerParams?: never
  url: `/pet/${string}/uploadImage`
}

export interface UploadFileResponses {
  '200': UploadFileStatus200
}

/**
 * @description Union of all possible responses
 */
export type UploadFileResponse = UploadFileStatus200
