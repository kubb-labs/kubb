import { Category } from '../models/ts/Category'
import { faker } from '@faker-js/faker'

export function createCategory(): NonNullable<Category> {
  return { 'id': faker.number.float({}), 'name': faker.string.alpha() }
}
