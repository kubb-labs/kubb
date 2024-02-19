import { faker } from '@faker-js/faker'
import { createApiResponse } from '../createApiResponse'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../models/ts/petController/UploadFile'

export function createUploadFileMutationRequest(override?: NonNullable<Partial<UploadFileMutationRequest>>): NonNullable<UploadFileMutationRequest> {
  return faker.string.alpha()
}

export function createUploadFilePathParams(override: NonNullable<Partial<UploadFilePathParams>> = {}): NonNullable<UploadFilePathParams> {
  return {
    ...{ 'petId': faker.number.float({}) },
    ...override,
  }
}

export function createUploadFileQueryParams(override: NonNullable<Partial<UploadFileQueryParams>> = {}): NonNullable<UploadFileQueryParams> {
  return {
    ...{ 'additionalMetadata': faker.string.alpha() },
    ...override,
  }
}

/**
 * @description successful operation
 */

export function createUploadFileMutationResponse(override?: NonNullable<Partial<UploadFileMutationResponse>>): NonNullable<UploadFileMutationResponse> {
  return createApiResponse(override)
}
