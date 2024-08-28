import type {
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFile200,
  UploadFileMutationRequest,
  UploadFileMutationResponse,
} from '../../models/ts/petController/UploadFile'
import { createApiResponse } from '../createApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createUploadFilePathParams(): NonNullable<UploadFilePathParams> {
  return { petId: faker.number.int() }
}

export function createUploadFileQueryParams(): NonNullable<UploadFileQueryParams> {
  return { additionalMetadata: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createUploadFile200(): NonNullable<UploadFile200> {
  return createApiResponse()
}

export function createUploadFileMutationRequest(): NonNullable<UploadFileMutationRequest> {
  return faker.image.imageUrl() as unknown as Blob
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  return createApiResponse()
}
