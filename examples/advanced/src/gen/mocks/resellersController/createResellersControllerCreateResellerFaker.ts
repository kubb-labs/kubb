import type { ResellersControllerCreateResellerMutationResponse } from '../../models/ts/resellersController/ResellersControllerCreateReseller.ts'
import { createCreateResellerDtoFaker } from '../createCreateResellerDtoFaker.ts'
import { createResellerFaker } from '../createResellerFaker.ts'
import { faker } from '@faker-js/faker'

export function createResellersControllerCreateReseller201Faker() {
  return createResellerFaker()
}

export function createResellersControllerCreateResellerMutationRequestFaker() {
  return createCreateResellerDtoFaker()
}

export function createResellersControllerCreateResellerMutationResponseFaker(
  data?: Partial<ResellersControllerCreateResellerMutationResponse>,
): ResellersControllerCreateResellerMutationResponse {
  return data || faker.helpers.arrayElement<any>([createResellersControllerCreateReseller201Faker()])
}
