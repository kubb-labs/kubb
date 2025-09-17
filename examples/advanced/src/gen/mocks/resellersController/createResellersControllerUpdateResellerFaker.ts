import type {
  ResellersControllerUpdateResellerPathParams,
  ResellersControllerUpdateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'
import { createResellerFaker } from '../createResellerFaker.ts'
import { createUpdateResellerDtoFaker } from '../createUpdateResellerDtoFaker.ts'
import { faker } from '@faker-js/faker'

export function createResellersControllerUpdateResellerPathParamsFaker(
  data?: Partial<ResellersControllerUpdateResellerPathParams>,
): ResellersControllerUpdateResellerPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createResellersControllerUpdateReseller200Faker() {
  return createResellerFaker()
}

export function createResellersControllerUpdateResellerMutationRequestFaker() {
  return createUpdateResellerDtoFaker()
}

export function createResellersControllerUpdateResellerMutationResponseFaker(
  data?: Partial<ResellersControllerUpdateResellerMutationResponse>,
): ResellersControllerUpdateResellerMutationResponse {
  return data || faker.helpers.arrayElement<any>([createResellersControllerUpdateReseller200Faker()])
}
