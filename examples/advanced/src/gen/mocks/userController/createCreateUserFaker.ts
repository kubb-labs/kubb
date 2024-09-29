import { createUserFaker } from '../createUserFaker.ts'

/**
 * @description successful operation
 */
export function createCreateUserErrorFaker() {
  return createUserFaker()
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequestFaker() {
  return createUserFaker()
}

export function createCreateUserMutationResponseFaker() {
  return undefined
}
