import type { GetLicenseResponse } from '../models/ts/GetLicenseResponse.ts'
import { createLicenseTypeFaker } from './createLicenseTypeFaker.ts'
import { createResellerFaker } from './createResellerFaker.ts'
import { createTenantFaker } from './createTenantFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetLicenseResponseFaker(data?: Partial<GetLicenseResponse>): GetLicenseResponse {
  return {
    ...{
      id: faker.number.float(),
      activationDate: faker.date.anytime().toISOString(),
      durationDays: faker.number.float(),
      lastActivationDate: faker.date.anytime().toISOString(),
      includedWeldCredits: faker.number.float(),
      type: Object.assign({}, createLicenseTypeFaker()),
      isDeactivated: faker.datatype.boolean(),
      tenant: Object.assign({}, createTenantFaker()),
      reseller: Object.assign({}, createResellerFaker()),
    },
    ...(data || {}),
  }
}
