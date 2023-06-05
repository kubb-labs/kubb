import { faker } from '@faker-js/faker'

/**
 * @description Invalid username supplied
 */

export function createDeleteUser400() {
  return undefined
}

/**
 * @description User not found
 */

export function createDeleteUser404() {
  return undefined
}

export function createDeleteUserMutationResponse() {
  return undefined
}

export function createDeleteUserPathParams() {
  return { username: faker.string.alpha({}) }
}
