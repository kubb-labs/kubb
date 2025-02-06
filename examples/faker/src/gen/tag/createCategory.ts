import type { Category } from '../models/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategory(data?: Partial<Category>): Partial<Category> {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
