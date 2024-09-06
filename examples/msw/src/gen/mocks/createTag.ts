import type { Tag } from '../models/Tag.ts'
import { faker } from '@faker-js/faker'

export function createTag(data: NonNullable<Partial<Tag>> = {}): NonNullable<Tag> {
  faker.seed([220])
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
