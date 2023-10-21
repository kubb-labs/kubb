import { faker } from '@faker-js/faker'

import { UploadFileMutationRequest } from '../../models/UploadFile'
import { UploadFilePathParams } from '../../models/UploadFile'
import { UploadFileQueryParams } from '../../models/UploadFile'
import { UploadFileMutationResponse } from '../../models/UploadFile'
import { createApiResponse } from '../createApiResponse'

export function createUploadFileMutationRequest(): NonNullable<UploadFileMutationRequest> {
  return faker.string.alpha()
}

export function createUploadFilePathParams(): NonNullable<UploadFilePathParams> {
  return { petId: faker.number.float({}) }
}

export function createUploadFileQueryParams(): NonNullable<UploadFileQueryParams> {
  return { additionalMetadata: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  return createApiResponse()
}
