import type { UploadFilePathParams, UploadFileQueryParams } from '../../models/ts/petController/UploadFile.ts'
import { createApiResponse } from '../createApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createUploadFilePathParams(data: NonNullable<Partial<UploadFilePathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUploadFileQueryParams(data: NonNullable<Partial<UploadFileQueryParams>> = {}) {
  return {
    ...{ additionalMetadata: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createUploadFile200() {
  return createApiResponse()
}

export function createUploadFileMutationRequest() {
  return faker.image.imageUrl() as unknown as Blob
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse() {
  return createApiResponse()
}
