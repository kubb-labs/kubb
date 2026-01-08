import type { UploadFilePathParams, UploadFileQueryParams, UploadFileResponseData } from '../../models/ts/petController/UploadFile.ts'
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
export function createUploadFileStatus200Faker() {
  return createApiResponseFaker()
}

export function createUploadFileRequestDataFaker() {
  return faker.image.url() as unknown as Blob
}

export function createUploadFileResponseDataFaker(data?: Partial<UploadFileResponseData>): UploadFileResponseData {
  return data || faker.helpers.arrayElement<any>([createUploadFileStatus200Faker()])
}
