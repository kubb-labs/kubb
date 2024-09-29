import type { UploadFilePathParams, UploadFileQueryParams } from '../../models/ts/petController/UploadFile.js'
import { createApiResponseFaker } from '../createApiResponseFaker.js'
import { faker } from '@faker-js/faker'

export function createUploadFilePathParamsFaker(data: NonNullable<Partial<UploadFilePathParams>> = {}) {
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUploadFileQueryParamsFaker(data: NonNullable<Partial<UploadFileQueryParams>> = {}) {
  return {
    ...{ additionalMetadata: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createUploadFile200Faker() {
  return createApiResponseFaker()
}

export function createUploadFileMutationRequestFaker() {
  return faker.image.url() as unknown as Blob
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponseFaker() {
  return createApiResponseFaker()
}
