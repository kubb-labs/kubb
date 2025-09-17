import type {
  LicensesControllerGetLicenses200,
  LicensesControllerGetLicensesQueryResponse,
} from '../../models/ts/licensesController/LicensesControllerGetLicenses.ts'
import { createLicenseFaker } from '../createLicenseFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicensesControllerGetLicenses200Faker(data?: LicensesControllerGetLicenses200): LicensesControllerGetLicenses200 {
  return [...faker.helpers.multiple(() => createLicenseFaker()), ...(data || [])]
}

export function createLicensesControllerGetLicensesQueryResponseFaker(
  data?: Partial<LicensesControllerGetLicensesQueryResponse>,
): LicensesControllerGetLicensesQueryResponse {
  return data || faker.helpers.arrayElement<any>([createLicensesControllerGetLicenses200Faker()])
}
