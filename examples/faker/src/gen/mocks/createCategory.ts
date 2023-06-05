import { faker } from '@faker-js/faker'

export function createCategory() {
  return { id: faker.number.float({}), name: faker.string.alpha({}) }
}
