import { createUser } from '../createUser'

export function createCreateUserMutationResponse() {
  return undefined
}

/**
 * @description successful operation
 */

export function createCreateUserError() {
  return createUser()
}

/**
 * @description Created user object
 */

export function createCreateUserMutationRequest() {
  return createUser()
}
