import { createUser } from './createUser'
import { UserArray } from '../models/ts/UserArray'
import { faker } from '@faker-js/faker'

export function createUserArray(): NonNullable<UserArray> {
  return faker.helpers.arrayElements([createUser()]) as any
}
