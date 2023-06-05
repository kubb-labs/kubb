import { faker } from '@faker-js/faker'

import { createUser } from '../createUser'

/**
 * @description successful operation
 */

export function createCreateUsersWithListInputError() {
  return undefined
}

export function createCreateUsersWithListInputMutationRequest() {
  return faker.helpers.arrayElement([createUser()])
}

/**
 * @description Successful operation
 */

export function createCreateUsersWithListInputMutationResponse() {
  return createUser()
}
