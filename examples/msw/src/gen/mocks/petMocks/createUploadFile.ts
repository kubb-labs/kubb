import type { UploadFilePathParams, UploadFileQueryParams, UploadFile200, UploadFileMutationRequest, UploadFileMutationResponse } from '../../models/UploadFile'
import { faker } from '@faker-js/faker'
import { createApiResponse } from '../createApiResponse'

export function createUploadFilePathParams(): NonNullable<UploadFilePathParams> {
  faker.seed([220])
  return { petId: faker.number.int() }
}

export function createUploadFileQueryParams(): NonNullable<UploadFileQueryParams> {
  faker.seed([220])
  return { additionalMetadata: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createUploadFile200(): NonNullable<UploadFile200> {
  faker.seed([220])
  return createApiResponse()
}

export function createUploadFileMutationRequest(): NonNullable<UploadFileMutationRequest> {
  faker.seed([220])
  return faker.image.imageUrl() as unknown as Blob
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  faker.seed([220])
  return createApiResponse()
}
