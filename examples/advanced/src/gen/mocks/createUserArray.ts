import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/ts/UserArray'
import { createUser } from './createUser'

export function createUserArray(data: NonNullable<Partial<UserArray>> = []): NonNullable<UserArray> {
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...data]
}
