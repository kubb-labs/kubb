import type { UserArray } from '../models/ts/UserArray'
import { createUser } from './createUser'
import { faker } from '@faker-js/faker'

export function createUserArray(data: NonNullable<Partial<UserArray>> = []): NonNullable<UserArray> {
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...data]
}
