import { faker } from '@faker-js/faker'
import type { Category } from '../models/Category'

export function createCategory(override: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  faker.seed([220])
  return {
    ...{ 'id': faker.number.int(), 'name': faker.string.alpha() },
    ...override,
  }
}
