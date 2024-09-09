import type { GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName.ts'
import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathParams(data: NonNullable<Partial<GetUserByNamePathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetUserByName200() {
  return createUser()
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400() {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404() {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetUserByNameQueryResponse() {
  return createUser()
}
