import { faker } from '@faker-js/faker'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../models/UploadFile'

export function createUploadFileMutationRequest(override?: NonNullable<Partial<UploadFileMutationRequest>>): NonNullable<UploadFileMutationRequest> {
  faker.seed([220])
  return faker.string.alpha()
}
/**
 * @description successful operation
 */

export function createUploadFileMutationResponse(override?: NonNullable<Partial<UploadFileMutationResponse>>): NonNullable<UploadFileMutationResponse> {
  faker.seed([220])
  return undefined
}

export function createUploadFilePathParams(override: NonNullable<Partial<UploadFilePathParams>> = {}): NonNullable<UploadFilePathParams> {
  faker.seed([220])
  return {
    ...{ 'petId': faker.number.float({}) },
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
