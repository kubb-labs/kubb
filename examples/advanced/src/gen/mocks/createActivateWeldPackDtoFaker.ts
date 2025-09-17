import type { ActivateWeldPackDto } from '../models/ts/ActivateWeldPackDto.ts'
import { faker } from '@faker-js/faker'

export function createActivateWeldPackDtoFaker(data?: Partial<ActivateWeldPackDto>): ActivateWeldPackDto {
  return {
    ...{ tenantId: faker.number.float() },
    ...(data || {}),
  }
}
