import type {
  PartsControllerSimulatePartPathParams,
  PartsControllerSimulatePartMutationResponse,
} from '../../models/ts/partsController/PartsControllerSimulatePart.ts'
import { createPartFaker } from '../createPartFaker.ts'
import { createSimulatePartDtoFaker } from '../createSimulatePartDtoFaker.ts'
import { faker } from '@faker-js/faker'

export function createPartsControllerSimulatePartPathParamsFaker(data?: Partial<PartsControllerSimulatePartPathParams>): PartsControllerSimulatePartPathParams {
  return {
    ...{ urn: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createPartsControllerSimulatePart200Faker() {
  return createPartFaker()
}

export function createPartsControllerSimulatePartMutationRequestFaker() {
  return createSimulatePartDtoFaker()
}

export function createPartsControllerSimulatePartMutationResponseFaker(
  data?: Partial<PartsControllerSimulatePartMutationResponse>,
): PartsControllerSimulatePartMutationResponse {
  return data || faker.helpers.arrayElement<any>([createPartsControllerSimulatePart200Faker()])
}
