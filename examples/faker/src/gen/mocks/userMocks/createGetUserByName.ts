import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'

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

export function createGetUserByNamePathParams() {
  return { username: faker.string.alpha({}) }
}

/**
 * @description successful operation
 */

export function createGetUserByNameQueryResponse() {
  return createUser()
}
