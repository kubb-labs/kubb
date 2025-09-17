import type { UpdateLicenseDto } from '../models/ts/UpdateLicenseDto.ts'
import { createLicenseTypeFaker } from './createLicenseTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateLicenseDtoFaker(data?: Partial<UpdateLicenseDto>): UpdateLicenseDto {
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
