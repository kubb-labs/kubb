import type { Category } from '../models/ts/Category.ts'
import { faker } from '@faker-js/faker'

export function createCategoryFaker(data?: Partial<Category>): Category {
  return {
    ...{ id: faker.number.bigInt(), name: faker.string.alpha() },
    ...(data || {}),
  }
}
