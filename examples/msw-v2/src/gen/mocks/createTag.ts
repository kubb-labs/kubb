import { faker } from '@faker-js/faker'
import type { Tag } from '../models/Tag'

export function createTag(): NonNullable<Tag> {
  faker.seed([220])
  return { 'id': faker.number.float({}), 'name': faker.string.alpha() }
}
