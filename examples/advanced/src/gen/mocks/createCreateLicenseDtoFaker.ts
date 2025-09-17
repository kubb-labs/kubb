import type { CreateLicenseDto } from '../models/ts/CreateLicenseDto.ts'
import { createLicenseTypeFaker } from './createLicenseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreateLicenseDtoFaker(data?: Partial<CreateLicenseDto>): CreateLicenseDto {
  return {
    ...{
      resellerId: faker.number.float(),
      durationDays: faker.number.float(),
      lastActivationDate: faker.date.anytime().toISOString(),
      includedWeldCredits: faker.number.float(),
      type: Object.assign({}, createLicenseTypeFaker()),
    },
    ...(data || {}),
  }
}
