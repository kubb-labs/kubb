import type { Category } from '../models/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategory(data: NonNullable<Partial<Category>> = {}) {
  faker.seed([220])
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
