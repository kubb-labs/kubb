import { createUser } from '../createUser.ts'

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

export function createCreateUserMutationResponse() {
  return undefined
}
