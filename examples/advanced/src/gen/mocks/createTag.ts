import { Tag } from '../models/ts/Tag'
import { faker } from '@faker-js/faker'

export function createTag(): NonNullable<Tag> {
  return { 'id': faker.number.float({}), 'name': faker.string.alpha() }
}
