import type {
  LicensesControllerDeactivateLicensePathParams,
  LicensesControllerDeactivateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerDeactivateLicensePathParamsFaker(
  data?: Partial<LicensesControllerDeactivateLicensePathParams>,
): LicensesControllerDeactivateLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createLicensesControllerDeactivateLicense200Faker() {
  return createLicenseFaker()
}

export function createLicensesControllerDeactivateLicenseMutationResponseFaker(
  data?: Partial<LicensesControllerDeactivateLicenseMutationResponse>,
): LicensesControllerDeactivateLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerDeactivateLicense200Faker()])
}
