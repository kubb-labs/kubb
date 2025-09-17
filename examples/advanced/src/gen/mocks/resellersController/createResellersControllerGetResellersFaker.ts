import type {
  ResellersControllerGetResellers200,
  ResellersControllerGetResellersQueryResponse,
} from '../../models/ts/resellersController/ResellersControllerGetResellers.ts'
import { createResellerFaker } from '../createResellerFaker.ts'
import { faker } from '@faker-js/faker'

export function createResellersControllerGetResellers200Faker(data?: ResellersControllerGetResellers200): ResellersControllerGetResellers200 {
  return [...faker.helpers.multiple(() => createResellerFaker()), ...(data || [])]
}

export function createResellersControllerGetResellersQueryResponseFaker(
  data?: Partial<ResellersControllerGetResellersQueryResponse>,
): ResellersControllerGetResellersQueryResponse {
  return data || faker.helpers.arrayElement<any>([createResellersControllerGetResellers200Faker()])
}
