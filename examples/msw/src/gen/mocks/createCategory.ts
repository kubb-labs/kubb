import { faker } from '@faker-js/faker'

import { Category } from '../models/Category'

export function createCategory(): Category {
  return { id: faker.number.float({}), name: faker.string.alpha() }
}
