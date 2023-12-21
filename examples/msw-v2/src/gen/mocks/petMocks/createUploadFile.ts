import { faker } from '@faker-js/faker'
import { createApiResponse } from '../createApiResponse'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/UploadFile'

export function createUploadFileMutationRequest(): NonNullable<UploadFileMutationRequest> {
  faker.seed([220])
  return faker.string.alpha()
}

export function createUploadFilePathParams(): NonNullable<UploadFilePathParams> {
  faker.seed([220])
  return { 'petId': faker.number.float({}) }
}

export function createUploadFileQueryParams(): NonNullable<UploadFileQueryParams> {
  faker.seed([220])
  return { 'additionalMetadata': faker.string.alpha() }
}
/**
 * @description successful operation
 */

export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  faker.seed([220])
  return createApiResponse()
}
