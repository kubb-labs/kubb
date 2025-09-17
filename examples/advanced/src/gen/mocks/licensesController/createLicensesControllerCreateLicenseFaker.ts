import type { LicensesControllerCreateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerCreateLicense.ts'
import { createCreateLicenseDtoFaker } from '../createCreateLicenseDtoFaker.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerCreateLicense201Faker() {
  return createLicenseFaker()
}

export function createLicensesControllerCreateLicenseMutationRequestFaker() {
  return createCreateLicenseDtoFaker()
}

export function createLicensesControllerCreateLicenseMutationResponseFaker(
  data?: Partial<LicensesControllerCreateLicenseMutationResponse>,
): LicensesControllerCreateLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerCreateLicense201Faker()])
}
