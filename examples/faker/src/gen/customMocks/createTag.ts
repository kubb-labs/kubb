import { faker } from '@faker-js/faker'
import type { Tag } from '../models/Tag'

export function createTag(data: NonNullable<Partial<Tag>> = {}): NonNullable<Tag> {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
