import { faker } from '@faker-js/faker'

import { createUser } from './createUser'

/**
 * @description successful operation
 */

export function createUpdateUserError() {
  return undefined
}

export function createUpdateUserMutationResponse() {
  return undefined
}

export function createUpdateUserPathParams() {
  return { username: faker.string.alpha({}) }
}

/**
 * @description Update an existent user in the store
 */

export function createUpdateUserMutationRequest() {
  return createUser()
}
