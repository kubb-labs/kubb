import type {
  UploadFilePathParams,
  UploadFileQueryParams,
  UploadFile200,
  UploadFileMutationRequest,
  UploadFileMutationResponse,
} from '../../models/UploadFile.ts'
import { createApiResponse } from '../createApiResponse.ts'
import { faker } from '@faker-js/faker'

export function createUploadFilePathParams(data: NonNullable<Partial<UploadFilePathParams>> = {}): NonNullable<UploadFilePathParams> {
  faker.seed([220])
  return {
    ...{ petId: faker.number.int() },
    ...data,
  }
}

export function createUploadFileQueryParams(data: NonNullable<Partial<UploadFileQueryParams>> = {}): NonNullable<UploadFileQueryParams> {
  faker.seed([220])
  return {
    ...{ additionalMetadata: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createUploadFile200(): NonNullable<UploadFile200> {
  faker.seed([220])
  return createApiResponse()
}

export function createUploadFileMutationRequest(): NonNullable<UploadFileMutationRequest> {
  faker.seed([220])
  return faker.image.imageUrl() as unknown as Blob
}

/**
 * @description successful operation
 */
export function createUploadFileMutationResponse(): NonNullable<UploadFileMutationResponse> {
  faker.seed([220])
  return createApiResponse()
}
