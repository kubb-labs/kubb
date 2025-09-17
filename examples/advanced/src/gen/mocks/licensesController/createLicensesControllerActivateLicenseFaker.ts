import type {
  LicensesControllerActivateLicensePathParams,
  LicensesControllerActivateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerActivateLicense.ts'
import { createActivateLicenseDtoFaker } from '../createActivateLicenseDtoFaker.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerActivateLicensePathParamsFaker(
  data?: Partial<LicensesControllerActivateLicensePathParams>,
): LicensesControllerActivateLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createLicensesControllerActivateLicense200Faker() {
  return createLicenseFaker()
}

export function createLicensesControllerActivateLicenseMutationRequestFaker() {
  return createActivateLicenseDtoFaker()
}

export function createLicensesControllerActivateLicenseMutationResponseFaker(
  data?: Partial<LicensesControllerActivateLicenseMutationResponse>,
): LicensesControllerActivateLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerActivateLicense200Faker()])
}
