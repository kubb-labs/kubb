import type { License } from '../models/ts/License.ts'
import { createLicenseTypeFaker } from './createLicenseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createLicenseFaker(data?: Partial<License>): License {
  return {
    ...{
      id: faker.number.float(),
      activationDate: faker.date.anytime().toISOString(),
      durationDays: faker.number.int(),
      lastActivationDate: faker.date.anytime().toISOString(),
      includedWeldCredits: faker.number.int(),
      type: Object.assign({}, createLicenseTypeFaker()),
      isDeactivated: faker.datatype.boolean(),
      expirationDate: faker.date.anytime().toISOString(),
      isActive: faker.datatype.boolean(),
    },
    ...(data || {}),
  }
}
