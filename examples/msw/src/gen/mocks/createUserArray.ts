import { createUser } from './createUser'
import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/UserArray'

export function createUserArray(): NonNullable<UserArray> {
  return faker.helpers.arrayElements([createUser()]) as any
}
