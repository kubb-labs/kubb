import type { CreateResellerDto } from '../models/ts/CreateResellerDto.ts'
import { faker } from '@faker-js/faker'

export function createCreateResellerDtoFaker(data?: Partial<CreateResellerDto>): CreateResellerDto {
  return {
    ...{ name: faker.string.alpha() },
    ...(data || {}),
  }
}
