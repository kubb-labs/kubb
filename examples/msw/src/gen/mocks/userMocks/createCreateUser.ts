import { createUser } from '../createUser.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createCreateUserError() {
  faker.seed([220])
  return createUser()
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest() {
  faker.seed([220])
  return createUser()
}

export function createCreateUserMutationResponse() {
  faker.seed([220])
  return undefined
}
