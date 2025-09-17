import type { TenantsControllerGetTenants200, TenantsControllerGetTenantsQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetTenants.ts'
import { createTenantFaker } from '../createTenantFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerGetTenants200Faker(data?: TenantsControllerGetTenants200): TenantsControllerGetTenants200 {
  return [...faker.helpers.multiple(() => createTenantFaker()), ...(data || [])]
}

export function createTenantsControllerGetTenantsQueryResponseFaker(
  data?: Partial<TenantsControllerGetTenantsQueryResponse>,
): TenantsControllerGetTenantsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerGetTenants200Faker()])
}
