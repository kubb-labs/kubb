import type {
  TenantsControllerGetTenantPathParams,
  TenantsControllerGetTenantQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetTenant.ts'
import { createGetTenantResponseFaker } from '../createGetTenantResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerGetTenantPathParamsFaker(data?: Partial<TenantsControllerGetTenantPathParams>): TenantsControllerGetTenantPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createTenantsControllerGetTenant200Faker() {
  return createGetTenantResponseFaker()
}

export function createTenantsControllerGetTenantQueryResponseFaker(
  data?: Partial<TenantsControllerGetTenantQueryResponse>,
): TenantsControllerGetTenantQueryResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerGetTenant200Faker()])
}
