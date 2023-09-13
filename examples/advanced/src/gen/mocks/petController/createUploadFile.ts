import { faker } from '@faker-js/faker'

import { createApiResponse } from '../createApiResponse'
import { UploadFileMutationRequest } from '../../models/ts/petController/UploadFile'
import { UploadFilePathParams } from '../../models/ts/petController/UploadFile'
import { UploadFileQueryParams } from '../../models/ts/petController/UploadFile'
import { UploadFileMutationResponse } from '../../models/ts/petController/UploadFile'

export function createUploadFileMutationRequest(): UploadFileMutationRequest {
  return faker.string.alpha()
}

export function createUploadFilePathParams(): UploadFilePathParams {
  return { petId: faker.number.float({}) }
}

export function createUploadFileQueryParams(): UploadFileQueryParams {
  return { additionalMetadata: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(): UploadFileMutationResponse {
  return createApiResponse()
}
