import { faker } from '@faker-js/faker'
import type { Category } from '../models/ts/Category'

export function createCategory(data: NonNullable<Partial<Category>> = {}): NonNullable<Category> {
  return {
    ...{ id: faker.number.int(), name: faker.string.alpha() },
    ...data,
  }
}
