import type {
  ResellersControllerGetResellerPathParams,
  ResellersControllerGetResellerQueryResponse,
} from '../../models/ts/resellersController/ResellersControllerGetReseller.ts'
import { createResellerFaker } from '../createResellerFaker.ts'
import { faker } from '@faker-js/faker'

export function createResellersControllerGetResellerPathParamsFaker(
  data?: Partial<ResellersControllerGetResellerPathParams>,
): ResellersControllerGetResellerPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createResellersControllerGetReseller200Faker() {
  return createResellerFaker()
}

export function createResellersControllerGetResellerQueryResponseFaker(
  data?: Partial<ResellersControllerGetResellerQueryResponse>,
): ResellersControllerGetResellerQueryResponse {
  return data || faker.helpers.arrayElement<any>([createResellersControllerGetReseller200Faker()])
}
