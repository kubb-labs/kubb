import { faker } from '@faker-js/faker'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/UploadFile'

export function createUploadFileMutationRequest(override?: NonNullable<Partial<UploadFileMutationRequest>>): NonNullable<UploadFileMutationRequest> {
  return faker.string.alpha()
}
/**
 * @description successful operation
 */

export function createUploadFileMutationResponse(override?: NonNullable<Partial<UploadFileMutationResponse>>): NonNullable<UploadFileMutationResponse> {
  return undefined
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
