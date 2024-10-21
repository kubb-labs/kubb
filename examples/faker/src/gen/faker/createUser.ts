import type { User } from '../models/User.ts'
import { faker } from '@faker-js/faker'

export function createUser(data?: Partial<User>) {
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
      nationalityCode: faker.helpers.arrayElement<any>([faker.string.alpha(), faker.helpers.fromRegExp(/^[A-Z]{2}$/)]),
    },
    ...(data || {}),
  }
}
