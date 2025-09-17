import type {
  TenantsControllerGetActiveWeldPackPathParams,
  TenantsControllerGetActiveWeldPackQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerGetActiveWeldPackPathParamsFaker(
  data?: Partial<TenantsControllerGetActiveWeldPackPathParams>,
): TenantsControllerGetActiveWeldPackPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createTenantsControllerGetActiveWeldPack200Faker() {
  return createWeldPackFaker()
}

export function createTenantsControllerGetActiveWeldPackQueryResponseFaker(
  data?: Partial<TenantsControllerGetActiveWeldPackQueryResponse>,
): TenantsControllerGetActiveWeldPackQueryResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerGetActiveWeldPack200Faker()])
}
