import type {
  TenantsControllerGetWeldCreditsPathParams,
  TenantsControllerGetWeldCreditsQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetWeldCredits.ts'
import { createGetWeldCreditsResponseFaker } from '../createGetWeldCreditsResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerGetWeldCreditsPathParamsFaker(
  data?: Partial<TenantsControllerGetWeldCreditsPathParams>,
): TenantsControllerGetWeldCreditsPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createTenantsControllerGetWeldCredits200Faker() {
  return createGetWeldCreditsResponseFaker()
}

export function createTenantsControllerGetWeldCreditsQueryResponseFaker(
  data?: Partial<TenantsControllerGetWeldCreditsQueryResponse>,
): TenantsControllerGetWeldCreditsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerGetWeldCredits200Faker()])
}
