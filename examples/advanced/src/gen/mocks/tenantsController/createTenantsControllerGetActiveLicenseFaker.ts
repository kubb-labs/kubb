import type {
  TenantsControllerGetActiveLicensePathParams,
  TenantsControllerGetActiveLicenseQueryResponse,
} from '../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { faker } from '@faker-js/faker'

export function createTenantsControllerGetActiveLicensePathParamsFaker(
  data?: Partial<TenantsControllerGetActiveLicensePathParams>,
): TenantsControllerGetActiveLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createTenantsControllerGetActiveLicense200Faker() {
  return createLicenseFaker()
}

export function createTenantsControllerGetActiveLicenseQueryResponseFaker(
  data?: Partial<TenantsControllerGetActiveLicenseQueryResponse>,
): TenantsControllerGetActiveLicenseQueryResponse {
  return data || faker.helpers.arrayElement<any>([createTenantsControllerGetActiveLicense200Faker()])
}
