import { faker } from '@faker-js/faker'

import { createApiresponse } from '../createApiresponse'
import { UploadFileMutationRequest } from '../../models/ts/petController/UploadFile'
import { UploadFilePathParams } from '../../models/ts/petController/UploadFile'
import { UploadfileQueryparams } from '../../models/ts/petController/UploadFile'
import { UploadFileMutationResponse } from '../../models/ts/petController/UploadFile'

export function createUploadfilemutationrequest(): UploadFileMutationRequest {
  return faker.string.alpha()
}

export function createUploadfilepathparams(): UploadFilePathParams {
  return { petId: faker.number.float({}) }
}

export function createUploadfilequeryparams(): UploadfileQueryparams {
  return { additionalMetadata: faker.string.alpha() }
}

/**
 * @description successful operation
 */

export function createUploadfilemutationresponse(): UploadFileMutationResponse {
  return createApiresponse()
}
