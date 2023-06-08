import { faker } from '@faker-js/faker'

import { createApiResponse } from '../createApiResponse'
import { UploadFilePathParams } from '../../models/UploadFile'
import { UploadFileQueryParams } from '../../models/UploadFile'
import { UploadFileMutationResponse } from '../../models/UploadFile'

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
