import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/ts/userArray.ts'
import { createUserFaker } from './userFaker.ts'

export function createUserArrayFaker(data?: UserArray): UserArray {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}
