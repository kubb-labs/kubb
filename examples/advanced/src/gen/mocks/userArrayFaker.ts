import type { UserArray } from '../models/ts/userArray.ts'
import { createUserFaker } from './userFaker.ts'
import { faker } from '@faker-js/faker'

export function createUserArrayFaker(data?: UserArray): UserArray {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])]
}
