import { faker } from '@faker-js/faker'
import type { Category } from '../models/ts/Category'

export function createCategory(override: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  return {
    ...{ 'id': faker.number.float({}), 'name': faker.string.alpha() },
    ...override,
  }
}
