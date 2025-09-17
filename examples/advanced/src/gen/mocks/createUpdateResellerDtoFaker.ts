import type { UpdateResellerDto } from '../models/ts/UpdateResellerDto.ts'
import { faker } from '@faker-js/faker'

export function createUpdateResellerDtoFaker(data?: Partial<UpdateResellerDto>): UpdateResellerDto {
  return {
    ...{ name: faker.string.alpha() },
    ...(data || {}),
  }
}
