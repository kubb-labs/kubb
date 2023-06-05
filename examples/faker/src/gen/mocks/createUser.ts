import { faker } from '@faker-js/faker'

export function createUser() {
  return {
    id: faker.number.float({}),
    username: faker.string.alpha({}),
    firstName: faker.string.alpha({}),
    lastName: faker.string.alpha({}),
    email: faker.string.alpha({}),
    password: faker.string.alpha({}),
    phone: faker.string.alpha({}),
    userStatus: faker.number.float({}),
  }
}
