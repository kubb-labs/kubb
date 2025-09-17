import type { TenantsControllerCreateTenantMutationResponse } from '../../models/ts/tenantsController/TenantsControllerCreateTenant.ts'
import { createCreateTenantDtoFaker } from '../createCreateTenantDtoFaker.ts'
import { createTenantFaker } from '../createTenantFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerCreateTenant201Faker() {
  return createTenantFaker()
}

export function createTenantsControllerCreateTenantMutationRequestFaker() {
  return createCreateTenantDtoFaker()
}

export function createTenantsControllerCreateTenantMutationResponseFaker(
  data?: Partial<TenantsControllerCreateTenantMutationResponse>,
): TenantsControllerCreateTenantMutationResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerCreateTenant201Faker()])
}
