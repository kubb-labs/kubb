import { faker } from '@faker-js/faker'
import { createApiResponse } from '../createApiResponse'
import type { UploadFilePathParams, UploadFileQueryParams, UploadFile200, UploadFileMutationRequest, UploadFileMutationResponse } from '../../models/UploadFile'

export function createUploadFilePathParams(override: NonNullable<Partial<UploadFilePathParams>> = {}): NonNullable<UploadFilePathParams> {
  faker.seed([220])
  return {
    ...{ 'petId': faker.number.int() },
    ...override,
  }
}

export function createUploadFileQueryParams(override: NonNullable<Partial<UploadFileQueryParams>> = {}): NonNullable<UploadFileQueryParams> {
  faker.seed([220])
  return {
    ...{ 'additionalMetadata': faker.string.alpha() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createUploadFile200(override?: NonNullable<Partial<UploadFile200>>): NonNullable<UploadFile200> {
  faker.seed([220])
  return createApiResponse(override)
}

export function createUploadFileMutationRequest(override?: NonNullable<Partial<UploadFileMutationRequest>>): NonNullable<UploadFileMutationRequest> {
  faker.seed([220])
  return faker.string.alpha()
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(override?: NonNullable<Partial<UploadFileMutationResponse>>): NonNullable<UploadFileMutationResponse> {
  faker.seed([220])
  return createApiResponse(override)
}
