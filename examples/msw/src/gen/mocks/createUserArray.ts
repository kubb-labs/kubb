import { faker } from '@faker-js/faker'

import { UserArray } from '../models/UserArray'
import { createUser } from './createUser'

export function createUserArray(): NonNullable<UserArray> {
  return faker.helpers.arrayElements([createUser()]) as any
}
