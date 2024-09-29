import type { GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName.js'
import { createUserFaker } from '../createUserFaker.js'
import { faker } from '@faker-js/faker'

export function createGetUserByNamePathParamsFaker(data: NonNullable<Partial<GetUserByNamePathParams>> = {}) {
  return {
    ...{ username: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetUserByName200Faker() {
  return createUserFaker()
}

/**
 * @description Invalid username supplied
 */
export function createGetUserByName400Faker() {
  return undefined
}

/**
 * @description User not found
 */
export function createGetUserByName404Faker() {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetUserByNameQueryResponseFaker() {
  return createUserFaker()
}
