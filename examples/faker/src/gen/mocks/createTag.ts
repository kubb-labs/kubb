import { faker } from '@faker-js/faker'

export function createTag() {
  return { id: faker.number.float({}), name: faker.string.alpha({}) }
}
