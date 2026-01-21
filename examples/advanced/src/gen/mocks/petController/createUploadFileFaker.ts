import { faker } from '@faker-js/faker'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/ts/petController/UploadFile.ts'
import { createApiResponseFaker } from '../createApiResponseFaker.ts'

export function createUploadFilePathParamsFaker(data?: Partial<UploadFilePathParams>) {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  } as UploadFilePathParams
}

export function createUploadFileQueryParamsFaker(data?: Partial<UploadFileQueryParams>) {
  return {
    ...{ additionalMetadata: faker.string.alpha() },
    ...(data || {}),
  } as UploadFileQueryParams
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

export function createUploadFileMutationResponseFaker(data?: Partial<UploadFileMutationResponse>) {
  return data || (faker.helpers.arrayElement<any>([createUploadFile200Faker()]) as UploadFileMutationResponse)
}
