import type { GetUserByNamePathParams } from '../../models/GetUserByName.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathParams(data: NonNullable<Partial<GetUserByNamePathParams>> = {}) {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetUserByName200() {
  faker.seed([220])
  return createUser()
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400() {
  faker.seed([220])
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404() {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createGetUserByNameQueryResponse() {
  faker.seed([220])
  return createUser()
}
