import type {
  LicensesControllerGetLicensePathParams,
  LicensesControllerGetLicenseQueryResponse,
} from '../../models/ts/licensesController/LicensesControllerGetLicense.ts'
import { createGetLicenseResponseFaker } from '../createGetLicenseResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerGetLicensePathParamsFaker(
  data?: Partial<LicensesControllerGetLicensePathParams>,
): LicensesControllerGetLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createLicensesControllerGetLicense200Faker() {
  return createGetLicenseResponseFaker()
}

export function createLicensesControllerGetLicenseQueryResponseFaker(
  data?: Partial<LicensesControllerGetLicenseQueryResponse>,
): LicensesControllerGetLicenseQueryResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerGetLicense200Faker()])
}
