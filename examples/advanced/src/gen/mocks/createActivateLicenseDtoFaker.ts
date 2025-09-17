import type { ActivateLicenseDto } from '../models/ts/ActivateLicenseDto.ts'
import { faker } from '@faker-js/faker'

export function createActivateLicenseDtoFaker(data?: Partial<ActivateLicenseDto>): ActivateLicenseDto {
  return {
    ...{ tenantId: faker.number.float() },
    ...(data || {}),
  }
}
