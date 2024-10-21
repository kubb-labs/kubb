import type { UserArray } from '../models/UserArray.ts'
import { createUser } from './createUser.ts'
import { faker } from '@faker-js/faker'

export function createUserArray(data?: Partial<UserArray>) {
  faker.seed([220])
  return [...(faker.helpers.multiple(() => createUser()) as any), ...(data || [])]
}
