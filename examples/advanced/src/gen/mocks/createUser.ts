import type { User } from '../models/ts/User.ts'
import { faker } from '@faker-js/faker'

export function createUser(data: NonNullable<Partial<User>> = {}): NonNullable<User> {
  return {
    ...{
      id: faker.number.int(),
      username: faker.string.alpha(),
      firstName: faker.string.alpha(),
      lastName: faker.string.alpha(),
      email: faker.string.alpha(),
      password: faker.string.alpha(),
      phone: faker.string.alpha(),
      userStatus: faker.number.int(),
    },
    ...data,
  }
}
