import type { PartsControllerGetPartPathParams, PartsControllerGetPartQueryResponse } from '../../models/ts/partsController/PartsControllerGetPart.ts'
import { createPartFaker } from '../createPartFaker.ts'
import { faker } from '@faker-js/faker'

export function createPartsControllerGetPartPathParamsFaker(data?: Partial<PartsControllerGetPartPathParams>): PartsControllerGetPartPathParams {
  return {
    ...{ urn: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createPartsControllerGetPart200Faker() {
  return createPartFaker()
}

export function createPartsControllerGetPartQueryResponseFaker(data?: Partial<PartsControllerGetPartQueryResponse>): PartsControllerGetPartQueryResponse {
  return data || faker.helpers.arrayElement<any>([createPartsControllerGetPart200Faker()])
}
