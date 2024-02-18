import { faker } from '@faker-js/faker'
import type { Tag } from '../models/Tag'

export function createTag(override: NonNullable<Partial<Tag>> = {}): NonNullable<Tag> {
  return {
    ...{ 'id': faker.number.float({}), 'name': faker.string.alpha() },
    ...override,
  }
}
