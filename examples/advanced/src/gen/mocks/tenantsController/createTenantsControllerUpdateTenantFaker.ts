import type {
  TenantsControllerUpdateTenantPathParams,
  TenantsControllerUpdateTenantMutationResponse,
} from '../../models/ts/tenantsController/TenantsControllerUpdateTenant.ts'
import { createTenantFaker } from '../createTenantFaker.ts'
import { createUpdateTenantDtoFaker } from '../createUpdateTenantDtoFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerUpdateTenantPathParamsFaker(
  data?: Partial<TenantsControllerUpdateTenantPathParams>,
): TenantsControllerUpdateTenantPathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createTenantsControllerUpdateTenant200Faker() {
  return createTenantFaker()
}

export function createTenantsControllerUpdateTenantMutationRequestFaker() {
  return createUpdateTenantDtoFaker()
}

export function createTenantsControllerUpdateTenantMutationResponseFaker(
  data?: Partial<TenantsControllerUpdateTenantMutationResponse>,
): TenantsControllerUpdateTenantMutationResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerUpdateTenant200Faker()])
}
