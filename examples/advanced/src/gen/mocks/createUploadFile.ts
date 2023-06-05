import { faker } from '@faker-js/faker'

import { createApiResponse } from './createApiResponse'

export function createUploadFilePathParams() {
  return { petId: faker.number.float({}) }
}

export function createUploadFileQueryParams() {
  return { additionalMetadata: faker.string.alpha({}) }
}

/**
 * @description successful operation
 */

export function createUploadFileMutationResponse() {
  return createApiResponse()
}
