import type { UpdateWeldPackDto } from '../models/ts/UpdateWeldPackDto.ts'
import { createWeldPackTypeFaker } from './createWeldPackTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createUpdateWeldPackDtoFaker(data?: Partial<UpdateWeldPackDto>): UpdateWeldPackDto {
  return {
    ...{
      resellerId: faker.number.float(),
      durationDays: faker.number.float(),
      lastActivationDate: faker.date.anytime().toISOString(),
      initialWeldCredits: faker.number.float(),
      type: Object.assign({}, createWeldPackTypeFaker()),
    },
    ...(data || {}),
  }
}
