import type { UploadFilePathParams, UploadFileQueryParams, UploadFileMutationResponse } from '../../models/ts/petController/UploadFile.ts'
import { createApiResponseFaker } from '../createApiResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createUploadFilePathParamsFaker(data?: Partial<UploadFilePathParams>): UploadFilePathParams {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

export function createUploadFileQueryParamsFaker(data?: Partial<UploadFileQueryParams>): UploadFileQueryParams {
  return {
    ...{ additionalMetadata: faker.string.alpha() },
    ...(data || {}),
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

export function createUploadFileMutationResponseFaker(data?: Partial<UploadFileMutationResponse>): UploadFileMutationResponse {
  return data || faker.helpers.arrayElement<any>([createUploadFile200Faker()])
}
