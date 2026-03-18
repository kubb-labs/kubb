import type { ApiResponse } from '../ApiResponse.ts'

export type UploadFilePetId = number

export type UploadFileAdditionalMetadata = string

/**
 * @description successful operation
 */
export type UploadFile200 = ApiResponse

export type UploadFileMutationRequest = Blob

export interface UploadFileData {
  data?: UploadFileMutationRequest
  pathParams: {
    petId: UploadFilePetId
  }
  queryParams?: {
    additionalMetadata?: UploadFileAdditionalMetadata
  }
  headerParams?: never
  url: `/pet/${string}/uploadImage`
}

export interface UploadFileResponses {
  '200': UploadFile200
}

export type UploadFileResponse = UploadFile200
