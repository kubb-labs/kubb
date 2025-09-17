import type {
  PartsControllerDownloadPartPathParams,
  PartsControllerDownloadPartMutationResponse,
} from '../../models/ts/partsController/PartsControllerDownloadPart.ts'
import { createDownloadPartDtoFaker } from '../createDownloadPartDtoFaker.ts'
import { createPartFaker } from '../createPartFaker.ts'
import { faker } from '@faker-js/faker'

export function createPartsControllerDownloadPartPathParamsFaker(data?: Partial<PartsControllerDownloadPartPathParams>): PartsControllerDownloadPartPathParams {
  return {
    ...{ urn: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createPartsControllerDownloadPart200Faker() {
  return createPartFaker()
}

export function createPartsControllerDownloadPartMutationRequestFaker() {
  return createDownloadPartDtoFaker()
}

export function createPartsControllerDownloadPartMutationResponseFaker(
  data?: Partial<PartsControllerDownloadPartMutationResponse>,
): PartsControllerDownloadPartMutationResponse {
  return data || faker.helpers.arrayElement<any>([createPartsControllerDownloadPart200Faker()])
}
