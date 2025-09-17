import type { SimulatePartDto } from '../models/ts/SimulatePartDto.ts'
import { faker } from '@faker-js/faker'

export function createSimulatePartDtoFaker(data?: Partial<SimulatePartDto>): SimulatePartDto {
  return {
    ...{ simulatedWelds: faker.helpers.multiple(() => faker.string.alpha()) },
    ...(data || {}),
  }
}
