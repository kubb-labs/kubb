import type { Category } from '../models/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategory(data: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
