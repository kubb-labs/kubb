import { faker } from '@faker-js/faker'
import type { UploadFile200, UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/UploadFile'
import { createApiResponse } from '../createApiResponse'

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
  return faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  return createApiResponse()
}
