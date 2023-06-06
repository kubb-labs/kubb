import { createUser } from '../createUser'

import type { CreateUserMutationResponse, CreateUserError, CreateUserMutationRequest } from '../../models/CreateUser'

export function createCreateUserMutationResponse(): CreateUserMutationResponse {
  return undefined
}

/**
 * @description successful operation
 */

export function createCreateUserError(): CreateUserError {
  return createUser()
}

/**
 * @description Created user object
 */

export function createCreateUserMutationRequest(): CreateUserMutationRequest {
  return createUser()
}
