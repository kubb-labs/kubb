import { faker } from '@faker-js/faker'

import { Category } from '../models/ts/Category'
export function createCategory(): Category {
  return { id: faker.number.float({}), name: faker.string.alpha() }
}
