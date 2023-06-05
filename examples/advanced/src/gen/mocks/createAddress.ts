import { faker } from '@faker-js/faker'

export function createAddress() {
  return { street: faker.string.alpha({}), city: faker.string.alpha({}), state: faker.string.alpha({}), zip: faker.string.alpha({}) }
}
