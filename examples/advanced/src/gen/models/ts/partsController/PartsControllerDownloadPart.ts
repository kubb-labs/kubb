import type { DownloadPartDto } from '../DownloadPartDto.ts'
import type { Part } from '../Part.ts'

export type PartsControllerDownloadPartPathParams = {
  /**
   * @type string
   */
  urn: string
}

export type PartsControllerDownloadPart200 = Part

export type PartsControllerDownloadPartMutationRequest = DownloadPartDto

export type PartsControllerDownloadPartMutationResponse = PartsControllerDownloadPart200

export type PartsControllerDownloadPartMutation = {
  Response: PartsControllerDownloadPart200
  Request: PartsControllerDownloadPartMutationRequest
  PathParams: PartsControllerDownloadPartPathParams
  Errors: any
}
