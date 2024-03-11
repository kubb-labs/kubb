import { faker } from '@faker-js/faker'
import type { Category } from '../models/Category'

export function createCategory(override: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  return {
    ...{ 'id': faker.number.int({}), 'name': faker.commerce.productName() },
    ...override,
  }
}
