import { Tag } from '../models/Tag'
import { faker } from '@faker-js/faker'

export function createTag(): NonNullable<Tag> {
  return { id: faker.number.float({}), name: faker.string.alpha() }
}
