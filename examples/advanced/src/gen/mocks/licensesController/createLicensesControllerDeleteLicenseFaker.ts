import type {
  LicensesControllerDeleteLicensePathParams,
  LicensesControllerDeleteLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerDeleteLicensePathParamsFaker(
  data?: Partial<LicensesControllerDeleteLicensePathParams>,
): LicensesControllerDeleteLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createLicensesControllerDeleteLicense200Faker() {
  return faker.datatype.boolean()
}

export function createLicensesControllerDeleteLicenseMutationResponseFaker(
  data?: Partial<LicensesControllerDeleteLicenseMutationResponse>,
): LicensesControllerDeleteLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerDeleteLicense200Faker()])
}
