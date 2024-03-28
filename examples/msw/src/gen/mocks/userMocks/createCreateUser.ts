import type { CreateUserError, CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser'
import { createUser } from '../createUser'

/**
 * @description successful operation
 */
export function createCreateUserError(override?: NonNullable<Partial<CreateUserError>>): NonNullable<CreateUserError> {
  return createUser(override)
}

/**
 * @description Created user object
 */
export function createCreateUserMutationRequest(override?: NonNullable<Partial<CreateUserMutationRequest>>): NonNullable<CreateUserMutationRequest> {
  return createUser(override)
}

export function createCreateUserMutationResponse(override?: NonNullable<Partial<CreateUserMutationResponse>>): NonNullable<CreateUserMutationResponse> {
  return undefined
}
