import type {
  LicensesControllerUpdateLicensePathParams,
  LicensesControllerUpdateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { createUpdateLicenseDtoFaker } from '../createUpdateLicenseDtoFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerUpdateLicensePathParamsFaker(
  data?: Partial<LicensesControllerUpdateLicensePathParams>,
): LicensesControllerUpdateLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createLicensesControllerUpdateLicense200Faker() {
  return createLicenseFaker()
}

export function createLicensesControllerUpdateLicenseMutationRequestFaker() {
  return createUpdateLicenseDtoFaker()
}

export function createLicensesControllerUpdateLicenseMutationResponseFaker(
  data?: Partial<LicensesControllerUpdateLicenseMutationResponse>,
): LicensesControllerUpdateLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerUpdateLicense200Faker()])
}
