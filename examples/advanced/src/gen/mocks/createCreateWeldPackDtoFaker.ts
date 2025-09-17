import type { CreateWeldPackDto } from '../models/ts/CreateWeldPackDto.ts'
import { createWeldPackTypeFaker } from './createWeldPackTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createCreateWeldPackDtoFaker(data?: Partial<CreateWeldPackDto>): CreateWeldPackDto {
  return {
    ...{
      resellerId: faker.number.float(),
      durationDays: faker.number.float(),
      lastActivationDate: faker.date.anytime().toISOString(),
      initialWeldCredits: faker.number.int(),
      type: Object.assign({}, createWeldPackTypeFaker()),
    },
    ...(data || {}),
  }
}
