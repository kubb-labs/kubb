import { faker } from '@faker-js/faker'
import type { Category } from '../models/Category'

export function createCategory(override: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  return {
    ...{ 'id': faker.number.float({}), 'name': faker.commerce.productName() },
    ...override,
  }
}
