import { faker } from '@faker-js/faker'

import { createUser } from './createUser'
import { UserArray } from '../models/ts/UserArray'

export function createUserarray(): UserArray {
  return faker.helpers.arrayElements([createUser()]) as any
}
